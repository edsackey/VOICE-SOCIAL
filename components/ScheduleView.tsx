
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
    const combined = [...MOCK_SCHEDULE, ...userEvents];
    return combined.sort((a, b) => a.startTime - b.startTime);
  }, [userEvents]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'mine') {
      return allEvents.filter(e => e.hostName === currentUser.displayName || e.id.startsWith('user-'));
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
    setUserEvents(prev => [event, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-black text-gradient tracking-tighter uppercase italic mb-2">Timeline</h1>
          <p className="text-[10px] text-muted font-bold uppercase tracking-[0.5em] ml-1">Architecting Future Conversations</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex bg-white/5 backdrop-blur-xl rounded-[24px] p-1.5 border border-white/10 shadow-inner">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`flex-1 md:px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-accent text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]' : 'text-muted hover:text-white'}`}
            >
              Discover
            </button>
            <button 
              onClick={() => setActiveFilter('mine')}
              className={`flex-1 md:px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'mine' ? 'bg-accent text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]' : 'text-muted hover:text-white'}`}
            >
              My Hubs
            </button>
          </div>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="p-5 bg-accent text-white rounded-[24px] shadow-[0_20px_40px_rgba(124,58,237,0.3)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
          >
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {filteredEvents.length === 0 ? (
          <div className="py-32 text-center premium-glass rounded-[64px] border-dashed border-2 border-white/5">
             <svg className="w-20 h-20 mx-auto mb-6 text-muted/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             <p className="text-xl font-black uppercase tracking-widest text-muted/30">Your schedule is a blank canvas</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div 
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="group relative bg-secondary/30 rounded-[56px] overflow-hidden cursor-pointer border border-white/5 transition-all duration-700 hover:-translate-y-2 hover:bg-secondary/50 flex flex-col md:flex-row"
            >
              {/* Event Glow Card */}
              <div className="room-card-glow opacity-10 group-hover:opacity-30" />

              {/* Poster Section */}
              <div className="w-full md:w-[400px] h-64 md:h-auto relative shrink-0 overflow-hidden">
                <img src={event.posterUrl} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 brightness-[0.4] group-hover:brightness-[0.6]" alt={event.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent md:bg-gradient-to-r" />
                
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8">
                   <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-4">
                      {formatDate(event.startTime)}
                   </div>
                   <p className="text-xs font-black text-accent uppercase tracking-[0.3em]">{event.duration} HUB</p>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-10 md:p-14 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-[9px] font-black text-accent uppercase tracking-widest">{event.bookedCount}/{event.capacity} SECURED</span>
                    </div>
                    <div className="flex gap-2">
                       {event.tags.slice(0, 2).map(tag => (
                         <span key={tag} className="text-[8px] font-black text-muted uppercase border border-white/5 px-3 py-1.5 rounded-xl">#{tag}</span>
                       ))}
                    </div>
                </div>

                <h2 className="text-4xl font-black text-white mb-6 tracking-tighter leading-none group-hover:text-accent transition-colors duration-500 uppercase">{event.title}</h2>
                <p className="text-lg text-muted font-medium line-clamp-2 mb-10 leading-relaxed max-w-2xl opacity-70 italic">"{event.description}"</p>

                <div className="mt-auto flex items-center justify-between pt-10 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 squircle overflow-hidden border-2 border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <img src={event.hostAvatar} className="w-full h-full object-cover" alt={event.hostName} />
                      </div>
                      <div>
                          <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-0.5">MODERATED BY</p>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{event.hostName}</p>
                      </div>
                    </div>
                    
                    <button 
                      className="bg-white text-gray-900 px-10 py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:bg-accent group-hover:text-white"
                    >
                      Book Access
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
          role: 4 as any,
          isMuted: true,
          handRaised: false
        }}
      />
    </div>
  );
};

export default ScheduleView;
