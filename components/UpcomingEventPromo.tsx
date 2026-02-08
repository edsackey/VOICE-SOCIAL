
import React from 'react';
import { MOCK_SCHEDULE } from '../constants';
import { ScheduledEvent } from '../types';

interface UpcomingEventPromoProps {
  onViewEvent: (event: ScheduledEvent) => void;
}

const UpcomingEventPromo: React.FC<UpcomingEventPromoProps> = ({ onViewEvent }) => {
  const nextEvent = MOCK_SCHEDULE[0]; // Promo for the first mock event

  return (
    <div className="mb-12 relative group cursor-pointer" onClick={() => onViewEvent(nextEvent)}>
       <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-[56px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
       <div className="relative bg-white rounded-[50px] overflow-hidden shadow-2xl border border-white/50 flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
             <img src={nextEvent.posterUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" alt="" />
             <div className="absolute top-6 left-6 bg-red-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl animate-pulse">Coming Soon</div>
          </div>
          <div className="flex-1 p-10 flex flex-col justify-center">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Featured Event</div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Starting Dec 14</span>
             </div>
             <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{nextEvent.title}</h3>
             <p className="text-gray-500 font-medium mb-8 line-clamp-2">{nextEvent.description}</p>
             <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/seed/face${i}/100`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="" />)}
                   <div className="w-10 h-10 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center text-[10px] font-black text-indigo-600">+450</div>
                </div>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] hover:underline">Secure Your Seat →</button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default UpcomingEventPromo;
