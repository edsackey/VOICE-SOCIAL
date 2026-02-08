
import React, { useState, useMemo } from 'react';
import { MOCK_ROOMS } from '../constants';
import { Room, ScheduledEvent, DBUser } from '../types';
import UpcomingEventPromo from './UpcomingEventPromo';
import BookingModal from './BookingModal';
import RoomRecordingsModal from './RoomRecordingsModal';

interface DiscoveryViewProps {
  onJoinRoom: (room: Room) => void;
  onCreateRoomClick: () => void;
  currentUser: DBUser;
}

type SortOption = 'popular' | 'newest' | 'trending';

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onJoinRoom, onCreateRoomClick, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minParticipants, setMinParticipants] = useState<number>(0);
  const [selectedSentiment, setSelectedSentiment] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedBookingEvent, setSelectedBookingEvent] = useState<ScheduledEvent | null>(null);
  const [recordingsRoom, setRecordingsRoom] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    MOCK_ROOMS.forEach(room => room.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, []);

  const sentiments = ['All', 'positive', 'neutral', 'intense', 'controversial'];

  const filteredAndSortedRooms = useMemo(() => {
    let rooms = [...MOCK_ROOMS];

    if (searchQuery) {
      rooms = rooms.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      rooms = rooms.filter(r => selectedTags.some(tag => r.tags.includes(tag)));
    }

    if (minParticipants > 0) {
      rooms = rooms.filter(r => r.participantCount >= minParticipants);
    }

    if (selectedSentiment !== 'All') {
      rooms = rooms.filter(r => r.sentiment === selectedSentiment);
    }

    // Sort strategy: ALWAYS show Live rooms first, then secondary sort
    rooms.sort((a, b) => {
      // Primary Sort: Live status
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;

      // Secondary Sort
      if (sortBy === 'popular') {
        return b.participantCount - a.participantCount;
      } else if (sortBy === 'newest') {
        const idA = parseInt(a.id.split('-')[1]) || 0;
        const idB = parseInt(b.id.split('-')[1]) || 0;
        return idB - idA;
      }
      return 0;
    });

    return rooms;
  }, [searchQuery, selectedTags, minParticipants, selectedSentiment, sortBy]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setMinParticipants(0);
    setSelectedSentiment('All');
    setSearchQuery('');
  };

  const formatStartTime = (time?: number) => {
    if (!time) return '';
    return new Date(time).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      {/* Hero Promo Section */}
      {!searchQuery && selectedTags.length === 0 && (
         <UpcomingEventPromo onViewEvent={(e) => setSelectedBookingEvent(e)} />
      )}

      <div className="flex flex-col gap-6 mb-8 mt-12">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Active Rooms</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`p-3 rounded-2xl shadow-sm transition-all border ${isFilterPanelOpen ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </button>
            <button onClick={onCreateRoomClick} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-green-600 hover:bg-green-50 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-4 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <select 
            className="bg-white border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-indigo-600 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="popular">🔥 Popular</option>
            <option value="newest">✨ Newest</option>
            <option value="trending">📈 Trending</option>
          </select>
        </div>

        {isFilterPanelOpen && (
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-indigo-50 animate-in slide-in-from-top-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Interest Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${selectedTags.includes(tag) ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Sentiment Filter</h4>
                  <div className="flex flex-wrap gap-2">
                    {sentiments.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSentiment(s)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${selectedSentiment === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
             <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between">
                <button onClick={clearFilters} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">Reset All</button>
                <button onClick={() => setIsFilterPanelOpen(false)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Apply Filters</button>
             </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {filteredAndSortedRooms.map(room => (
          <div 
            key={room.id}
            className={`relative rounded-[48px] overflow-hidden group transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1 cursor-pointer border ${room.isLive ? 'bg-white border-transparent hover:border-indigo-100' : 'bg-slate-900 border-white/5 text-white'}`}
          >
            {/* Poster background for Upcoming/Promo Rooms */}
            {!room.isLive && (
              <div className="absolute inset-0 z-0">
                <img src={room.posterUrl || 'https://picsum.photos/seed/promo/800/400'} className="w-full h-full object-cover opacity-30 blur-[1px] transition-transform duration-[5000ms] group-hover:scale-110" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
              </div>
            )}

            <div className="relative z-10 p-8 md:p-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1" onClick={() => room.isLive && onJoinRoom(room)}>
                  <div className="flex items-center gap-3 mb-3">
                    {room.isLive ? (
                       <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full border border-red-500/20">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Session</span>
                       </div>
                    ) : (
                       <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                          Promo: {formatStartTime(room.startTime)}
                       </div>
                    )}
                    {room.sentiment === 'positive' && <span className="text-sm">✨</span>}
                  </div>
                  <h2 className={`text-2xl md:text-3xl font-black tracking-tight leading-tight mb-4 group-hover:text-indigo-500 transition-colors ${room.isLive ? 'text-gray-900' : 'text-white'}`}>
                    {room.title}
                  </h2>
                  <p className={`text-sm font-medium leading-relaxed line-clamp-2 max-w-2xl ${room.isLive ? 'text-gray-500' : 'text-slate-300'}`}>
                    {room.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {room.isLive && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-600 text-xs font-black shadow-inner">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 017 7v1H1v-1a7 7 0 017-7z" /></svg>
                      {room.participantCount.toLocaleString()}
                    </div>
                  )}
                  {/* Recordings Play Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRecordingsRoom(room.title); }}
                    className="p-3 bg-orange-100 text-orange-600 rounded-2xl hover:bg-orange-200 transition-all shadow-sm group/play"
                    title="View Previous Recordings"
                  >
                    <svg className="w-5 h-5 group-hover/play:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-10 pt-8 border-t border-gray-100/10">
                <div className="flex items-center gap-6" onClick={() => room.isLive && onJoinRoom(room)}>
                  <div className="flex -space-x-3">
                    {room.speakers.map(s => (
                      <img key={s.id} className="h-12 w-12 rounded-[38%] ring-4 ring-white/10 object-cover shadow-xl" src={s.avatar} alt={s.name} />
                    ))}
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${room.isLive ? 'text-gray-400' : 'text-slate-400'}`}>Lead Host</p>
                    <p className={`text-sm font-bold ${room.isLive ? 'text-gray-900' : 'text-white'}`}>{room.speakers[0]?.name || 'EchoHub'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="hidden md:flex gap-2">
                      {room.tags.slice(0, 2).map(tag => (
                        <span key={tag} className={`text-[9px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest ${room.isLive ? 'bg-indigo-50 text-indigo-500' : 'bg-white/10 text-indigo-300'}`}>
                          #{tag}
                        </span>
                      ))}
                   </div>
                   {room.isLive ? (
                     <button 
                      onClick={() => onJoinRoom(room)}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                     >
                       Join Conversation
                     </button>
                   ) : (
                     <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert("Room added to your booked events schedule!");
                      }}
                      className="bg-white text-indigo-600 px-8 py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-indigo-50 active:scale-95 transition-all"
                     >
                       Book My Seat
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedBookingEvent && (
        <BookingModal 
          isOpen={!!selectedBookingEvent}
          onClose={() => setSelectedBookingEvent(null)}
          event={selectedBookingEvent}
          currentUser={currentUser}
        />
      )}

      {recordingsRoom && (
        <RoomRecordingsModal 
          isOpen={!!recordingsRoom}
          onClose={() => setRecordingsRoom(null)}
          roomTitle={recordingsRoom}
        />
      )}

      <button 
        onClick={onCreateRoomClick}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-10 py-5 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 z-30"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        Launch a Room
      </button>
    </div>
  );
};

export default DiscoveryView;
