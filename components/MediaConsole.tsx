
import React, { useState, useRef, useEffect } from 'react';
import { MediaState, MediaType, BackgroundAudio, PlaylistTrack } from '../types';
import { generateSlideContent } from '../services/geminiService';

interface MediaConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMedia: (media: MediaState) => void;
  roomTopic: string;
  transcriptionHistory: string[];
  audioTracks: PlaylistTrack[];
  onUpdateAudioTracks: (tracks: PlaylistTrack[]) => void;
  currentMedia: MediaState;
  canPostAds?: boolean;
}

const INITIAL_MOCK_AUDIO: BackgroundAudio[] = [
  { id: '1', name: 'Worship Pad - Deep', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', isPlaying: false, volume: 0.3, loop: true },
  { id: '2', name: 'Morning Lo-Fi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', isPlaying: false, volume: 0.3, loop: true },
  { id: '3', name: 'Ambient Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', isPlaying: false, volume: 0.2, loop: true },
];

const MediaConsole: React.FC<MediaConsoleProps> = ({ 
  isOpen, 
  onClose, 
  onUpdateMedia, 
  roomTopic, 
  transcriptionHistory,
  audioTracks,
  onUpdateAudioTracks,
  currentMedia,
  canPostAds
}) => {
  const [activeTab, setActiveTab] = useState<MediaType | 'audio' | 'ads'>('scripture');
  const [bgTracks, setBgTracks] = useState<BackgroundAudio[]>(INITIAL_MOCK_AUDIO);
  const [isGeneratingAiSlide, setIsGeneratingAiSlide] = useState(false);
  const [aiSlide, setAiSlide] = useState<{ title: string; content: string; imagePrompt: string } | null>(null);
  const [uploadedSlides, setUploadedSlides] = useState<string[]>([]);
  
  const lyricFileInputRef = useRef<HTMLInputElement>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const bgAudioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Custom Content States
  const [customScripture, setCustomScripture] = useState("Commit to the Lord whatever you do, and he will establish your plans.");
  const [customReference, setCustomReference] = useState("Proverbs 16:3");
  const [customLyric, setCustomLyric] = useState("Great is thy faithfulness, O God my father...");
  const [customLyricRef, setCustomLyricRef] = useState("Hymn #1");
  const [adContent, setAdContent] = useState("50% off EchoHub Pro - Today Only!");

  useEffect(() => {
    bgTracks.forEach(track => {
      const audio = bgAudioRefs.current[track.id];
      if (audio) {
        audio.volume = track.volume;
        audio.loop = !!track.loop;
        if (track.isPlaying) audio.play().catch(() => {});
        else audio.pause();
      }
    });
  }, [bgTracks]);

  if (!isOpen) return null;

  const toggleBgTrack = (id: string) => {
    setBgTracks(prev => prev.map(t => 
      t.id === id ? { ...t, isPlaying: !t.isPlaying } : { ...t, isPlaying: false }
    ));
  };

  const updateBgVolume = (id: string, volume: number) => {
    setBgTracks(prev => prev.map(t => t.id === id ? { ...t, volume } : t));
  };

  const toggleBgLoop = (id: string) => {
    setBgTracks(prev => prev.map(t => t.id === id ? { ...t, loop: !t.loop } : t));
  };

  const togglePulse = () => {
    onUpdateMedia({
      ...currentMedia,
      isPulsing: !currentMedia.isPulsing
    });
  };

  const handleUpdateScripture = () => {
    onUpdateMedia({
      ...currentMedia,
      type: 'scripture',
      content: customScripture,
      reference: customReference
    });
    onClose();
  };

  const handleUpdateLyric = () => {
    onUpdateMedia({
      ...currentMedia,
      type: 'lyric',
      content: customLyric,
      reference: customLyricRef
    });
    onClose();
  };

  const handlePostAd = () => {
    onUpdateMedia({
      ...currentMedia,
      type: 'slide',
      title: "SPONSORED ANNOUNCEMENT",
      content: adContent,
      isPulsing: true
    });
    onClose();
  };

  const handleLyricFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] as File | undefined;
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCustomLyric(text);
        setCustomLyricRef(file.name.replace('.txt', ''));
      };
      reader.readAsText(file);
    }
  };

  const handleSlideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          setUploadedSlides(prev => [...prev, url].slice(-6)); 
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 3 - audioTracks.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots) as File[];
    if (files.length > remainingSlots) {
      alert(`Audio playlist is limited to 3 tracks. Adding the first ${remainingSlots} selected.`);
    }
    const newTracks: PlaylistTrack[] = filesToAdd.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      type: f.type
    }));
    onUpdateAudioTracks([...audioTracks, ...newTracks]);
  };

  const handleSelectSlide = (url: string) => {
    onUpdateMedia({
      ...currentMedia,
      type: 'slide',
      imageUrl: url
    });
    onClose();
  };

  const handleGenerateAiSlide = async () => {
    setIsGeneratingAiSlide(true);
    const content = await generateSlideContent(roomTopic, transcriptionHistory);
    setAiSlide(content);
    setIsGeneratingAiSlide(false);
  };

  const handleSelectAiSlide = () => {
    if (!aiSlide) return;
    onUpdateMedia({
      ...currentMedia,
      type: 'slide',
      title: aiSlide.title,
      content: aiSlide.content
    });
    onClose();
  };

  const toggleScreenShare = () => {
    if (currentMedia.type === 'screenshare') {
      onUpdateMedia({ ...currentMedia, type: 'none' });
    } else {
      onUpdateMedia({ ...currentMedia, type: 'screenshare' });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {bgTracks.map(t => (
        <audio 
          key={t.id} 
          ref={el => { if (el) bgAudioRefs.current[t.id] = el; }} 
          src={t.url} 
          preload="auto" 
        />
      ))}
      
      <div className="w-full max-w-5xl bg-[#f7f3e9] rounded-[48px] overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Broadcast Console</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Media Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={togglePulse}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${currentMedia.isPulsing ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-gray-100 text-gray-400 border border-gray-100 hover:bg-gray-200'}`}
             >
                <div className={`w-2 h-2 rounded-full ${currentMedia.isPulsing ? 'bg-white animate-ping' : 'bg-gray-300'}`} />
                Visual Pulse {currentMedia.isPulsing ? 'Active' : 'Off'}
             </button>
             <button onClick={onClose} className="p-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-all">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-72 bg-gray-50/50 border-r border-gray-200 p-6 flex flex-col gap-2 shrink-0">
            {[
              { id: 'scripture', label: 'Scriptures', icon: '📖' },
              { id: 'lyric', label: 'Song Lyrics', icon: '🎶' },
              { id: 'slide', label: 'Visual Slides', icon: '🖼️' },
              { id: 'audio', label: 'Playlist', icon: '🔊' },
              { id: 'ads', label: 'Ads Manager', icon: '💎', visible: canPostAds },
              { id: 'screenshare', label: 'Screen Share', icon: '🖥️' },
              { id: 'none', label: 'Clear Projection', icon: '🚫' },
            ].filter(t => t.visible !== false).map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'none') onUpdateMedia({ ...currentMedia, type: 'none' });
                }}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-white hover:text-gray-900'}`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}

            <div className="mt-auto pt-6 border-t border-gray-200">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Live Mixing</h3>
               <div className="space-y-4">
                 {bgTracks.map(track => (
                   <div key={track.id} className="space-y-2">
                     <div className="flex items-center justify-between">
                        <button 
                          onClick={() => toggleBgTrack(track.id)}
                          className={`flex-1 p-3 rounded-xl border flex items-center gap-3 transition-all ${track.isPlaying ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${track.isPlaying ? 'bg-indigo-500 animate-pulse' : 'bg-gray-200'}`} />
                          <span className={`text-[10px] font-black uppercase truncate ${track.isPlaying ? 'text-indigo-600' : 'text-gray-400'}`}>{track.name}</span>
                        </button>
                        <button 
                          onClick={() => toggleBgLoop(track.id)}
                          className={`ml-2 p-2.5 rounded-lg border transition-all ${track.loop ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-300 border-gray-100'}`}
                          title="Loop"
                        >
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                     </div>
                     {track.isPlaying && (
                       <input 
                         type="range" min="0" max="1" step="0.01" 
                         value={track.volume} 
                         onChange={(e) => updateBgVolume(track.id, parseFloat(e.target.value))}
                         className="w-full h-1 bg-gray-200 rounded-lg appearance-none accent-indigo-500"
                       />
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Main Console Area */}
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white/40">
            {activeTab === 'screenshare' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col justify-center items-center text-center">
                <div className="bg-white p-12 rounded-[56px] shadow-xl border border-indigo-50 max-w-lg w-full space-y-8">
                  <div className={`w-24 h-24 rounded-[32px] mx-auto flex items-center justify-center transition-all duration-500 ${currentMedia.type === 'screenshare' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 rotate-12' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Screen Projection</h3>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed">
                      {currentMedia.type === 'screenshare' 
                        ? "You are currently projecting your screen to the room stage." 
                        : "Ready to share your desktop or application window with the audience?"}
                    </p>
                  </div>
                  <button 
                    onClick={toggleScreenShare}
                    className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 ${currentMedia.type === 'screenshare' ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                  >
                    {currentMedia.type === 'screenshare' ? 'Stop Screen Share' : 'Start Screen Share'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'ads' && canPostAds && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-orange-500 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-4">Ads Manager</h3>
                    <p className="text-sm opacity-80 mb-6">Create a prominent visual announcement for all listeners.</p>
                    <textarea 
                      value={adContent}
                      onChange={(e) => setAdContent(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-3xl p-6 text-white text-lg font-bold placeholder:text-white/40 min-h-[120px] mb-6 focus:ring-2 focus:ring-white outline-none"
                      placeholder="Type your ad message here..."
                    />
                    <button 
                      onClick={handlePostAd}
                      className="bg-white text-orange-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      Blast Sponsored Ad
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="bg-orange-600 p-8 rounded-[40px] text-white shadow-2xl shadow-orange-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black uppercase tracking-tight mb-2">Playlist Manager</h3>
                      <p className="text-sm opacity-80 mb-6">Manage high-fidelity audio tracks for the room. (Max 3 slots)</p>
                      
                      <input type="file" ref={audioFileInputRef} className="hidden" accept="audio/*" multiple onChange={handleAudioUpload} />
                      
                      <button 
                        onClick={() => audioFileInputRef.current?.click()}
                        disabled={audioTracks.length >= 3}
                        className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {audioTracks.length >= 3 ? 'PLAYLIST FULL' : 'UPLOAD TRACKS'}
                      </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Active Tracks ({audioTracks.length}/3)</h4>
                    {audioTracks.map((track, i) => (
                      <div key={track.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm group hover:border-orange-200 transition-all">
                         <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-orange-500 tabular-nums">0{i+1}</span>
                            <p className="text-sm font-bold text-gray-800 truncate max-w-[250px]">{track.name}</p>
                         </div>
                         <button 
                          onClick={() => onUpdateAudioTracks(audioTracks.filter(t => t.id !== track.id))}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                         >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                    ))}
                    {audioTracks.length === 0 && (
                      <div className="py-12 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                         <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Empty Deck</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'scripture' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 space-y-8">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Scripture Projection</h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Verse Content</label>
                    <textarea 
                      value={customScripture}
                      onChange={(e) => setCustomScripture(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-[32px] p-8 text-lg font-medium min-h-[160px] focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Reference</label>
                    <input 
                      type="text"
                      value={customReference}
                      onChange={(e) => setCustomReference(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-full px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <button 
                    onClick={handleUpdateScripture}
                    className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Project to Stage
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'lyric' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Lyrics Projection</h3>
                    <button 
                      onClick={() => lyricFileInputRef.current?.click()}
                      className="text-[10px] font-black text-indigo-600 uppercase hover:underline flex items-center gap-2"
                    >
                      Upload .txt
                    </button>
                    <input type="file" ref={lyricFileInputRef} className="hidden" accept=".txt" onChange={handleLyricFileUpload} />
                  </div>
                  <textarea 
                    value={customLyric}
                    onChange={(e) => setCustomLyric(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-[32px] p-8 text-lg font-medium min-h-[160px] focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <input 
                    type="text"
                    value={customLyricRef}
                    onChange={(e) => setCustomLyricRef(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-full px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <button 
                    onClick={handleUpdateLyric}
                    className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Cast Lyrics
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'slide' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-indigo-600 p-8 rounded-[48px] shadow-2xl shadow-indigo-100 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                      <h3 className="text-xl font-black uppercase tracking-tight mb-2">AI Visual Slide</h3>
                      <p className="text-sm font-medium opacity-80 mb-8">Let Gemini design context-aware visuals for the current discussion.</p>
                      
                      <div className="flex gap-3">
                        {!aiSlide ? (
                          <button 
                            onClick={handleGenerateAiSlide}
                            disabled={isGeneratingAiSlide}
                            className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                          >
                            {isGeneratingAiSlide ? (
                              <><div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> GENERATING...</>
                            ) : 'CREATE WITH AI'}
                          </button>
                        ) : (
                          <>
                            <button onClick={handleSelectAiSlide} className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-black text-xs">USE SLIDE</button>
                            <button onClick={() => setAiSlide(null)} className="bg-indigo-500 text-white px-8 py-4 rounded-xl font-black text-xs">RETRY</button>
                          </>
                        )}
                      </div>
                    </div>

                    {aiSlide && (
                      <div className="w-full md:w-64 aspect-video bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 animate-in zoom-in-95">
                        <h4 className="font-black text-xs uppercase tracking-tight mb-2 line-clamp-1">{aiSlide.title}</h4>
                        <p className="text-[9px] font-medium leading-tight line-clamp-4 text-white/80">{aiSlide.content}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Visual Gallery</h4>
                    <button 
                      onClick={() => slideFileInputRef.current?.click()}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all"
                    >
                      + Upload Slides
                    </button>
                    <input type="file" ref={slideFileInputRef} className="hidden" accept="image/*" multiple onChange={handleSlideUpload} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <button 
                      onClick={() => handleSelectSlide('https://picsum.photos/seed/slide1/800/450')}
                      className="aspect-video bg-gray-200 rounded-[32px] overflow-hidden border-4 border-white shadow-md hover:scale-105 transition-all group relative"
                    >
                      <img src="https://picsum.photos/seed/slide1/800/450" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Slide" />
                    </button>
                    {uploadedSlides.map((url, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSelectSlide(url)}
                        className="aspect-video bg-gray-200 rounded-[32px] overflow-hidden border-4 border-white shadow-md hover:scale-105 transition-all group relative"
                      >
                        <img src={url} className="w-full h-full object-cover" alt="Upload" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaConsole;
