
import React, { useState, useRef, useEffect } from 'react';
import { PlaylistTrack } from '../types';

interface RoomAudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
  tracks: PlaylistTrack[];
  setTracks: (tracks: PlaylistTrack[]) => void;
}

const RoomAudioPlayer: React.FC<RoomAudioPlayerProps> = ({ isOpen, onClose, isHost, tracks, setTracks }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isPlaylistVisible, setIsPlaylistVisible] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && tracks.length > 0) {
      audioRef.current?.play().catch(e => console.error("Playback failed", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentIndex, tracks]);

  useEffect(() => {
    if (tracks.length > 0 && currentIndex === -1) {
      setCurrentIndex(0);
    }
  }, [tracks]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - tracks.length;
    // Explicitly cast to File[] to fix unknown type inference errors
    const filesToAdd = Array.from(files).slice(0, remainingSlots) as File[];

    if (files.length > remainingSlots) {
      alert(`Playlist is limited to 3 tracks. Adding the first ${remainingSlots} selected.`);
    }

    const newTracks: PlaylistTrack[] = filesToAdd.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      type: f.type
    }));

    setTracks([...tracks, ...newTracks]);
    if (currentIndex === -1) setCurrentIndex(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const togglePlay = () => {
    if (tracks.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentIndex((currentIndex + 1) % tracks.length);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    setCurrentIndex((currentIndex - 1 + tracks.length) % tracks.length);
  };

  const removeTrack = (id: string) => {
    const newTracks = tracks.filter(t => t.id !== id);
    setTracks(newTracks);
    if (newTracks.length === 0) {
      setCurrentIndex(-1);
      setIsPlaying(false);
    } else if (currentIndex >= newTracks.length) {
      setCurrentIndex(newTracks.length - 1);
    }
  };

  if (!isOpen) return null;

  const currentTrack = tracks[currentIndex];

  return (
    <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#2d2d2d] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* VLC Style Header */}
        <div className="p-6 bg-gradient-to-r from-orange-600 to-orange-500 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-white p-2 rounded-xl shadow-lg">
                <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                </svg>
             </div>
             <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Room Media Player</h3>
                <p className="text-[10px] text-orange-100 font-bold uppercase tracking-tighter mt-1">VLC Edition</p>
             </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Display / Metadata Area */}
        <div className="p-8 flex flex-col items-center justify-center text-center bg-[#1a1a1a]">
           <div className={`w-32 h-32 rounded-full border-4 border-orange-500/20 flex items-center justify-center mb-6 relative ${isPlaying ? 'animate-pulse' : ''}`}>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin-slow" style={{ animationDuration: isPlaying ? '3s' : '0s' }} />
              <svg className="w-16 h-16 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
           </div>
           <h4 className="text-white font-black text-lg line-clamp-1 w-full uppercase tracking-tight">
              {currentTrack ? currentTrack.name : "No Media Selected"}
           </h4>
           <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
              {currentTrack ? `${(currentTrack.size / 1024 / 1024).toFixed(2)} MB • ${currentTrack.type.split('/')[1].toUpperCase()}` : "Ready to Stream"}
           </p>
        </div>

        {/* Controls Area */}
        <div className="p-6 bg-[#2d2d2d] space-y-6">
           {/* Seek Bar */}
           <div className="space-y-2">
              <input 
                type="range" 
                min="0" 
                max={duration || 0} 
                value={progress} 
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-black text-gray-500 tabular-nums">
                 <span>{new Date(progress * 1000).toISOString().substr(14, 5)}</span>
                 <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
              </div>
           </div>

           {/* Main Transport */}
           <div className="flex items-center justify-center gap-8">
              <button onClick={prevTrack} className="text-gray-400 hover:text-white transition-all active:scale-90">
                 <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-orange-900/20 hover:scale-110 active:scale-95 transition-all"
              >
                 {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                 ) : (
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 )}
              </button>
              <button onClick={nextTrack} className="text-gray-400 hover:text-white transition-all active:scale-90">
                 <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
           </div>

           {/* Volume & Playlist Toggle */}
           <div className="flex items-center gap-4 border-t border-white/5 pt-6">
              <div className="flex items-center gap-3 flex-1">
                 <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                 <input 
                  type="range" min="0" max="1" step="0.01" value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-gray-700 rounded-full appearance-none accent-gray-400"
                 />
              </div>
              <button 
                onClick={() => setIsPlaylistVisible(!isPlaylistVisible)}
                className={`p-2 rounded-lg transition-colors ${isPlaylistVisible ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
           </div>
        </div>

        {/* Playlist Section */}
        {isPlaylistVisible && (
          <div className="flex-1 bg-[#1a1a1a] p-6 max-h-[300px] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-4">
                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Playlist ({tracks.length}/3)</h5>
                {isHost && tracks.length < 3 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                  >
                    + Add Track
                  </button>
                )}
             </div>

             <div className="space-y-2">
                {tracks.map((track, idx) => (
                   <div 
                    key={track.id} 
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${currentIndex === idx ? 'bg-orange-500/10 border border-orange-500/20' : 'hover:bg-white/5'}`}
                   >
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}>
                         <span className={`text-[10px] font-black tabular-nums ${currentIndex === idx ? 'text-orange-500' : 'text-gray-600'}`}>{idx + 1}</span>
                         <p className={`text-xs font-bold truncate max-w-[180px] ${currentIndex === idx ? 'text-white' : 'text-gray-400'}`}>{track.name}</p>
                      </div>
                      {isHost && (
                        <button onClick={() => removeTrack(track.id)} className="text-gray-600 hover:text-red-500 p-1">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                   </div>
                ))}
                {tracks.length === 0 && (
                   <div className="text-center py-10 opacity-20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Playlist is empty</p>
                   </div>
                )}
             </div>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="audio/*" 
          multiple 
          onChange={handleFileUpload}
        />
        
        {currentIndex >= 0 && tracks.length > 0 && (
          <audio 
            ref={audioRef}
            src={tracks[currentIndex].url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={nextTrack}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
};

export default RoomAudioPlayer;
