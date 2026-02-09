
import React, { useState } from 'react';
import { MediaState, Room } from '../types';

interface ProjectionViewProps {
  media: MediaState | null;
  room: Room;
}

const ProjectionView: React.FC<ProjectionViewProps> = ({ media, room }) => {
  const [bannerSeed] = useState(Math.floor(Math.random() * 1000));

  const defaultBannerUrl = media?.type === 'banner' && media.imageUrl 
    ? media.imageUrl 
    : room.posterUrl || `https://picsum.photos/seed/room-${bannerSeed}/1200/1200`;

  return (
    <div className={`w-full aspect-square sm:aspect-video bg-slate-900 rounded-[56px] overflow-hidden shadow-[0_48px_96px_rgba(0,0,0,0.35)] border-4 border-white/20 relative group transition-all duration-700 ring-1 ring-black/10 ${media?.isPulsing ? 'scale-[1.01] ring-[8px] ring-indigo-500/20' : ''}`}>
      
      {/* Pulse Overlay Effect */}
      {media?.isPulsing && (
        <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay animate-pulse z-20 pointer-events-none" />
      )}

      {/* 1. DEFAULT ROOM BANNER / CUSTOM BANNER MODE */}
      {(!media || media.type === 'none' || media.type === 'banner') && (
        <div className="absolute inset-0 animate-in fade-in zoom-in-105 duration-1000">
          <img src={defaultBannerUrl} className="w-full h-full object-cover scale-105 opacity-80 brightness-[0.5]" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-accent/30 backdrop-blur-md px-6 py-2 rounded-full border border-accent/40 mb-6">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.6em] animate-pulse">
                {media?.type === 'banner' ? 'Custom Visual Active' : 'Live Global Hub'}
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter italic drop-shadow-2xl max-w-2xl leading-tight">
              {room.title}
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {room.tags.map(t => (
                <span key={t} className="text-[9px] font-black bg-white/10 backdrop-blur-md text-white/70 px-4 py-1.5 rounded-xl uppercase tracking-widest border border-white/10">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SCREEN SHARE MODE */}
      {media?.type === 'screenshare' && (
        <div className="absolute inset-0 bg-slate-950 animate-in fade-in duration-500 overflow-hidden">
           <div className="absolute top-8 left-8 z-30 flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-red-600 px-5 py-2 rounded-xl shadow-lg">LIVE BROADCAST</span>
           </div>
           
           <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--accent),_transparent_70%)]" />
              <div className="w-full h-full bg-slate-900/50 rounded-[40px] border border-white/10 backdrop-blur-3xl p-10 flex flex-col gap-6 shadow-2xl relative z-10">
                 <div className="h-5 w-1/4 bg-white/10 rounded-full" />
                 <div className="grid grid-cols-1 gap-6 flex-1">
                    <div className="bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-6">
                       <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em]">Synchronizing Interface...</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 3. VISUAL SLIDE MODE */}
      {media?.type === 'slide' && (
        <div className="absolute inset-0 animate-in zoom-in-95 duration-700">
          {media.imageUrl ? (
            <img src={media.imageUrl} className="w-full h-full object-cover" alt="Slide" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 italic">{media.title}</h2>
              <p className="text-lg md:text-2xl font-medium opacity-90 whitespace-pre-wrap leading-relaxed max-w-3xl text-indigo-100 italic">"{media.content}"</p>
            </div>
          )}
        </div>
      )}
      
      {/* 4. SCRIPTURE / LYRIC MODE */}
      {(media?.type === 'scripture' || media?.type === 'lyric') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-950 animate-in slide-in-from-bottom-2 duration-500">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--accent),_transparent_70%)]" />
          <h2 className="text-accent text-[10px] font-black uppercase tracking-[0.8em] mb-10">
            {media.type === 'scripture' ? 'Neural Revelation' : 'Voice Lyric Feed'}
          </h2>
          <div className="max-w-2xl">
            <p className="text-white text-3xl sm:text-5xl font-black leading-tight mb-10 drop-shadow-2xl italic tracking-tight">
              "{media.content}"
            </p>
            {media.reference && (
              <span className="bg-white/10 backdrop-blur-3xl text-white/80 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.4em] border border-white/10 shadow-2xl">
                {media.reference}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 5. ADVERT MODE */}
      {media?.type === 'advert' && (
        <div className="absolute inset-0 animate-in fade-in duration-500 bg-orange-600 flex flex-col items-center justify-center p-12 text-white">
           <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
           </div>
           <h3 className="text-sm font-black uppercase tracking-[0.5em] mb-6">Sponsored Announcement</h3>
           <h2 className="text-3xl md:text-5xl font-black text-center leading-tight mb-8 uppercase tracking-tighter italic">{media.title}</h2>
           <p className="text-lg md:text-2xl font-medium text-center opacity-90 italic max-w-2xl">"{media.content}"</p>
        </div>
      )}

      {/* 6. MUSIC INFO MODE */}
      {media?.type === 'music_info' && (
        <div className="absolute inset-0 bg-indigo-900 animate-in zoom-in-105 duration-1000 overflow-hidden">
           <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--accent),_transparent_70%)] animate-pulse" />
           <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white relative z-10">
              <div className="w-48 h-48 bg-white/10 rounded-[48px] flex items-center justify-center mb-10 shadow-2xl backdrop-blur-xl border border-white/10 group-hover:scale-110 transition-transform duration-700">
                 <svg className="w-24 h-24 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-300 mb-4">Now Broadcasting Media</p>
              <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter italic drop-shadow-2xl">{media.title}</h2>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectionView;