
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
                {media?.type === 'banner' ? 'Visual Layer Active' : 'Chat-Chap Live'}
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
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-red-600 px-5 py-2 rounded-xl shadow-lg">STAGE UPLINK</span>
           </div>
           
           <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--accent),_transparent_70%)]" />
              <div className="w-full h-full bg-slate-900/50 rounded-[40px] border border-white/10 backdrop-blur-3xl p-10 flex flex-col gap-6 shadow-2xl relative z-10">
                 <div className="flex justify-between items-center mb-4">
                    <div className="h-4 w-32 bg-white/10 rounded-full" />
                    <div className="flex gap-2">
                       <div className="w-3 h-3 bg-white/20 rounded-full" />
                       <div className="w-3 h-3 bg-white/20 rounded-full" />
                       <div className="w-3 h-3 bg-white/20 rounded-full" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-6 flex-1">
                    <div className="bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
                       <div className="absolute inset-0 flex items-center justify-center opacity-5">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,50 Q25,0 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="0.5" /></svg>
                       </div>
                       <svg className="w-20 h-20 text-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       <div className="text-center">
                          <p className="text-[12px] font-black text-white uppercase tracking-[0.6em]">Synchronizing Stream...</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-2">Chat-Chap Hub Casting Active</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 3. VISUAL SLIDE MODE */}
      {media?.type === 'slide' && (
        <div className="absolute inset-0 animate-in zoom-in-95 duration-700 overflow-hidden">
          {media.imageUrl ? (
            <img src={media.imageUrl} className="w-full h-full object-cover" alt="Slide" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              <h2 className="relative z-10 text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 italic">{media.title}</h2>
              <p className="relative z-10 text-lg md:text-2xl font-medium opacity-90 whitespace-pre-wrap leading-relaxed max-w-3xl text-indigo-100 italic">"{media.content}"</p>
            </div>
          )}
        </div>
      )}

      {/* 4. SCRIPTURE MODE */}
      {media?.type === 'scripture' && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-16 text-center animate-in fade-in duration-700">
           <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" fill="white"><path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="currentColor" strokeWidth="0.1" /></svg>
           </div>
           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-8 border border-white/10 shadow-2xl">📖</div>
           <p className="text-xl md:text-3xl text-white font-serif italic leading-relaxed mb-8 max-w-3xl">"{media.content}"</p>
           <div className="h-px w-24 bg-accent/40 mb-6" />
           <p className="text-xs font-black text-accent uppercase tracking-[0.4em]">{media.reference}</p>
        </div>
      )}

      {/* 5. LYRIC MODE */}
      {media?.type === 'lyric' && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-105 duration-1000">
           <div className="absolute top-10 left-10"><span className="text-white/20 text-[10px] font-black uppercase tracking-[0.8em]">LIVE WORSHIP FEED</span></div>
           <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-10 italic drop-shadow-2xl">{media.content}</h2>
           <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest opacity-60">Music: {media.title}</p>
        </div>
      )}

      {/* 6. ADVERT MODE */}
      {media?.type === 'advert' && (
        <div className="absolute inset-0 bg-orange-600 flex flex-col items-center justify-center p-16 animate-in slide-in-from-bottom-8 duration-700">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_black_150%)] opacity-40" />
           <div className="relative z-10 text-center max-w-2xl">
              <span className="bg-white text-orange-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-8 inline-block shadow-2xl">Partner Message</span>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-6 italic">{media.title}</h2>
              <p className="text-lg md:text-xl text-orange-100 font-medium leading-relaxed opacity-90">{media.content}</p>
           </div>
           <div className="absolute bottom-10 right-10 flex items-center gap-3">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Powered by EchoHub Global Ads</p>
           </div>
        </div>
      )}

      {/* 7. MUSIC INFO MODE */}
      {media?.type === 'music_info' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center p-12 animate-in fade-in duration-500">
           <div className="flex flex-col items-center text-center">
              <div className="w-48 h-48 bg-accent rounded-[40px] flex items-center justify-center text-white mb-10 shadow-[0_32px_64px_var(--accent-glow)] relative">
                 <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                 <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl"><div className="w-4 h-4 bg-accent rounded-full animate-ping" /></div>
              </div>
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.6em] mb-2">Stage Broadcast Audio</p>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">{media.title}</h3>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectionView;
