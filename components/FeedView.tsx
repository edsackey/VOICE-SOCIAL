
import React, { useState, useEffect, useRef } from 'react';
import { DBPost, DBUser } from '../types';
import { StorageService } from '../services/storageService';
import PostCard from './PostCard';
import { transcribeAudio } from '../services/geminiService';

interface FeedViewProps {
  currentUser: DBUser;
}

const FeedView: React.FC<FeedViewProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const loadData = () => {
    setPosts(StorageService.getPosts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    
    const post: DBPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      content: newPostContent,
      createdAt: Date.now(),
      postType: 'text'
    };

    StorageService.savePost(post);
    setNewPostContent('');
    loadData();
    setIsPosting(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          const text = await transcribeAudio(base64Audio);
          setNewPostContent(prev => prev + (prev ? " " : "") + text);
          setIsTranscribing(false);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">The Pulse</h1>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Global Social Stream</p>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-indigo-50 mb-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -z-10 group-focus-within:scale-110 transition-transform" />
        <textarea 
          value={newPostContent}
          onChange={e => setNewPostContent(e.target.value)}
          placeholder={isTranscribing ? "Abena is transcribing..." : "What's happening in your corner of the Hub?"}
          className="w-full bg-transparent border-none p-0 text-lg font-medium focus:ring-0 placeholder:text-gray-300 min-h-[100px] resize-none"
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
              title="Voice Transcription"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button type="button" className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
          </div>
          <button 
            onClick={() => handleCreatePost()}
            disabled={isPosting || !newPostContent.trim() || isTranscribing}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30"
          >
            {isPosting ? 'Posting...' : 'Share Pulse'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            <p className="text-sm font-black uppercase tracking-widest">The stream is quiet...</p>
          </div>
        ) : (
          posts.map(post => {
            const author = StorageService.getUser(post.authorId);
            if (!author) return null;
            return (
              <PostCard 
                key={post.id} 
                post={post} 
                author={author} 
                currentUser={currentUser} 
                onRefresh={loadData}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default FeedView;
