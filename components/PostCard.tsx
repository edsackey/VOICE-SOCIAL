
import React, { useState } from 'react';
import { DBPost, DBUser, DBLike, DBComment } from '../types';
import { StorageService } from '../services/storageService';

interface PostCardProps {
  post: DBPost;
  author: DBUser;
  currentUser: DBUser;
  onRefresh: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, author, currentUser, onRefresh }) => {
  const [commentText, setCommentText] = useState('');
  const likes = StorageService.getLikesForPost(post.id);
  const comments = StorageService.getCommentsForPost(post.id);
  const isLiked = likes.some(l => l.userId === currentUser.id);
  const isFollowingAuthor = StorageService.isFollowing(currentUser.id, author.id);
  const isOwnPost = currentUser.id === author.id;

  const handleLike = () => {
    StorageService.toggleLike(currentUser.id, post.id);
    onRefresh();
  };

  const handleFollow = () => {
    StorageService.toggleFollow(currentUser.id, author.id);
    onRefresh();
  };

  const handleShare = async () => {
    const text = `Check out this post on VOICE ROOM LIVE by ${author.displayName}: "${post.content.slice(0, 50)}..."`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VOICE ROOM LIVE Pulse',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert("Post details copied to clipboard!");
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    StorageService.addComment({
      id: `comm-${Date.now()}`,
      userId: currentUser.id,
      postId: post.id,
      text: commentText,
      createdAt: Date.now()
    });
    setCommentText('');
    onRefresh();
  };

  return (
    <div className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={author.profilePictureUrl || `https://picsum.photos/seed/${author.id}/100`} 
          className="w-10 h-10 rounded-2xl object-cover border-2 border-indigo-50" 
          alt={author.displayName}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-gray-900">{author.displayName}</h4>
            {!isOwnPost && (
              <button 
                onClick={handleFollow}
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border transition-all ${isFollowingAuthor ? 'bg-gray-100 text-gray-400 border-gray-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white'}`}
              >
                {isFollowingAuthor ? 'Following' : '+ Follow'}
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">@{author.username}</p>
        </div>
        <span className="ml-auto text-[9px] text-gray-300 font-black uppercase tabular-nums">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed font-medium mb-4">{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} className="w-full h-64 object-cover rounded-[32px] shadow-inner" alt="Post content" />
        )}
      </div>

      <div className="flex items-center gap-6 border-t border-gray-50 pt-4">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 group transition-all ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
        >
          <div className={`p-2 rounded-xl transition-colors ${isLiked ? 'bg-pink-50' : 'bg-gray-50 group-hover:bg-pink-50'}`}>
            <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <span className="text-xs font-black">{likes.length}</span>
        </button>

        <div className="flex items-center gap-2 text-gray-400">
          <div className="p-2 bg-gray-50 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <span className="text-xs font-black">{comments.length}</span>
        </div>

        <button 
          onClick={handleShare}
          className="ml-auto flex items-center gap-2 text-gray-400 hover:text-indigo-600 group transition-all"
        >
          <div className="p-2 bg-gray-50 group-hover:bg-indigo-50 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
        </button>
      </div>

      {comments.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-indigo-50">
          {comments.map(c => {
            const commenter = StorageService.getUser(c.userId);
            return (
              <div key={c.id} className="text-[11px]">
                <span className="font-black text-indigo-600 mr-2">@{commenter?.username}</span>
                <span className="text-gray-600 font-medium">{c.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleComment} className="mt-4 flex gap-2">
        <input 
          type="text" 
          placeholder="Add a comment..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <button type="submit" className="text-indigo-600 font-black text-[10px] uppercase tracking-widest px-3">Post</button>
      </form>
    </div>
  );
};

export default PostCard;
