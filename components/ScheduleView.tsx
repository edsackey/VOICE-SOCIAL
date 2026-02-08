
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SCHEDULE } from '../constants';
import { ScheduledEvent, DBUser, User } from '../types';
import BookingModal from './BookingModal';
import ScheduleRoomModal from './ScheduleRoomModal';
import { StorageService } from '../services/storageService';

interface ScheduleViewProps {
  currentUser: DBUser;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ currentUser }) => {
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine'>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [userEvents, setUserEvents] = useState<ScheduledEvent[]>([]);

  useEffect(() => {
    setUserEvents(StorageService.getScheduledEvents());
  }, []);

  const allEvents = useMemo(() => {
    // Combine mock data with user created events
    const combined = [...MOCK_SCHEDULE, ...userEvents];
    return combined.sort((a, b) => a.startTime - b.startTime);
  }, [userEvents]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'mine') {
      return allEvents.filter(e => e.hostName === currentUser.displayName);
    }
    return allEvents;
  }, [allEvents, activeFilter, currentUser]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleScheduled = (event: ScheduledEvent) => {
    setUserEvents(prev => [...prev, event]);
    // Optionally switch to 'mine' filter or stay on 'all'
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">The Schedule</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Upcoming Global Events</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              All Events
            </button>
            <button 
              onClick={() => setActiveFilter('mine')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'mine' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              My Hubs
            </button>
          </div>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
            title="Schedule a Room"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 opacity-20">
             <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             <p className="text-sm font-black uppercase tracking-widest">No scheduled events found</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div 
              key={event.id}
              className="bg-white rounded-[48px] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 flex flex-col md:flex-row"
            >
              {/* Event Poster / Visual */}
              <div className="w-full md:w-72 h-48 md:h-auto relative shrink-0 overflow-hidden">
                <img src={event.posterUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={event.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                      Live Session
                    </div>
                </div>
              </div>

              <div className="flex-1 p-8 md:p-10 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{formatDate(event.startTime)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{event.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{event.bookedCount}/{event.capacity} Booked</span>
                    </div>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{event.title}</h2>
                <p className="text-gray-500 font-medium line-clamp-2 mb-8 leading-relaxed">{event.description}</p>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-4">
                      <img src={event.hostAvatar} className="w-10 h-10 rounded-[35%] object-cover shadow-sm border-2 border-white" alt={event.hostName} />
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hosted by</p>
                          <p className="text-sm font-bold text-gray-900">{event.hostName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedEvent(event)}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      Secure Spot
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEvent && (
        <BookingModal 
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
          currentUser={currentUser}
        />
      )}

      <ScheduleRoomModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduled={handleScheduled}
        currentUser={{
          id: currentUser.id,
          name: currentUser.displayName,
          avatar: currentUser.profilePictureUrl || 'https://picsum.photos/seed/user/200',
          role: 4 as any, // Listener by default
          isMuted: true,
          handRaised: false
        }}
      />
    </div>
  );
};

export default ScheduleView;
