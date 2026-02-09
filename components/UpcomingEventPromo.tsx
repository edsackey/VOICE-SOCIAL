
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_SCHEDULE } from '../constants';
import { ScheduledEvent, MonetizedPromo } from '../types';
import { StorageService } from '../services/storageService';

interface UpcomingEventPromoProps {
  onViewEvent: (event: ScheduledEvent) => void;
  onJoinPromo?: (promo: MonetizedPromo) => void;
}

const UpcomingEventPromo: React.FC<UpcomingEventPromoProps> = ({ onViewEvent, onJoinPromo }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [items, setItems] = useState<(ScheduledEvent | MonetizedPromo)[]>([]);
  const [isPlayingTeaser, setIsPlayingTeaser] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const scheduled = [...MOCK_SCHEDULE];
    const paidPromos = StorageService.getPromos();
    setItems([...paidPromos, ...scheduled]);
  }, []);

  useEffect(() => {
    if (items.length <= 1 || isPlayingTeaser) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items, isPlayingTeaser]);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex];
  const isPaid = 'totalPaid' in currentItem;

  return (
    <div className="relative h-[480px] rounded-[64px] overflow-hidden shadow-2xl border-4 border-white/5 bg-slate-900 group">
      {/* Background Pipeline */}
      <div className="absolute inset-0">
        {items.map((item, idx) => (
          <div 
            key={item.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${activeIndex === idx ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 -rotate-2'}`}
          >
            <img 
              src={(item as any).posterUrl || (item as any).imageUrl} 
              className="w-full h-full object-cover brightness-[0.4] contrast-125" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/40" />
          </div>
        ))}
      </div>

      <div className="relative z-10 h-full p-12 flex flex-col justify-end">
        <div className="max-w-2xl animate-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-4 mb-6">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl ${isPaid ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white'}`}>
              {isPaid ? 'Featured Partner' : 'Trending Hub'}
            </span>
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              Slide 0{activeIndex + 1}
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl italic">
            {currentItem.title}
          </h2>
          
          <p className="text-lg text-slate-300 font-medium mb-10 line-clamp-2 max-w-xl opacity-80 leading-tight">
            {currentItem.description}
          </p>

          <button 
            onClick={() => isPaid ? onJoinPromo?.(currentItem as any) : onViewEvent(currentItem as any)}
            className="bg-white text-indigo-950 px-12 py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Enter the Stage →
          </button>
        </div>
      </div>

      {/* Modern Indicators */}
      <div className="absolute right-12 bottom-12 flex flex-col gap-2 z-20">
        {items.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${activeIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEventPromo;
