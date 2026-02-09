
import React, { useState, useMemo, useEffect } from 'react';
import { User, Room, CallType, CallRecord } from '../types';
import { MOCK_ROOMS } from '../constants';
import { StorageService } from '../services/storageService';
import Avatar from './Avatar';

interface CallsViewProps {
  onJoinRoom: (room: Room) => void;
  onInitiateCall: (user: User, type: CallType) => void;
  onUserClick: (user: User) => void;
}

const CallsView: React.FC<CallsViewProps> = ({ onJoinRoom, onInitiateCall, onUserClick }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'people'>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);

  // Get followed users from storage
  const myId = 'me';
  const following = StorageService.getFollowing(myId);
  
  useEffect(() => {
    setRecentCalls(StorageService.getCallHistory(myId).slice(0, 5));
  }, []);

  const connectedPeople: User[] = useMemo(() => {
    // In a real app, this would fetch the full User objects for each following ID
    return following.map(f => ({
      id: f.followedId,
      name: `User ${f.followedId.slice(0, 5)}`,
      avatar: `https://picsum.photos/seed/${f.followedId}/200`,
      role: 4 as any, // LISTENER/SPEAKER role
      isMuted: false,
      handRaised: false
    }));
  }, [following]);

  const filteredPeople = connectedPeople.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = MOCK_ROOMS.filter(r => r.isLive && 
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2 italic">Connect</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] ml-1">Direct Neural Communication</p>
          </div>
          
          <div className="flex bg-white/50 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-white/50">
            <button 
              onClick={() => setActiveTab('people')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'people' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Network
            </button>
            <button 
              onClick={() => setActiveTab('rooms')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rooms' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Public Hubs
            </button>
          </div>
        </div>

        <div className="relative group">
          <input 
            type="text" 
            placeholder={activeTab === 'people' ? "Search connections..." : "Search live hubs..."}
            className="w-full bg-white border-2 border-transparent rounded-[28px] py-5 pl-14 pr-6 text-sm font-bold text-gray-700 shadow-sm focus:border-accent/30 focus:ring-4 focus:ring-accent/5 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {activeTab === 'people' && recentCalls.length > 0 && !searchQuery && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-6">Recent Activity</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-2">
              {recentCalls.map(call => {
                const other = call.participants.find(p => p.id !== myId) || call.participants[0];
                return (
                  <button 
                    key={call.id}
                    onClick={() => onInitiateCall(other as any, call.type)}
                    className="shrink-0 bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 w-28 group"
                  >
                    <div className="relative">
                      <img src={other.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${call.type === 'video' ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {call.type === 'video' ? (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0013 8v4a1 1 0 001.553.894l2-1A1 1 0 0017 11V9a1 1 0 00-.447-.894l-2-1z" /></svg>
                        ) : (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter truncate w-full text-center">{other.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[48px] overflow-hidden shadow-xl border border-indigo-50 min-h-[400px]">
          {activeTab === 'people' ? (
            <div className="divide-y divide-gray-50">
              {filteredPeople.length === 0 ? (
                <div className="p-24 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-20 h-20 mb-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                  <p className="text-sm font-black uppercase tracking-[0.3em]">Neural Network Empty</p>
                  <p className="text-[10px] font-bold uppercase mt-2">Follow users to see them here</p>
                </div>
              ) : (
                filteredPeople.map(person => (
                  <div key={person.id} className="p-8 hover:bg-indigo-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
                    <div className="flex items-center gap-5 cursor-pointer" onClick={() => onUserClick(person)}>
                       <div className="relative">
                         <Avatar user={person} size="lg" showBadge={false} />
                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                       </div>
                       <div>
                          <h3 className="text-lg font-black text-gray-900 group-hover:text-accent transition-colors uppercase italic">{person.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Status: Open Link</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => onInitiateCall(person, 'voice')}
                         className="flex-1 sm:flex-none p-4 bg-green-50 text-green-600 rounded-[24px] hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3 px-6"
                         title="Voice Call"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          <span className="text-[10px] font-black uppercase tracking-widest">Voice</span>
                       </button>
                       <button 
                         onClick={() => onInitiateCall(person, 'video')}
                         className="flex-1 sm:flex-none p-4 bg-accent/10 text-accent rounded-[24px] hover:bg-accent hover:text-white transition-all shadow-sm flex items-center justify-center gap-3 px-6"
                         title="Video Call"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span className="text-[10px] font-black uppercase tracking-widest">Video</span>
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredRooms.length === 0 ? (
                <div className="p-24 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-20 h-20 mb-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  <p className="text-sm font-black uppercase tracking-[0.3em]">No Active Stages</p>
                </div>
              ) : (
                filteredRooms.map(room => (
                  <div key={room.id} className="p-8 hover:bg-indigo-50/20 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6 flex-1 min-w-0" onClick={() => onJoinRoom(room)}>
                       <div className="w-20 h-20 rounded-[32px] overflow-hidden border-4 border-gray-50 shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                          <img src={room.posterUrl || `https://picsum.photos/seed/${room.id}/200`} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="min-w-0">
                          <h3 className="text-lg font-black text-gray-900 group-hover:text-accent transition-colors truncate pr-4 uppercase italic leading-tight">{room.title}</h3>
                          <div className="flex items-center gap-3 mt-2">
                             <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-lg">
                               <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                               <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
                             </div>
                             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{room.participantCount} Pulsing</span>
                          </div>
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => onJoinRoom(room)}
                      className="bg-accent text-white px-8 py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all ml-4"
                    >
                       Connect
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 text-center">
         <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.6em]">EchoHub Secure Mesh Network v4.2</p>
      </div>
    </div>
  );
};

export default CallsView;
