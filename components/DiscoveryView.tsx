
import React, { useState, useMemo } from 'react';
import { MOCK_ROOMS } from '../constants';
import { Room, ScheduledEvent, DBUser } from '../types';
import UpcomingEventPromo from './UpcomingEventPromo';
import BookingModal from './BookingModal';
import RoomRecordingsModal from './RoomRecordingsModal';
import BuyPromoModal from './BuyPromoModal';

interface DiscoveryViewProps {
  onJoinRoom: (room: Room) => void;
  onCreateRoomClick: () => void;
  currentUser: DBUser;
}

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onJoinRoom, onCreateRoomClick, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral'>('all');
  const [selectedBookingEvent, setSelectedBookingEvent] = useState<ScheduledEvent | null>(null);
  const [recordingsRoom, setRecordingsRoom] = useState<string | null>(null);
  const [isBuyPromoOpen, setIsBuyPromoOpen] = useState(false);

  const filteredRooms = useMemo(() => {
    return MOCK_ROOMS.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter;
      return matchesSearch && matchesSentiment;
    });
  }, [searchQuery, sentimentFilter]);

  return (
    <div className="space-y-10 pb-24 max-w-5xl mx-auto">
      {/* Dynamic Header */}
      <div className="space-y-6">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search Chat-Chap Stages..." 
            className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-full py-4 pl-14 pr-6 text-sm font-semibold placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all outline-none text-[var(--text-main)] shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
          {['all', 'positive', 'neutral'].map((v) => (
            <button
              key={v}
              onClick={() => setSentimentFilter(v as any)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border shrink-0 ${
                sentimentFilter === v 
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md' 
                : 'bg-[var(--bg-secondary)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
              }`}
            >
              {v === 'all' ? 'All' : v === 'positive' ? 'Trending' : 'Chill'}
            </button>
          ))}
        </div>
      </div>

      {!searchQuery && sentimentFilter === 'all' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <UpcomingEventPromo 
            onViewEvent={(e) => setSelectedBookingEvent(e)} 
            onJoinPromo={(p) => console.log(`Joining promo...`)}
          />
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full flex justify-between items-end mb-2">
           <div>
             <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)] uppercase italic">Global Pulse</h2>
             <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Live audio architecture</p>
           </div>
           <button 
             onClick={() => setIsBuyPromoOpen(true)}
             className="px-4 py-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
           >
             Promote
           </button>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[var(--bg-secondary)] rounded-[24px] border border-dashed border-[var(--glass-border)]">
             <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No active stages match your vibe</p>
          </div>
        ) : (
          filteredRooms.map(room => (
            <div 
              key={room.id}
              onClick={() => room.isLive && onJoinRoom(room)}
              className="group relative h-[380px] bg-[var(--bg-secondary)] rounded-[24px] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl border border-[var(--glass-border)]"
            >
              <img 
                src={room.posterUrl || `https://picsum.photos/seed/${room.id}/800/800`} 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 brightness-[0.6] group-hover:brightness-[0.4]" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="relative h-full p-8 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-4">
                  {room.isLive && (
                    <div className="bg-red-600 text-white px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest animate-pulse">
                      LIVE
                    </div>
                  )}
                  <div className="px-3 py-1 rounded-md text-[9px] font-black uppercase border border-white/20 bg-white/10 text-white/90 backdrop-blur-md">
                    {room.participantCount} LISTENERS
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors duration-300 uppercase italic">
                  {room.title}
                </h3>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex -space-x-2">
                    {room.speakers.slice(0, 3).map(s => (
                      <img key={s.id} src={s.avatar} className="w-8 h-8 rounded-full border-2 border-[var(--bg-secondary)] shadow-sm" alt="" />
                    ))}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={onCreateRoomClick}
        className="fixed bottom-24 right-10 z-[110] w-16 h-16 bg-[var(--accent)] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
      </button>

      {selectedBookingEvent && <BookingModal isOpen={true} onClose={() => setSelectedBookingEvent(null)} event={selectedBookingEvent} currentUser={currentUser as any} />}
      {recordingsRoom && <RoomRecordingsModal isOpen={true} onClose={() => setRecordingsRoom(null)} roomTitle={recordingsRoom} />}
      <BuyPromoModal isOpen={isBuyPromoOpen} onClose={() => setIsBuyPromoOpen(false)} currentUser={currentUser as any} onSuccess={() => {}} />
    </div>
  );
};

export default DiscoveryView;
