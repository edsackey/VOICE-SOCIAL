
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
    setRecentCalls(StorageService.getCallHistory(myId).slice(0, 8));
  }, []);

  const connectedPeople: User[] = useMemo(() => {
    // In a real app, this would fetch full User objects
    return following.map(f => ({
      id: f.followedId,
      name: `User ${f.followedId.slice(0, 5)}`,
      avatar: `https://picsum.photos/seed/${f.followedId}/200`,
      role: 4 as any, 
      isMuted: false,
      handRaised: false,
      bio: "EchoHub Network Partner"
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tight mb-2 italic">Connect Hub</h1>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.4em] ml-1">Universal Communication Mesh</p>
          </div>
          
          <div className="flex bg-[var(--bg-secondary)]/50 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-[var(--glass-border)]">
            <button 
              onClick={() => setActiveTab('people')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'people' ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              Direct Link
            </button>
            <button 
              onClick={() => setActiveTab('rooms')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rooms' ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              Live Stages
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text" 
            placeholder={activeTab === 'people' ? "Search connections by ID or name..." : "Search global stages..."}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-[28px] py-5 pl-14 pr-6 text-sm font-bold text-[var(--text-main)] shadow-sm focus:border-[var(--accent)]/30 focus:ring-4 focus:ring-[var(--accent)]/5 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Recent Activity Section */}
        {activeTab === 'people' && recentCalls.length > 0 && !searchQuery && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2">
            <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] px-4">Fast Redial</h2>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 px-2">
              {recentCalls.map(call => {
                const other = call.participants.find(p => p.id !== myId) || call.participants[0];
                return (
                  <div 
                    key={call.id}
                    className="shrink-0 bg-[var(--bg-secondary)] p-4 rounded-[36px] border border-[var(--glass-border)] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 w-32 relative group cursor-default"
                  >
                    <div className="relative">
                      <img src={other.avatar} className="w-16 h-16 rounded-[40%] object-cover shadow-inner" alt="" />
                      <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-secondary)] ${call.type === 'video' ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {call.type === 'video' ? (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0013 8v4a1 1 0 001.553.894l2-1A1 1 0 0017 11V9a1 1 0 00-.447-.894l-2-1z" /></svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-tighter truncate w-full text-center">{other.name.split(' ')[0]}</span>
                    
                    {/* Hover Quick Actions */}
                    <div className="absolute inset-0 bg-[var(--bg-secondary)]/95 backdrop-blur-sm rounded-[36px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 px-3">
                       <button onClick={() => onInitiateCall(other as any, 'voice')} className="w-full py-2 bg-green-500 text-white rounded-xl text-[8px] font-black uppercase shadow-lg shadow-green-500/20 active:scale-95 transition-all">Voice</button>
                       <button onClick={() => onInitiateCall(other as any, 'video')} className="w-full py-2 bg-blue-500 text-white rounded-xl text-[8px] font-black uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Video</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List Containers */}
        <div className="bg-[var(--bg-secondary)] rounded-[48px] overflow-hidden shadow-xl border border-[var(--glass-border)] min-h-[450px]">
          {activeTab === 'people' ? (
            <div className="divide-y divide-[var(--glass-border)]">
              {filteredPeople.length === 0 ? (
                <div className="p-32 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-20 h-20 mb-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                  <p className="text-sm font-black uppercase tracking-[0.3em]">Neural Network Standby</p>
                  <p className="text-[10px] font-bold uppercase mt-3">Link with users to activate direct channels</p>
                </div>
              ) : (
                filteredPeople.map(person => (
                  <div key={person.id} className="p-8 hover:bg-[var(--accent)]/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 group relative overflow-hidden">
                    <div className="flex items-center gap-6 cursor-pointer relative z-10" onClick={() => onUserClick(person)}>
                       <div className="relative group/avatar">
                         <Avatar user={person} size="lg" showBadge={false} />
                         <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[var(--bg-secondary)] shadow-sm" />
                       </div>
                       <div className="min-w-0">
                          <h3 className="text-xl font-black text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors uppercase italic leading-tight truncate">{person.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                             <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">Stable Link</span>
                             <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest hidden md:inline">• {person.bio}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                       <button 
                         onClick={() => onInitiateCall(person, 'voice')}
                         className="flex-1 sm:flex-none py-4 px-8 bg-green-50 text-green-600 rounded-[24px] hover:bg-green-600 hover:text-white transition-all shadow-sm flex flex-col items-center justify-center gap-1 min-w-[100px]"
                         title="Initiate Voice Hub"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          <span className="text-[9px] font-black uppercase tracking-widest">Voice</span>
                       </button>
                       
                       <button 
                         onClick={() => onInitiateCall(person, 'video')}
                         className="flex-1 sm:flex-none py-4 px-8 bg-[var(--accent)]/10 text-[var(--accent)] rounded-[24px] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm flex flex-col items-center justify-center gap-1 min-w-[100px]"
                         title="Initiate Live Vision (HD)"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span className="text-[9px] font-black uppercase tracking-widest">Vision HD</span>
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {filteredRooms.length === 0 ? (
                <div className="p-32 text-center opacity-30 flex flex-col items-center">
                  <svg className="w-20 h-20 mb-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  <p className="text-sm font-black uppercase tracking-[0.3em]">Stage Silence</p>
                </div>
              ) : (
                filteredRooms.map(room => (
                  <div key={room.id} className="p-8 hover:bg-[var(--accent)]/5 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6 flex-1 min-w-0 cursor-pointer" onClick={() => onJoinRoom(room)}>
                       <div className="w-24 h-24 rounded-[40px] overflow-hidden border-4 border-[var(--bg-main)] shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500 relative">
                          <img src={room.posterUrl || `https://picsum.photos/seed/${room.id}/200`} className="w-full h-full object-cover brightness-[0.8]" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                             <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                          </div>
                       </div>
                       <div className="min-w-0">
                          <h3 className="text-xl font-black text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors truncate pr-4 uppercase italic leading-tight">{room.title}</h3>
                          <div className="flex items-center gap-4 mt-2.5">
                             <div className="flex items-center gap-2 bg-red-600/10 text-red-600 px-3 py-1 rounded-lg border border-red-600/20">
                               <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Active Stage</span>
                             </div>
                             <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{room.participantCount.toLocaleString()} Pulsing</span>
                          </div>
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => onJoinRoom(room)}
                      className="bg-[var(--accent)] text-white px-10 py-5 rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[var(--accent-glow)] hover:scale-105 active:scale-95 transition-all ml-4 shrink-0"
                    >
                       Tuned In
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-16 text-center">
         <div className="flex justify-center gap-2 mb-4 opacity-20">
            <div className="w-1 h-1 bg-[var(--accent)] rounded-full" />
            <div className="w-1 h-1 bg-[var(--accent)] rounded-full" />
            <div className="w-1 h-1 bg-[var(--accent)] rounded-full" />
         </div>
         <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.6em] max-w-xs mx-auto leading-relaxed">
           EchoHub Neural Mesh Protocol v5.1 • High Fidelity Real-time Streams
         </p>
      </div>
    </div>
  );
};

export default CallsView;
