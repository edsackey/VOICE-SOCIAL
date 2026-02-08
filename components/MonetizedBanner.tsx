
import React, { useEffect, useState, useRef } from 'react';
import { MonetizedPromo } from '../types';
import { StorageService } from '../services/storageService';

interface MonetizedBannerProps {
  onBuySlot: () => void;
}

const MonetizedBanner: React.FC<MonetizedBannerProps> = ({ onBuySlot }) => {
  const [promos, setPromos] = useState<MonetizedPromo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setPromos(StorageService.getPromos());
    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const total = StorageService.getPromos().length + 1; // +1 for the "Add Yours" slot
        return (prev + 1) % total;
      });
      // Stop audio when sliding to next promo
      setPlayingId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const allSlots = [
    ...promos,
    { id: 'cta', title: 'YOUR EVENT HERE', description: 'Reach thousands for only $1.00/day!', isCTA: true } as any
  ];

  const toggleAudio = (promo: MonetizedPromo) => {
    if (playingId === promo.id) {
      setPlayingId(null);
      audioRef.current?.pause();
    } else {
      setPlayingId(promo.id);
      if (audioRef.current) {
        audioRef.current.src = promo.audioUrl || '';
        audioRef.current.play().catch(e => console.error("Audio playback error", e));
      }
    }
  };

  return (
    <div className="mb-12 relative overflow-hidden h-44 rounded-[48px] bg-indigo-950 group shadow-2xl border-4 border-white/10">
       <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
       
       {/* Background Animated Gradients */}
       <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 animate-pulse opacity-50" />
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />

       <div 
        className="flex h-full transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
       >
         {allSlots.map((slot, idx) => (
           <div key={slot.id} className="min-w-full h-full flex items-center justify-between px-12 relative">
             <div className="flex-1 animate-in slide-in-from-left-8 duration-700">
               <div className="flex items-center gap-3 mb-2">
                 <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg ${slot.isCTA ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white'}`}>
                    {slot.isCTA ? 'ECHO HUB ADS' : 'SPONSORED EVENT'}
                 </span>
                 {!slot.isCTA && (
                   <span className="text-white/40 text-[9px] font-black uppercase tracking-widest tabular-nums">Featured</span>
                 )}
                 {!slot.isCTA && slot.audioUrl && (
                   <button 
                    onClick={() => toggleAudio(slot as MonetizedPromo)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${playingId === slot.id ? 'bg-green-500 text-white' : 'bg-white/10 text-indigo-300 hover:bg-white/20'}`}
                   >
                     {playingId === slot.id ? (
                       <><div className="w-2 h-2 bg-white rounded-full animate-ping" /> STOP TEASER</>
                     ) : (
                       <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> HEAR TEASER</>
                     )}
                   </button>
                 )}
               </div>
               <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter line-clamp-1 mb-1">{slot.title}</h3>
               <p className="text-indigo-200/80 text-xs font-medium max-w-lg line-clamp-1 italic">"{slot.description}"</p>
             </div>

             <div className="ml-8 flex items-center gap-6 shrink-0">
               {slot.isCTA ? (
                 <button 
                  onClick={onBuySlot}
                  className="bg-white text-indigo-900 px-10 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:bg-orange-500 group-hover:text-white"
                 >
                   Promote My Hub
                 </button>
               ) : (
                 <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/20 shadow-xl bg-black">
                       <img src={slot.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" alt="" />
                    </div>
                    <button className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:bg-indigo-500 transition-all active:scale-95">
                       Join Stage
                    </button>
                 </div>
               )}
             </div>

             {/* Indicator Dots */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allSlots.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${activeIndex === i ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`} />
                ))}
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

export default MonetizedBanner;
