
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  onClick?: (user: User) => void;
  volume?: number;
  onVolumeChange?: (userId: string, volume: number) => void;
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', showBadge = true, onClick, volume = 1, onVolumeChange }) => {
  const [showMixer, setShowMixer] = useState(false);
  const followerCount = StorageService.getFollowers(user.id).length;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const isSpeaking = !user.isMuted && !user.handRaised;
  const isModerator = user.role === UserRole.HOST || user.role === UserRole.MODERATOR;

  const handleVolumeIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMixer(!showMixer);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
    return <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" /></svg>;
  };

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group transition-all duration-300"
      onMouseLeave={() => setShowMixer(false)}
    >
      <div 
        className={`${sizeClasses[size]} relative transition-all duration-500`}
        onClick={() => onClick?.(user)}
      >
        {/* Authoritative Bloom Effect for high follower count */}
        {followerCount > 100 && (
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-accent to-indigo-500 rounded-[35%] opacity-20 blur-md group-hover:opacity-40 transition-opacity" />
        )}

        {/* SPEAKING RIPPLES */}
        {isSpeaking && (
          <>
            <div className="absolute -inset-2 border-2 border-[var(--accent)] rounded-[35%] animate-ping opacity-30 pointer-events-none" />
            <div className="absolute -inset-4 border-2 border-indigo-400 rounded-[35%] animate-ping opacity-10 pointer-events-none" style={{ animationDelay: '0.2s' }} />
          </>
        )}

        <div className={`w-full h-full rounded-[35%] overflow-hidden bg-[var(--bg-secondary)] shadow-xl transition-all duration-500 border-2 ${isSpeaking ? 'border-[var(--accent)] scale-105 shadow-[var(--accent-glow)]' : 'border-white/20'} group-active:scale-90 relative`}>
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          
          {/* Influence Badge */}
          {followerCount > 100 && (
             <div className="absolute top-1 left-1 bg-white/20 backdrop-blur-md rounded-lg p-0.5 px-1 border border-white/20 flex items-center gap-0.5 shadow-sm">
                <span className="text-[7px] font-black text-white uppercase tracking-tighter tabular-nums">{Math.floor(followerCount/1000)}K</span>
                <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
             </div>
          )}

          {/* Quick Mixer Trigger */}
          {onVolumeChange && user.id !== 'me' && (
            <div 
              onClick={handleVolumeIconClick}
              className={`absolute top-1 right-1 p-1.5 rounded-lg backdrop-blur-md border border-white/20 transition-all z-20 ${showMixer ? 'bg-[var(--accent)] text-white scale-110 shadow-lg' : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100'}`}
            >
              {getVolumeIcon()}
            </div>
          )}
        </div>

        {/* STATUS INDICATORS */}
        {showBadge && (
          <div className="absolute -bottom-1 -right-1 flex gap-1 items-center z-10">
            {user.isMuted && !user.handRaised && (
              <div className="bg-white/90 backdrop-blur-md dark:bg-slate-800 rounded-full p-1 shadow-lg border border-white/20 animate-in zoom-in">
                 <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                 </svg>
              </div>
            )}
            {user.handRaised && (
              <div className="bg-yellow-400 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full shadow-[0_4px_12px_rgba(251,191,36,0.5)] border-2 border-white animate-bounce">
                 ✋
              </div>
            )}
          </div>
        )}

        {/* INLINE VOLUME SLIDER OVERLAY */}
        {showMixer && onVolumeChange && (
          <div 
            className="absolute left-full ml-4 top-0 w-10 h-28 bg-[var(--bg-secondary)]/95 backdrop-blur-2xl border border-white/20 rounded-[20px] p-2 flex flex-col items-center justify-between shadow-2xl animate-in fade-in slide-in-from-left-2 z-[100]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-1 w-full flex items-center justify-center relative">
               <input 
                 type="range"
                 min="0"
                 max="1.5"
                 step="0.05"
                 value={volume}
                 onChange={(e) => onVolumeChange(user.id, parseFloat(e.target.value))}
                 className="absolute w-20 -rotate-90 bg-transparent appearance-none cursor-pointer accent-[var(--accent)]"
                 style={{ WebkitAppearance: 'slider-vertical' } as any}
               />
            </div>
            <span className="text-[8px] font-black text-[var(--accent)] mb-1 tabular-nums">{Math.round(volume * 100)}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full border border-transparent hover:border-white/10 transition-colors">
        {isModerator && <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_var(--sentiment-positive)]" />}
        <p className="text-[11px] font-bold text-[var(--text-main)] truncate max-w-[90px] tracking-tight uppercase italic">
          {user.name.split(' ')[0]}
        </p>
      </div>
    </div>
  );
};

export default Avatar;
