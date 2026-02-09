
import React, { useState } from 'react';
import { User, UserRole } from '../types';

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

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const isSpeaking = !user.isMuted && !user.handRaised;
  const isModerator = user.role === UserRole.HOST || user.role === UserRole.MODERATOR;

  const handleVolumeIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMixer(!showMixer);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
    if (volume < 0.5) return <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a3 3 0 00-3 3v2a3 3 0 006 0V5a3 3 0 00-3-3zM5 8a1 1 0 011-1h1V5a3 3 0 116 0v2h1a1 1 0 110 2h-1v2a3 3 0 01-3 3v2h-2v-2a3 3 0 01-3-3V9H5a1 1 0 01-1-1z" /></svg>;
    return <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>;
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
        {/* SPEAKING RIPPLES */}
        {isSpeaking && (
          <div className="absolute -inset-2 border-2 border-[var(--accent)] rounded-[35%] animate-ping opacity-20 pointer-events-none" />
        )}

        <div className={`w-full h-full rounded-[35%] overflow-hidden bg-[var(--bg-secondary)] shadow-lg transition-all duration-500 border-2 ${isSpeaking ? 'border-[var(--accent)] scale-105 shadow-[var(--accent-glow)]' : 'border-transparent'} group-active:scale-90`}>
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          
          {/* Quick Mixer Trigger */}
          {onVolumeChange && user.id !== 'me' && (
            <div 
              onClick={handleVolumeIconClick}
              className={`absolute top-1 right-1 p-1.5 rounded-lg backdrop-blur-md border border-white/20 transition-all z-20 ${showMixer ? 'bg-[var(--accent)] text-white scale-110' : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100'}`}
            >
              {getVolumeIcon()}
            </div>
          )}
        </div>

        {/* STATUS INDICATORS */}
        {showBadge && (
          <div className="absolute -bottom-1 -right-1 flex gap-1 items-center">
            {user.isMuted && !user.handRaised && (
              <div className="bg-white dark:bg-slate-800 rounded-full p-1 shadow-md border border-[var(--glass-border)]">
                 <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a3 3 0 00-3 3v2a3 3 0 006 0V5a3 3 0 00-3-3zM5 8a1 1 0 011-1h1V5a3 3 0 116 0v2h1a1 1 0 110 2h-1v2a3 3 0 01-3 3v2h-2v-2a3 3 0 01-3-3V9H5a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M3.293 3.293a1 1 0 011.414 0L16.707 15.293a1 1 0 01-1.414 1.414l-12-12a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </div>
            )}
            {user.handRaised && (
              <div className="bg-yellow-400 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-lg border border-white animate-bounce">
                 ✋
              </div>
            )}
          </div>
        )}

        {/* INLINE VOLUME SLIDER OVERLAY */}
        {showMixer && onVolumeChange && (
          <div 
            className="absolute left-full ml-3 top-0 w-8 h-24 bg-[var(--bg-secondary)]/90 backdrop-blur-xl border border-[var(--glass-border)] rounded-full p-2 flex flex-col items-center justify-between shadow-2xl animate-in fade-in slide-in-from-left-2 z-[100]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-1 w-full flex items-center justify-center relative">
               {/* Removed non-standard 'orientation' attribute which caused TS error */}
               <input 
                 type="range"
                 min="0"
                 max="1.5"
                 step="0.05"
                 value={volume}
                 onChange={(e) => onVolumeChange(user.id, parseFloat(e.target.value))}
                 className="absolute w-16 -rotate-90 bg-transparent appearance-none cursor-pointer accent-[var(--accent)]"
                 style={{ WebkitAppearance: 'slider-vertical' } as any}
               />
            </div>
            <span className="text-[7px] font-black text-[var(--accent)] mb-1 tabular-nums">{Math.round(volume * 100)}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-center gap-1">
        {isModerator && <span className="text-[10px] text-[var(--sentiment-positive)]">✳️</span>}
        <p className="text-[11px] font-bold text-[var(--text-main)] truncate max-w-[80px]">
          {user.name.split(' ')[0]}
        </p>
      </div>
    </div>
  );
};

export default Avatar;
