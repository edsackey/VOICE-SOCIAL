
import React, { useState, useEffect } from 'react';
import { MediaState, Room } from '../types';

interface ProjectionViewProps {
  media: MediaState | null;
  room: Room;
}

const ProjectionView: React.FC<ProjectionViewProps> = ({ media, room }) => {
  const [bannerSeed] = useState(Math.floor(Math.random() * 1000));

  const defaultBannerUrl = `https://picsum.photos/seed/room-${bannerSeed}/1200/600`;

  return (
    <div className={`w-full aspect-[21/9] md:aspect-[3/1] bg-gray-900 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/30 relative group mb-10 transition-all duration-700 ring-1 ring-black/10 ${media?.isPulsing ? 'scale-[1.02] shadow-indigo-500/20 ring-[8px] ring-indigo-500/20' : ''}`}>
      
      {/* Pulse Overlay Effect */}
      {media?.isPulsing && (
        <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay animate-pulse z-20 pointer-events-none" />
      )}

      {/* 1. DEFAULT ROOM BANNER MODE */}
      {(!media || media.type === 'none') && (
        <div className="absolute inset-0 animate-in fade-in zoom-in-105 duration-1000">
          <img src={defaultBannerUrl} className="w-full h-full object-cover blur-[2px] scale-105 opacity-60 brightness-50" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-3 animate-pulse">VOICE SOCIAL</span>
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight drop-shadow-2xl max-w-2xl">{room.title}</h2>
            <div className="flex gap-2 mt-4">
              {room.tags.map(t => <span key={t} className="text-[8px] font-bold bg-white/10 backdrop-blur-md text-white/60 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">#{t}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* 2. SCREEN SHARE MODE */}
      {media?.type === 'screenshare' && (
        <div className="absolute inset-0 bg-slate-950 animate-in fade-in duration-500 overflow-hidden">
           <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-red-500/80 px-3 py-1 rounded-lg backdrop-blur-md">LIVE STREAMING</span>
           </div>
           
           <div className="w-full h-full flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
              <div className="w-[80%] h-[70%] bg-indigo-900/30 rounded-2xl border border-white/10 backdrop-blur-xl p-8 flex flex-col gap-6 shadow-2xl relative">
                 <div className="h-4 w-1/2 bg-white/10 rounded-full" />
                 <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                 </div>
              </div>
              <div className="mt-6 flex flex-col items-center gap-1">
                <p className="text-white font-black uppercase text-xs tracking-[0.2em]">Host is sharing screen</p>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 text-white">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight mb-6">{media.title}</h2>
              <p className="text-lg md:text-2xl font-medium opacity-90 whitespace-pre-wrap leading-relaxed max-w-4xl">{media.content}</p>
            </div>
          )}
        </div>
      )}
      
      {/* 4. SCRIPTURE / LYRIC MODE */}
      {(media?.type === 'scripture' || media?.type === 'lyric') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 animate-in slide-in-from-bottom-2 duration-500">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <h2 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.5em] mb-6">
            {media.type === 'scripture' ? 'Holy Scripture' : 'Live Lyrics'}
          </h2>
          <div className="max-w-4xl">
            <p className="text-white text-xl sm:text-3xl font-bold leading-tight mb-8 drop-shadow-lg italic tracking-tight">
              "{media.content}"
            </p>
            {media.reference && (
              <span className="bg-white/10 backdrop-blur-md text-white/80 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest border border-white/10 shadow-xl">
                {media.reference}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectionView;
