
import React, { useState, useRef, useEffect } from 'react';
import { MediaState, MediaType, BackgroundAudio, PlaylistTrack, PodcastRecord } from '../types';
import { generateSlideContent, generateAdPoster } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { BIBLE_BOOKS } from '../constants/books';

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

const QUICK_VERSES = [
  { category: 'Worship', text: 'Sing to the Lord a new song; sing to the Lord, all the earth.', ref: 'Psalm 96:1' },
  { category: 'Strength', text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { category: 'Peace', text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
];

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
  const [activeTab, setActiveTab] = useState<MediaType | 'audio' | 'ads'>('audio');
  const [isMinimized, setIsMinimized] = useState(false);
  
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

  const [isGeneratingAiSlide, setIsGeneratingAiSlide] = useState(false);
  const [aiSlide, setAiSlide] = useState<{ title: string; content: string; imagePrompt: string } | null>(null);
  
  // Bible App State
  const [bibleBook, setBibleBook] = useState('Psalms');
  const [bibleRef, setBibleRef] = useState('23:1');
  const [bibleContent, setBibleContent] = useState('');

  // Presentation App State
  const [manualSlideTitle, setManualSlideTitle] = useState('');
  const [manualSlideContent, setManualSlideContent] = useState('');

  // Ad Builder State
  const [adTitle, setAdTitle] = useState('');
  const [adMessage, setAdMessage] = useState('');

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);

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

  // Ensure minimized state resets if closed from outside
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  // Handle core audio elements even if visuals are not shown (as long as isOpen is true)
  if (!isOpen) return null;

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newBg: BackgroundAudio = { id: 'custom-pad', name: file.name, url: url, isPlaying: false, volume: bgVolume, loop: true };
    setBgSound(newBg);
    localStorage.setItem('eh_custom_bg_sound', JSON.stringify(newBg));
    setIsBgPlaying(true);
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesArray = Array.from(files) as File[];
    const newTracks: PlaylistTrack[] = filesArray.slice(0, 3 - audioTracks.length).map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      type: f.type
    }));
    onUpdateAudioTracks([...audioTracks, ...newTracks]);
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
      onUpdateMedia({
        type: 'music_info',
        title: track.name,
        isPulsing: true
      });
    }
  };

  const removeMusicTrack = (id: string) => {
    if (activeTrackId === id) {
      setIsMusicPlaying(false);
      setActiveTrackId(null);
    }
    onUpdateAudioTracks(audioTracks.filter(t => t.id !== id));
  };

  const handleAiSparkSlide = async () => {
    setIsGeneratingAiSlide(true);
    try {
      const content = await generateSlideContent(roomTopic, transcriptionHistory);
      setAiSlide(content);
      onUpdateMedia({ type: 'slide', title: content.title, content: content.content, isPulsing: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAiSlide(false);
    }
  };

  const handleShareAd = () => {
    if (!adTitle) return;
    onUpdateMedia({
      type: 'advert',
      title: adTitle,
      content: adMessage,
      isPulsing: true
    });
  };

  const activeTrack = audioTracks.find(t => t.id === activeTrackId);

  return (
    <>
      {/* PERSISTENT AUDIO ELEMENTS - Always mounted if component is rendered */}
      {bgSound && <audio ref={bgAudioRef} src={bgSound.url} loop />}
      <audio ref={musicAudioRef} onEnded={() => !isMusicLooping && setIsMusicPlaying(false)} />

      {/* MINI PLAYER VIEW */}
      {isMinimized && (
        <div className="fixed bottom-32 right-8 z-[700] animate-in slide-in-from-right-8 duration-500">
           <div className="bg-secondary/95 backdrop-blur-2xl border border-white/10 rounded-[40px] p-5 shadow-2xl flex items-center gap-6 ring-1 ring-black/5">
              <div 
                onClick={() => setIsMinimized(false)}
                className={`w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all relative ${isMusicPlaying ? 'animate-pulse' : ''}`}
              >
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-accent rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5" /></svg>
                 </div>
              </div>

              <div className="flex flex-col gap-1 pr-4 min-w-[120px]">
                 <p className="text-[8px] font-black text-accent uppercase tracking-widest leading-none">Stage Active</p>
                 <h4 className="text-[11px] font-bold text-main truncate max-w-[150px] uppercase">
                    {activeTrack ? activeTrack.name : 'Atmosphere Only'}
                 </h4>
                 <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                      className="text-accent hover:text-white transition-colors"
                    >
                       {isMusicPlaying ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8v4l5-2-5-2z" clipRule="evenodd" /></svg> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                    </button>
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={musicVolume} 
                      onChange={(e) => setMusicVolume(parseFloat(e.target.value))} 
                      className="w-16 h-1 bg-white/10 rounded-full appearance-none accent-accent cursor-pointer" 
                    />
                 </div>
              </div>

              <button 
                onClick={() => setIsMinimized(false)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                 <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </button>
           </div>
        </div>
      )}

      {/* FULL CONSOLE VIEW */}
      {!isMinimized && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl bg-main rounded-[60px] overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-white/10">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-secondary/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-main uppercase tracking-tight">Stage Console</h2>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Global Broadcast Controller</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-4 bg-black/40 px-6 py-2.5 rounded-2xl border border-white/5">
                    <div className="text-right">
                       <p className="text-[8px] font-black text-accent uppercase tracking-widest">Active Projection</p>
                       <p className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">{currentMedia.type !== 'none' ? currentMedia.type : 'Default Banner'}</p>
                    </div>
                    <div className="w-10 h-6 bg-accent/20 rounded-md flex items-center justify-center border border-accent/20">
                       <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    </div>
                 </div>

                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMinimized(true)}
                      className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all active:scale-90 border border-white/5"
                      title="Minimize Console"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                    </button>
                    <button 
                      onClick={onClose} 
                      className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all active:scale-90 border border-white/5"
                      title="Close Console"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 bg-secondary/30 border-r border-white/5 p-6 flex flex-col gap-2 shrink-0">
                {[
                  { id: 'audio', label: 'Audio Deck', icon: '🎵', desc: 'Playlist & Pads' },
                  { id: 'slide', label: 'Presentations', icon: '📊', desc: 'Slide Builder', badge: 'AI' },
                  { id: 'scripture', label: 'Bible App', icon: '📖', desc: 'Scripture Vault' },
                  { id: 'banner', label: 'Stage Skin', icon: '🎨', desc: 'Wallpapers' },
                  { id: 'screenshare', label: 'Screen Share', icon: '💻', desc: 'Live Casting' },
                  { id: 'ads', label: 'Global Ads', icon: '💎', desc: 'Promotions', visible: canPostAds },
                ].filter(t => t.visible !== false).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-start gap-0.5 px-6 py-4 rounded-[24px] transition-all relative group ${activeTab === tab.id ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-muted hover:bg-white/5 hover:text-main'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl mb-1">{tab.icon}</span>
                      {tab.badge && (
                        <span className="bg-white/20 text-[7px] font-black px-1.5 py-0.5 rounded-md border border-white/10 uppercase tracking-widest">{tab.badge}</span>
                      )}
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
                    <span className={`text-[8px] font-bold uppercase opacity-50 ${activeTab === tab.id ? 'text-white' : 'text-muted'}`}>{tab.desc}</span>
                  </button>
                ))}

                {/* Atmosphere Pad (Upload Loop) */}
                <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
                   <div className="flex justify-between items-center px-2">
                     <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Atmosphere Pad</h3>
                     {bgSound && (
                       <button onClick={() => { setBgSound(null); setIsBgPlaying(false); localStorage.removeItem('eh_custom_bg_sound'); }} className="text-[8px] font-black text-red-400 uppercase tracking-widest hover:underline">Reset</button>
                     )}
                   </div>

                   {bgSound ? (
                     <div className="bg-accent/10 border border-accent/20 rounded-3xl p-5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${isBgPlaying ? 'bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]' : 'bg-white/10'}`} />
                              <p className="text-[10px] font-black uppercase text-main truncate">{bgSound.name}</p>
                           </div>
                           <button onClick={() => setIsBgPlaying(!isBgPlaying)} className={`p-2 rounded-xl transition-all ${isBgPlaying ? 'bg-accent text-white' : 'bg-white/10 text-muted'}`}>
                             {isBgPlaying ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8v4l5-2-5-2z" clipRule="evenodd" /></svg> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                           </button>
                        </div>
                        <div className="space-y-1">
                           <div className="flex justify-between text-[7px] font-black text-accent uppercase"><span>Pad Volume</span><span>{Math.round(bgVolume * 100)}%</span></div>
                           <input type="range" min="0" max="1" step="0.01" value={bgVolume} onChange={(e) => setBgVolume(parseFloat(e.target.value))} className="w-full h-1 bg-main rounded-full appearance-none accent-accent cursor-pointer" />
                        </div>
                     </div>
                   ) : (
                     <button onClick={() => bgFileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center gap-3 text-muted hover:border-accent/30 hover:text-accent transition-all group">
                        <svg className="w-6 h-6 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">Upload Loop</span>
                        <input type="file" ref={bgFileInputRef} className="hidden" accept="audio/*" onChange={handleBgUpload} />
                     </button>
                   )}
                </div>
              </div>

              {/* Main App Canvas */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-main/30">
                
                {activeTab === 'audio' && (
                   <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                      <div className="flex flex-col md:flex-row gap-8">
                         {/* Now Playing Monitor */}
                         <div className="flex-1 bg-secondary rounded-[48px] p-10 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="absolute top-8 right-8 flex items-center gap-3 z-10">
                               <button 
                                onClick={() => setIsMusicLooping(!isMusicLooping)}
                                className={`p-3 rounded-2xl transition-all border ${isMusicLooping ? 'bg-accent border-accent text-white shadow-lg' : 'bg-white/5 border-white/10 text-muted hover:border-white/20'}`}
                                title="Toggle Loop"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                               </button>
                            </div>

                            <div className={`w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center mb-6 shadow-2xl relative z-10 ${isMusicPlaying ? 'animate-pulse' : ''}`}>
                               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-main uppercase tracking-tighter mb-1 relative z-10">
                              {activeTrackId ? audioTracks.find(t => t.id === activeTrackId)?.name : 'Ready to Broadcast'}
                            </h3>
                            <p className="text-[9px] text-muted font-bold uppercase tracking-widest mb-8 relative z-10">Playlist Music Deck</p>
                            
                            {activeTrackId && (
                               <button 
                                onClick={() => shareMusicToStage()}
                                className="bg-accent/10 text-accent px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest mb-8 hover:bg-accent hover:text-white transition-all shadow-lg active:scale-95"
                               >
                                 Broadcast Active Track Info
                               </button>
                            )}

                            <div className="w-full max-w-xs space-y-4 relative z-10">
                               <div className="flex justify-between text-[9px] font-black text-accent uppercase tracking-widest">
                                 <span>Music Level</span>
                                 <span className="tabular-nums">{Math.round(musicVolume * 100)}%</span>
                               </div>
                               <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-main/50 rounded-full appearance-none accent-accent cursor-pointer" />
                            </div>
                         </div>

                         {/* Playlist Controls */}
                         <div className="w-full md:w-80 space-y-4">
                            <div className="flex justify-between items-center px-4">
                               <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Your Tracks ({audioTracks.length}/3)</h4>
                               {audioTracks.length < 3 && (
                                 <button onClick={() => musicFileInputRef.current?.click()} className="text-[9px] font-black text-accent uppercase tracking-widest hover:underline">+ Upload</button>
                               )}
                               <input type="file" ref={musicFileInputRef} className="hidden" accept="audio/*" multiple onChange={handleMusicUpload} />
                            </div>
                            
                            <div className="space-y-3">
                               {audioTracks.map(track => (
                                 <div key={track.id} className={`p-5 rounded-3xl border transition-all flex flex-col gap-4 ${activeTrackId === track.id ? 'bg-accent/10 border-accent/20' : 'bg-secondary border-white/5'}`}>
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-4 overflow-hidden">
                                          <button onClick={() => toggleMusicTrack(track.id)} className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${activeTrackId === track.id && isMusicPlaying ? 'bg-accent text-white' : 'bg-main text-accent'}`}>
                                             {activeTrackId === track.id && isMusicPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8v4l5-2-5-2z" clipRule="evenodd" /></svg> : <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                                          </button>
                                          <p className="text-[10px] font-black uppercase text-main truncate">{track.name}</p>
                                       </div>
                                       <div className="flex items-center gap-1">
                                          <button 
                                            onClick={() => shareMusicToStage(track.id)} 
                                            title="Share to Stage"
                                            className="p-2 text-muted hover:text-accent transition-colors"
                                          >
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                          </button>
                                          <button onClick={() => removeMusicTrack(track.id)} className="p-2 text-muted hover:text-red-500 transition-colors">
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                               {audioTracks.length === 0 && (
                                 <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-20">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Library Empty</p>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {activeTab === 'slide' && (
                  <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 bg-indigo-600 p-10 rounded-[48px] shadow-2xl text-white relative overflow-hidden group">
                        <div className="relative z-10">
                          <h3 className="text-3xl font-black uppercase tracking-tight mb-4 leading-none">Presentation AI</h3>
                          <p className="text-sm font-medium opacity-80 mb-8 leading-relaxed italic">"Abena, synthesize our discussion into a visual presentation."</p>
                          <button onClick={handleAiSparkSlide} disabled={isGeneratingAiSlide} className="bg-white text-indigo-600 px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-4 hover:scale-105 active:scale-95 disabled:opacity-50">
                            {isGeneratingAiSlide ? <><div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /> ENGAGING ENGINE...</> : 'SHARE AI SLIDE'}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 bg-secondary rounded-[48px] p-8 border border-white/5 space-y-6 shadow-sm">
                         <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] ml-2">Manual Slide Builder</h4>
                         <input type="text" value={manualSlideTitle} onChange={e => setManualSlideTitle(e.target.value)} placeholder="Slide Title..." className="w-full bg-main border-2 border-white/5 rounded-2xl p-5 text-white font-black text-sm uppercase tracking-widest outline-none focus:border-accent" />
                         <textarea value={manualSlideContent} onChange={e => setManualSlideContent(e.target.value)} placeholder="Main points..." className="w-full bg-main border-2 border-white/5 rounded-3xl p-6 text-white font-medium text-sm outline-none focus:border-accent resize-none h-32" />
                         <button onClick={() => onUpdateMedia({ type: 'slide', title: manualSlideTitle, content: manualSlideContent })} className="w-full bg-white text-slate-900 py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-accent hover:text-white transition-all shadow-xl">Share to Stage</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'scripture' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-slate-900 rounded-[56px] p-12 border-4 border-white/5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-12 items-center">
                       <div className="flex-1 relative z-10 space-y-8">
                          <div className="flex items-center gap-6"><div className="w-20 h-20 bg-white/5 rounded-[28px] flex items-center justify-center border border-white/10 shadow-2xl text-4xl">📜</div><div><h3 className="text-4xl font-black text-white uppercase tracking-tighter">Bible App</h3><p className="text-xs font-bold text-accent uppercase tracking-widest">Global Scripture Repository</p></div></div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Book</label>
                                <select value={bibleBook} onChange={e => setBibleBook(e.target.value)} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-accent appearance-none cursor-pointer">
                                   {BIBLE_BOOKS.map(book => <option key={book} value={book}>{book}</option>)}
                                </select>
                             </div>
                             <div className="space-y-2"><label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Reference</label><input type="text" value={bibleRef} onChange={e => setBibleRef(e.target.value)} placeholder="e.g. 1:1" className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-accent" /></div>
                          </div>
                          <div className="space-y-2"><label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">Verse Content</label><textarea value={bibleContent} onChange={e => setBibleContent(e.target.value)} placeholder="Paste text..." className="w-full bg-black/40 border-2 border-white/10 rounded-[32px] p-8 text-white font-serif text-lg italic outline-none focus:border-accent resize-none min-h-[140px]" /></div>
                          <button onClick={() => onUpdateMedia({ type: 'scripture', content: bibleContent, reference: `${bibleBook} ${bibleRef}` })} className="w-full bg-white text-slate-900 py-7 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-xl hover:bg-accent hover:text-white transition-all active:scale-95">Share Verse to Stage</button>
                       </div>
                       <div className="w-full md:w-80 shrink-0 space-y-6">
                          <h4 className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Quick Access</h4>
                          <div className="space-y-4">
                             {QUICK_VERSES.map((v, idx) => (
                               <button key={idx} onClick={() => { setBibleBook(v.ref.split(' ')[0]); setBibleRef(v.ref.split(' ')[1]); setBibleContent(v.text); }} className="w-full text-left bg-white/5 p-5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-all group">
                                  <p className="text-[8px] font-black text-accent uppercase tracking-widest mb-1">{v.category}</p><p className="text-xs font-bold text-white mb-2 line-clamp-1">"{v.text}"</p><p className="text-[9px] text-muted font-black uppercase text-right">{v.ref}</p>
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'banner' && (
                   <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                         {[1, 2, 3, 4, 5, 6].map(i => (
                           <div 
                            key={i} 
                            onClick={() => onUpdateMedia({ type: 'banner', imageUrl: `https://picsum.photos/seed/bg-${i}/1200/800` })}
                            className="aspect-video bg-secondary rounded-[32px] overflow-hidden border-4 border-white/5 shadow-xl hover:border-accent transition-all cursor-pointer relative group"
                           >
                              <img src={`https://picsum.photos/seed/bg-${i}/400/250`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <span className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl">Share Skin</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                {activeTab === 'screenshare' && (
                  <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-slate-900 rounded-[56px] p-16 border-4 border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--accent),_transparent_70%)]" />
                       <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-8 border border-white/10 shadow-2xl relative z-10">
                          <svg className={`w-12 h-12 ${currentMedia.type === 'screenshare' ? 'text-red-500 animate-pulse' : 'text-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       </div>
                       <h3 className="text-4xl font-black text-white uppercase tracking-tight mb-4 relative z-10">Screen Broadcast</h3>
                       <p className="text-slate-400 font-medium max-w-sm mb-12 leading-relaxed italic relative z-10">Cast your primary interface or a specific workflow directly to the room's global projector.</p>
                       
                       <button 
                        onClick={() => onUpdateMedia(currentMedia.type === 'screenshare' ? { type: 'none' } : { type: 'screenshare' })}
                        className={`w-full max-w-xs py-7 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl transition-all active:scale-95 relative z-10 ${currentMedia.type === 'screenshare' ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20' : 'bg-white text-slate-900 hover:bg-accent hover:text-white'}`}
                       >
                         {currentMedia.type === 'screenshare' ? 'Stop Sharing' : 'Start Screen Share'}
                       </button>
                    </div>
                  </div>
                )}

                {activeTab === 'ads' && (
                  <div className="animate-in slide-in-from-right-4 duration-500 space-y-10">
                     <div className="bg-orange-600 rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-[2000ms]" />
                        <div className="relative z-10">
                           <div className="flex items-center gap-4 mb-6">
                              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                              </div>
                              <div>
                                 <h3 className="text-3xl font-black uppercase tracking-tighter">Ad Broadcast</h3>
                                 <p className="text-xs font-bold text-orange-200 uppercase tracking-widest">Global Monetization Suite</p>
                              </div>
                           </div>
                           
                           <div className="space-y-6 max-w-xl">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Promo Header</label>
                                 <input 
                                  type="text" 
                                  value={adTitle}
                                  onChange={e => setAdTitle(e.target.value)}
                                  placeholder="Exclusive Flash Offer..."
                                  className="w-full bg-white/10 border-2 border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-white/30 transition-all placeholder:text-white/40"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Detailed Message</label>
                                 <textarea 
                                  value={adMessage}
                                  onChange={e => setAdMessage(e.target.value)}
                                  placeholder="Describe your promotion or call to action..."
                                  className="w-full bg-white/10 border-2 border-white/10 rounded-3xl p-6 text-white font-medium text-sm outline-none focus:border-white/30 transition-all placeholder:text-white/40 resize-none h-24"
                                 />
                              </div>
                              <button 
                               onClick={handleShareAd}
                               disabled={!adTitle}
                               className="w-full bg-white text-orange-600 py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                              >
                                Share Ad to Room
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[48px] p-20 flex flex-col items-center justify-center text-center opacity-30">
                        <p className="text-sm font-black uppercase tracking-[0.5em] text-white">Monetization AI Queue</p>
                        <p className="text-[10px] font-bold uppercase mt-4 text-white/60">Verified Advertisers can queue campaigns here</p>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer info */}
            <div className="p-8 bg-secondary/50 border-t border-white/5 text-center shrink-0">
               <p className="text-[9px] text