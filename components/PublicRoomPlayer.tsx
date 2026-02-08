
import React, { useState, useEffect } from 'react';
import { Room, TranscriptionEntry } from '../types';

interface PublicRoomPlayerProps {
  room: Room;
  onClose: () => void;
}

const PublicRoomPlayer: React.FC<PublicRoomPlayerProps> = ({ room, onClose }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);

  // Simulation of live audio activity
  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => {
      const speaker = room.speakers[Math.floor(Math.random() * room.speakers.length)];
      setTranscriptions(prev => [...prev.slice(-5), {
        userId: speaker.id,
        userName: speaker.name,
        text: "Sharing some live insights on this public stream...",
        timestamp: Date.now()
      }]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isJoined, room.speakers]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#f7f3e9] flex flex-col">
      <nav className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
           <div className="bg-indigo-600 text-white p-2 rounded-xl">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
           </div>
           <span className="text-lg font-black tracking-tight">VOICE SOCIAL WEB PLAYER</span>
        </div>
        <button onClick={onClose} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900">Close Player</button>
      </nav>

      {!isJoined ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
           <div className="w-24 h-24 bg-indigo-600 rounded-[40px] shadow-2xl flex items-center justify-center text-white mb-8 animate-bounce">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
           </div>
           <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">{room.title}</h1>
           <p className="text-gray-500 font-medium max-w-sm mb-10 leading-relaxed">You've been invited to listen to a live conversation on VOICE SOCIAL. No account required.</p>
           <button 
            onClick={() => setIsJoined(true)}
            className="bg-indigo-600 text-white px-12 py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
           >
             Start Listening
           </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-10 flex flex-col items-center">
           {/* Visualizer area */}
           <div className="w-full max-w-lg aspect-square bg-indigo-900 rounded-[64px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
              <div className="flex items-end gap-1 h-32 mb-8">
                 {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-2 bg-indigo-400 rounded-full animate-pulse" 
                      style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} 
                    />
                 ))}
              </div>
              <p className="text-indigo-200 font-black uppercase tracking-[0.4em] text-xs">Live Audio Feed</p>
              <div className="mt-8 flex -space-x-3">
                 {room.speakers.map(s => (
                   <img key={s.id} src={s.avatar} className="w-12 h-12 rounded-full border-4 border-indigo-900 shadow-xl" alt={s.name} />
                 ))}
              </div>
           </div>

           <div className="w-full max-w-lg space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Simultaneous Transcription</span>
              </div>
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 min-h-[200px]">
                 {transcriptions.length === 0 ? (
                   <p className="text-gray-300 italic text-center py-10 font-medium">Awaiting voice activity...</p>
                 ) : (
                   transcriptions.map((t, idx) => (
                     <div key={idx} className="mb-6 last:mb-0 animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">{t.userName}</span>
                        <p className="text-gray-700 font-medium">{t.text}</p>
                     </div>
                   ))
                 )}
              </div>
           </div>
           
           <div className="bg-indigo-50 p-8 rounded-[48px] border border-indigo-100 w-full max-w-lg text-center">
              <h4 className="text-indigo-900 font-black uppercase text-sm mb-2">Want to Join the Stage?</h4>
              <p className="text-indigo-600/70 text-xs font-medium mb-6">Install the app to raise your hand and speak in this room.</p>
              <div className="flex gap-4 justify-center">
                 <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">App Store</div>
                 <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">Google Play</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicRoomPlayer;
