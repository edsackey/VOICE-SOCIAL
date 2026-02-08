
import React, { useState, useMemo } from 'react';
import { User, Room, CallType } from '../types';
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

  // Get followed users from storage
  const myId = 'me';
  const following = StorageService.getFollowing(myId);
  
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
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Connect</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Directory & Activity</p>
          </div>
          
          <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
            <button 
              onClick={() => setActiveTab('people')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'people' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Connections
            </button>
            <button 
              onClick={() => setActiveTab('rooms')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rooms' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Live Hubs
            </button>
          </div>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder={activeTab === 'people' ? "Find a connection..." : "Search live hubs..."}
            className="w-full bg-white border-none rounded-[28px] py-5 pl-14 pr-6 text-sm font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="bg-white rounded-[48px] overflow-hidden shadow-xl border border-indigo-50 min-h-[400px]">
          {activeTab === 'people' ? (
            <div className="divide-y divide-gray-50">
              {filteredPeople.length === 0 ? (
                <div className="p-20 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                  <p className="text-sm font-black uppercase tracking-widest">No connections found</p>
                </div>
              ) : (
                filteredPeople.map(person => (
                  <div key={person.id} className="p-6 hover:bg-indigo-50/30 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => onUserClick(person)}>
                       <Avatar user={person} size="md" showBadge={false} />
                       <div>
                          <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{person.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Available for Echo</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => onInitiateCall(person, 'voice')}
                         className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                         title="Voice Call"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                       </button>
                       <button 
                         onClick={() => onInitiateCall(person, 'video')}
                         className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                         title="Video Call"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredRooms.length === 0 ? (
                <div className="p-20 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  <p className="text-sm font-black uppercase tracking-widest">No live hubs at the moment</p>
                </div>
              ) : (
                filteredRooms.map(room => (
                  <div key={room.id} className="p-6 hover:bg-indigo-50/30 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-5 flex-1 min-w-0" onClick={() => onJoinRoom(room)}>
                       <div className="w-16 h-16 rounded-[28px] overflow-hidden border-4 border-gray-50 shrink-0">
                          <img src={room.posterUrl || `https://picsum.photos/seed/${room.id}/200`} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="min-w-0">
                          <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate pr-4">{room.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{room.participantCount} Active</span>
                          </div>
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => onJoinRoom(room)}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                    >
                       Join Stage
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallsView;
