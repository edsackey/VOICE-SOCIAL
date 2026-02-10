
import React, { useState, useRef, useEffect } from 'react';
import { MediaState, MediaType, BackgroundAudio, PlaylistTrack, PodcastRecord } from '../types';
import { generateSlideContent } from '../services/geminiService';
import { BIBLE_BOOKS } from '../constants/books';
import { StorageService } from '../services/storageService';
import { auth, storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

interface MediaConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMedia: (media: MediaState) => void;
  roomTopic: string;
  roomPoster?: string;
  transcriptionHistory: string[];
  audioTracks: PlaylistTrack[];
  onUpdateAudioTracks: (tracks: PlaylistTrack[]) => void;
  currentMedia: MediaState;
  canPostAds?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'ppt';
  url: string;
}

const MediaConsole: React.FC<MediaConsoleProps> = ({ 
  isOpen, 
  onClose, 
  onUpdateMedia, 
  roomTopic, 
  roomPoster,
  transcriptionHistory,
  audioTracks,
  onUpdateAudioTracks,
  currentMedia,
  canPostAds
}) => {
  const [activeApp, setActiveApp] = useState<'hub' | 'present' | 'scripture' | 'ads'>('hub');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Persistent Background / Atmosphere State (Pad)
  const [bgSound, setBgSound] = useState<BackgroundAudio | null>(() => {
    const saved = localStorage.getItem('eh_custom_bg_sound');
    return saved ? JSON.parse(saved) : null;
  });
  const [isBgPlaying, setIsBgPlaying] = useState(false);
  const [bgVolume, setBgVolume] = useState(0.3);

  // Music Playlist State
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicLooping, setIsMusicLooping] = useState(false);

  // Presentations State (PPT + Images)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGeneratingAiSlide, setIsGeneratingAiSlide] = useState(false);
  
  // Bible & Lyrics State
  const [bibleBook, setBibleBook] = useState('Psalms');
  const [bibleRef, setBibleRef] = useState('23:1');
  const [bibleContent, setBibleContent] = useState('');
  const [lyricContent, setLyricContent] = useState('');

  // Ad Builder State
  const [adTitle, setAdTitle] = useState('');
  const [adMessage, setAdMessage] = useState('');

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const presentationFileInputRef = useRef<HTMLInputElement>(null);

  // Sync atmosphere audio
  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = bgVolume;
      if (isBgPlaying && bgSound) {
        bgAudioRef.current.play().catch(() => {});
      } else {
        bgAudioRef.current.pause();
      }
    }
  }, [isBgPlaying, bgVolume, bgSound]);

  // Sync music audio
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = musicVolume;
      musicAudioRef.current.loop = isMusicLooping;
      if (isMusicPlaying && activeTrackId) {
        musicAudioRef.current.play().catch(() => {});
      } else {
        musicAudioRef.current.pause();
      }
    }
  }, [isMusicPlaying, musicVolume, activeTrackId, isMusicLooping]);

  // Fetch persistent library on open
  useEffect(() => {
    if (isOpen && auth.currentUser) {
      StorageService.getMediaLibrary(auth.currentUser.uid).then(onUpdateAudioTracks);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = auth.currentUser;
    if (!file || !user) return;
    
    setIsUploading(true);
    try {
      const sRef = ref(storage, `media/${user.uid}/bg_${Date.now()}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      const newBg: BackgroundAudio = { id: 'custom-pad', name: file.name, url: url, isPlaying: false, volume: bgVolume, loop: true };
      setBgSound(newBg);
      localStorage.setItem('eh_custom_bg_sound', JSON.stringify(newBg));
      setIsBgPlaying(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const user = auth.currentUser;
    if (!files || !user) return;

    setIsUploading(true);
    try {
      const filesArray = Array.from(files) as File[];
      for (const f of filesArray) {
        const sRef = ref(storage, `media/${user.uid}/track_${Date.now()}_${f.name}`);
        await uploadBytes(sRef, f);
        const url = await getDownloadURL(sRef);
        const track: PlaylistTrack = {
          id: Math.random().toString(36).substr(2, 9),
          name: f.name,
          url: url,
          size: f.size,
          type: f.type
        };
        await StorageService.saveMediaToLibrary(user.uid, track);
      }
      const library = await StorageService.getMediaLibrary(user.uid);
      onUpdateAudioTracks(library);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePresentationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const user = auth.currentUser;
    if (!files || !user) return;

    setIsUploading(true);
    try {
      const filesArray = Array.from(files) as File[];
      for (const f of filesArray) {
        const sRef = ref(storage, `media/${user.uid}/visual_${Date.now()}_${f.name}`);
        await uploadBytes(sRef, f);
        const url = await getDownloadURL(sRef);
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: f.name,
          type: f.name.toLowerCase().endsWith('.ppt') || f.name.toLowerCase().endsWith('.pptx') ? 'ppt' : 'image',
          url: url
        };
        setUploadedFiles(prev => [...prev, newFile]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleMusicTrack = (id: string) => {
    if (activeTrackId === id) {
      setIsMusicPlaying(!isMusicPlaying);
    } else {
      const track = audioTracks.find(t => t.id === id);
      if (track && musicAudioRef.current) {
        musicAudioRef.current.src = track.url;
        setActiveTrackId(id);
        setIsMusicPlaying(true);
      }
    }
  };

  const shareMusicToStage = (id?: string) => {
    const trackId = id || activeTrackId;
    const track = audioTracks.find(t => t.id === trackId);
    if (track) {
      onUpdateMedia({ type: 'music_info', title: track.name, isPulsing: true });
    }
  };

  const handleAiSparkSlide = async () => {
    setIsGeneratingAiSlide(true);
    try {
      const content = await generateSlideContent(roomTopic, transcriptionHistory);
      onUpdateMedia({ type: 'slide', title: content.title, content: content.content, isPulsing: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAiSlide(false);
    }
  };

  const activeTrack = audioTracks.find(t => t.id === activeTrackId);

  return (
    <>
      {bgSound && <audio ref={bgAudioRef} src={bgSound.url} loop />}
      <audio ref={musicAudioRef} onEnded={() => !isMusicLooping && setIsMusicPlaying(false)} />

      {isMinimized && (
        <div className="fixed bottom-32 right-8 z-[700] animate-in slide-in-from-right-8 duration-500">
           <div className="bg-secondary/95 backdrop-blur-2xl border border-white/10 rounded-[40px] p-5 shadow-2xl flex items-center gap-6 ring-1 ring-black/5">
              <div onClick={() => setIsMinimized(false)} className={`w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all relative ${isMusicPlaying ? 'animate-pulse' : ''}`}>
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-accent rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5" /></svg></div>
              </div>
              <div className="flex flex-col gap-1 pr-4 min-w-[120px]">
                 <p className="text-[8px] font-black text-accent uppercase tracking-widest leading-none">Stage Active</p>
                 <h4 className="text-[11px] font-bold text-main truncate max-w-[150px] uppercase">{activeTrack ? activeTrack.name : 'Atmosphere Only'}</h4>
                 <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setIsMusicPlaying(!isMusicPlaying)} className="text-accent hover:text-white transition-colors">{isMusicPlaying ? 'Stop' : 'Play'}</button>
                    <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-16 h-1 bg-white/10 rounded-full appearance-none accent-accent" />
                 </div>
              </div>
           </div>
        </div>
      )}

      {!isMinimized && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-7xl bg-main rounded-[60px] overflow-hidden shadow-2xl flex flex-col h-[92vh] border border-white/10">
            {/* Header */}
            <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-secondary/50 shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-main uppercase tracking-tight italic">Host Stage Console</h2>
                  <div className="flex items-center gap-3">
                     <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isUploading ? 'bg-orange-500' : 'bg-green-500'}`} />
                     <p className="text-[10px] text-muted font-bold uppercase tracking-[0.4em]">{isUploading ? 'HUB SYNCHRONIZING...' : 'Unified Control Cluster • Session Active'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="text-right">
                       <p className="text-[8px] font-black text-accent uppercase tracking-widest leading-none mb-1">On Stage Now</p>
                       <p className="text-[11px] font-bold text-white uppercase truncate max-w-[150px]">{currentMedia.type !== 'none' ? currentMedia.type : 'Default Hub'}</p>
                    </div>
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 animate-pulse"><div className="w-1.5 h-1.5 bg-accent rounded-full" /></div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setIsMinimized(true)} className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg></button>
                    <button onClick={onClose} className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                 </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* SIDEBAR NAVIGATION */}
              <div className="w-72 bg-secondary/30 border-r border-white/5 p-8 flex flex-col gap-3 shrink-0 overflow-y-auto no-scrollbar">
                {[
                  { id: 'hub', label: 'Audio & Status', icon: '🔊', desc: 'Main Control' },
                  { id: 'present', label: 'Presentations', icon: '📽️', desc: 'Slides & PPT' },
                  { id: 'scripture', label: 'Bible & Lyrics', icon: '📖', desc: 'Worship Tools' },
                  { id: 'ads', label: 'Monetization', icon: '💎', desc: 'Sponsorships', visible: canPostAds },
                ].filter(t => t.visible !== false).map(app => (
                  <button
                    key={app.id}
                    onClick={() => setActiveApp(app.id as any)}
                    className={`flex flex-col items-start gap-1 p-6 rounded-[32px] transition-all relative group ${activeApp === app.id ? 'bg-accent text-white shadow-2xl shadow-accent/20' : 'text-muted hover:bg-white/5 hover:text-main'}`}
                  >
                    <span className="text-2xl mb-1">{app.icon}</span>
                    <span className="font-black text-xs uppercase tracking-widest">{app.label}</span>
                    <span className={`text-[8px] font-bold uppercase opacity-50 ${activeApp === app.id ? 'text-white' : 'text-muted'}`}>{app.desc}</span>
                  </button>
                ))}

                {/* Atmosphere Controls (Persistent) */}
                <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
                   <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] ml-2">Atmosphere Pad</h3>
                   {bgSound ? (
                     <div className="bg-accent/10 border border-accent/20 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                           <p className="text-[10px] font-black uppercase text-main truncate">{bgSound.name}</p>
                           <button onClick={() => setIsBgPlaying(!isBgPlaying)} className={`p-2 rounded-xl ${isBgPlaying ? 'bg-accent text-white' : 'bg-white/10 text-muted'}`}>
                             {isBgPlaying ? 'Stop' : 'Play'}
                           </button>
                        </div>
                        <input type="range" min="0" max="1" step="0.01" value={bgVolume} onChange={(e) => setBgVolume(parseFloat(e.target.value))} className="w-full h-1 bg-main rounded-full appearance-none accent-accent" />
                     </div>
                   ) : (
                     <button onClick={() => bgFileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center gap-3 text-muted hover:border-accent/30 transition-all">
                        <svg className="w-6 h-6 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Load Ambience</span>
                        <input type="file" ref={bgFileInputRef} className="hidden" accept="audio/*" onChange={handleBgUpload} />
                     </button>
                   )}
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-main/40">
                
                {activeApp === 'hub' && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-right-8">
                      {/* Audio Deck */}
                      <div className="bg-secondary rounded-[48px] p-10 border border-white/5 shadow-xl flex flex-col items-center text-center relative overflow-hidden group">
                         <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className={`w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center mb-8 shadow-2xl relative z-10 ${isMusicPlaying ? 'animate-pulse' : ''}`}>
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                         </div>
                         <h3 className="text-xl font-black text-main uppercase tracking-tighter mb-1 relative z-10">{activeTrackId ? audioTracks.find(t => t.id === activeTrackId)?.name : 'Ready to Broadcast'}</h3>
                         <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-10 relative z-10">Broadcast Playlist Deck</p>
                         
                         <div className="w-full space-y-6 relative z-10 mb-10">
                            <div className="flex justify-between text-[10px] font-black text-accent uppercase tracking-widest"><span>Music Level</span><span>{Math.round(musicVolume * 100)}%</span></div>
                            <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-main/50 rounded-full appearance-none accent-accent cursor-pointer" />
                         </div>

                         {activeTrackId && (
                           <button onClick={() => shareMusicToStage()} className="w-full py-5 rounded-[24px] bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-accent hover:text-white transition-all active:scale-95">Push Info to Stage</button>
                         )}
                      </div>

                      {/* Tracks & Playlist Hub */}
                      <div className="space-y-6">
                         <div className="flex justify-between items-center px-4">
                            <h4 className="text-[11px] font-black text-muted uppercase tracking-widest">Your Tracks ({audioTracks.length})</h4>
                            <button onClick={() => musicFileInputRef.current?.click()} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">+ Add Hub Media</button>
                            <input type="file" ref={musicFileInputRef} className="hidden" accept="audio/*" multiple onChange={handleMusicUpload} />
                         </div>
                         <div className="space-y-3">
                            {audioTracks.map(track => (
                               <div key={track.id} className={`p-6 rounded-[32px] border transition-all flex items-center justify-between ${activeTrackId === track.id ? 'bg-accent/10 border-accent/20' : 'bg-secondary border-white/5 hover:border-white/10'}`}>
                                  <div className="flex items-center gap-5 overflow-hidden">
                                     <button onClick={() => toggleMusicTrack(track.id)} className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${activeTrackId === track.id && isMusicPlaying ? 'bg-accent text-white' : 'bg-main text-accent'}`}>
                                        {activeTrackId === track.id && isMusicPlaying ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8v4l5-2-5-2z" clipRule="evenodd" /></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                                     </button>
                                     <p className="text-[11px] font-black uppercase text-main truncate">{track.name}</p>
                                  </div>
                                  <button onClick={() => onUpdateAudioTracks(audioTracks.filter(t => t.id !== track.id))} className="p-3 text-muted hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                )}

                {activeApp === 'present' && (
                  <div className="space-y-12 animate-in slide-in-from-right-8">
                    <div className="bg-indigo-600 p-12 rounded-[56px] shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                       <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] -mr-40 -mt-40" />
                       <div className="max-w-xl relative z-10 text-center md:text-left">
                          <h3 className="text-5xl font-black uppercase tracking-tighter italic mb-4">Visual Hub</h3>
                          <p className="text-xl text-indigo-100 font-medium leading-relaxed opacity-90 italic">Broadcasting your persistent slides and visuals directly to the Hub stage projector.</p>
                       </div>
                       <button onClick={() => presentationFileInputRef.current?.click()} className="bg-white text-indigo-600 px-16 py-8 rounded-[40px] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all relative z-10 shrink-0">Upload Assets</button>
                       <input type="file" ref={presentationFileInputRef} className="hidden" accept="image/*, .ppt, .pptx" multiple onChange={handlePresentationUpload} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                       <div className="lg:col-span-3 space-y-8">
                          <div className="flex justify-between items-center px-4">
                             <h4 className="text-[11px] font-black text-muted uppercase tracking-widest italic">Staged Assets ({uploadedFiles.length})</h4>
                             {uploadedFiles.length > 0 && <button onClick={() => setUploadedFiles([])} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline">Flush Vault</button>}
                          </div>
                          
                          {uploadedFiles.length === 0 ? (
                            <div className="py-40 text-center border-4 border-dashed border-white/5 rounded-[64px] bg-secondary/20">
                               <p className="text-sm font-black text-muted uppercase tracking-[0.5em] italic">No presentation files staged</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                               {uploadedFiles.map(file => (
                                 <div key={file.id} className="aspect-video bg-secondary rounded-[40px] overflow-hidden border-2 border-white/5 relative group shadow-2xl hover:border-accent transition-all">
                                    {file.type === 'ppt' ? (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-600/10 gap-4">
                                         <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                                         <p className="text-[10px] font-black text-white uppercase text-center px-6 truncate w-full">{file.name}</p>
                                      </div>
                                    ) : <img src={file.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={file.name} />}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 gap-4 backdrop-blur-sm">
                                       <button onClick={() => onUpdateMedia({ type: 'slide', title: file.name, imageUrl: file.type === 'image' ? file.url : undefined, content: file.type === 'ppt' ? "Presentation Resource Active" : "", isPulsing: true })} className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl hover:bg-accent hover:text-white transition-all">Project Slide</button>
                                       <button onClick={() => setUploadedFiles(uploadedFiles.filter(f => f.id !== file.id))} className="text-[8px] font-black text-white/50 uppercase tracking-widest hover:text-red-400">Delete Asset</button>
                                    </div>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>

                       <div className="space-y-8">
                          <h4 className="text-[11px] font-black text-muted uppercase tracking-widest italic px-4">Neural Studio</h4>
                          <div className="bg-secondary p-10 rounded-[48px] border border-white/5 space-y-10 shadow-xl">
                             <div className="space-y-4">
                                <div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">✨</div><p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">AI Hub Assistant</p></div>
                                <button onClick={handleAiSparkSlide} disabled={isGeneratingAiSlide} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                                   {isGeneratingAiSlide ? 'Analyzing Session...' : 'Spark Global Slide'}
                                </button>
                             </div>
                             <div className="h-px bg-white/5" />
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Quick Visual Note</p>
                                <textarea placeholder="Type message for stage..." value={bibleContent} onChange={e => setBibleContent(e.target.value)} className="w-full bg-main border border-white/5 rounded-[24px] p-6 text-xs font-bold text-white h-32 resize-none outline-none focus:border-accent" />
                                <button onClick={() => onUpdateMedia({ type: 'slide', title: "ANNOUNCEMENT", content: bibleContent, isPulsing: true })} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent hover:text-white transition-all shadow-xl">Broadcast Note</button>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeApp === 'scripture' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-right-8">
                    {/* BIBLE HUB */}
                    <div className="bg-slate-900 rounded-[56px] p-12 border border-white/5 shadow-2xl space-y-10">
                       <div className="flex items-center gap-6"><div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">📖</div><div><h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Bible Hub</h3><p className="text-xs font-bold text-accent uppercase tracking-widest">Scripture Orchestrator</p></div></div>
                       <div className="grid grid-cols-2 gap-4">
                          <select value={bibleBook} onChange={e => setBibleBook(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-accent appearance-none cursor-pointer">{BIBLE_BOOKS.map(book => <option key={book} value={book}>{book}</option>)}</select>
                          <input type="text" value={bibleRef} onChange={e => setBibleRef(e.target.value)} placeholder="Ref: 1:1" className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-accent" />
                       </div>
                       <textarea value={bibleContent} onChange={e => setBibleContent(e.target.value)} placeholder="Enter scripture..." className="w-full bg-black/40 border border-white/10 rounded-[32px] p-8 text-white font-serif text-lg italic outline-none focus:border-accent h-44 resize-none" />
                       <button onClick={() => onUpdateMedia({ type: 'scripture', content: bibleContent, reference: `${bibleBook} ${bibleRef}`, isPulsing: true })} className="w-full bg-white text-slate-900 py-7 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-xl hover:bg-accent hover:text-white transition-all active:scale-95">Push Verse to Stage</button>
                    </div>

                    {/* LYRIC HUB */}
                    <div className="bg-indigo-900/20 rounded-[56px] p-12 border border-indigo-500/10 shadow-2xl flex flex-col">
                       <div className="flex items-center gap-6 mb-10"><div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-3xl text-white">🎵</div><div><h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Lyric Suite</h3><p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Live Performance Support</p></div></div>
                       <div className="flex-1 space-y-6">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-4">Current Chorus / Verse</p>
                             <textarea value={lyricContent} onChange={e => setLyricContent(e.target.value)} placeholder="Type or paste lyrics here..." className="w-full bg-indigo-950/50 border border-indigo-500/20 rounded-[40px] p-10 text-white font-black text-2xl text-center italic outline-none focus:border-indigo-400 h-64 resize-none shadow-inner" />
                          </div>
                          <button onClick={() => onUpdateMedia({ type: 'lyric', content: lyricContent, title: activeTrack?.name || "LIVE WORSHIP", isPulsing: true })} className="w-full bg-indigo-600 text-white py-10 rounded-[48px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 shadow-indigo-500/20">Project Lyrics Live</button>
                       </div>
                    </div>
                  </div>
                )}

                {activeApp === 'ads' && (
                  <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8">
                     <div className="bg-orange-600 rounded-[64px] p-16 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:scale-125 transition-transform duration-[3000ms]" />
                        <div className="relative z-10">
                           <div className="flex items-center gap-6 mb-10">
                              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-2xl"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg></div>
                              <div><h3 className="text-4xl font-black uppercase tracking-tighter italic">Sponsor Hub</h3><p className="text-xs font-bold text-orange-200 uppercase tracking-widest">Global Monetization Deck</p></div>
                           </div>
                           <div className="space-y-8 max-w-xl">
                              <div className="space-y-4"><label className="text-[11px] font-black uppercase tracking-widest text-orange-100 ml-4">Promo Header</label><input type="text" value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Headline..." className="w-full bg-white/10 border-2 border-white/10 rounded-[28px] p-6 text-white font-black text-xl placeholder:text-white/30 outline-none focus:bg-white/20 transition-all" /></div>
                              <div className="space-y-4"><label className="text-[11px] font-black uppercase tracking-widest text-orange-100 ml-4">Campaign Message</label><textarea value={adMessage} onChange={e => setAdMessage(e.target.value)} placeholder="Context..." className="w-full bg-white/10 border-2 border-white/10 rounded-[40px] p-8 text-white font-medium text-lg placeholder:text-white/30 outline-none focus:bg-white/20 transition-all resize-none h-40" /></div>
                              <button onClick={() => onUpdateMedia({ type: 'advert', title: adTitle, content: adMessage, isPulsing: true })} disabled={!adTitle} className="w-full bg-white text-orange-600 py-10 rounded-[48px] font-black uppercase tracking-[0.5em] text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30">Push Ad to Global Stage</button>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Monitor Bar */}
            <div className="px-12 py-8 bg-secondary border-t border-white/5 flex items-center justify-between shrink-0">
               <div className="flex gap-10 items-center">
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${isMusicPlaying ? 'bg-accent animate-ping' : 'bg-slate-700'}`} />
                     <div><p className="text-[9px] font-black text-muted uppercase tracking-widest mb-0.5">Primary Audio</p><p className="text-[10px] font-black text-main uppercase">{activeTrack ? activeTrack.name : 'IDLE'}</p></div>
                  </div>
                  <div className="w-[1px] h-10 bg-white/5" />
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${currentMedia.type === 'slide' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`} />
                     <div><p className="text-[9px] font-black text-muted uppercase tracking-widest mb-0.5">Visual Buffer</p><p className="text-[10px] font-black text-main uppercase">{currentMedia.type === 'slide' ? 'PROJECTING' : 'READY'}</p></div>
                  </div>
               </div>
               <p className="text-[9px] text-muted/30 font-black uppercase tracking-[0.8em]">EchoHub Media Core Engine v6.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaConsole;
