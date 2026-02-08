
import React, { useState, useEffect } from 'react';
import { ActiveCall, User } from '../types';

interface CallOverlayProps {
  call: ActiveCall;
  onEndCall: () => void;
  currentUser: User;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ call, onEndCall, currentUser }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call.type === 'voice');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remoteUser = call.participants.find(p => p.id !== currentUser.id) || call.participants[0];

  return (
    <div className="fixed inset-0 z-[1000] bg-indigo-950 flex flex-col items-center justify-center text-white overflow-hidden animate-in fade-in duration-500">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img src={remoteUser.avatar} className="w-full h-full object-cover blur-[100px] opacity-30 scale-110" alt="" />
        <div className="absolute inset-0 bg-indigo-950/60" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
           <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">{formatTime(duration)}</span>
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">SECURE END-TO-END</span>
        </div>
        
        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>
      </div>

      {/* Video Content / Avatars */}
      <div className="relative z-10 flex-1 w-full max-w-4xl px-6 flex flex-col items-center justify-center gap-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Remote Participant */}
            <div className={`aspect-[3/4] md:aspect-video rounded-[60px] overflow-hidden bg-white/5 border-2 border-white/10 relative shadow-2xl transition-all duration-700 ${isVideoOff ? 'flex items-center justify-center' : ''}`}>
               {!isVideoOff && call.type === 'video' ? (
                  <>
                    <img src={remoteUser.avatar} className="w-full h-full object-cover grayscale brightness-75" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 flex items-center gap-3">
                       <p className="font-black text-xl uppercase tracking-tight">{remoteUser.name}</p>
                    </div>
                  </>
               ) : (
                  <div className="flex flex-col items-center gap-6">
                     <div className="w-48 h-48 rounded-[40%] border-8 border-indigo-500/20 shadow-2xl overflow-hidden relative">
                        <img src={remoteUser.avatar} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                     </div>
                     <div className="text-center">
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">{remoteUser.name}</h2>
                        <p className="text-indigo-300 font-bold uppercase text-[10px] tracking-widest">Speaking...</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Local Preview (Self) */}
            <div className={`aspect-[3/4] md:aspect-video rounded-[60px] overflow-hidden bg-white/10 border-2 border-white/20 relative shadow-2xl ${isVideoOff ? 'flex items-center justify-center' : ''}`}>
               {!isVideoOff ? (
                  <>
                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-8 left-8">
                       <p className="font-black text-xs uppercase tracking-widest opacity-60">You</p>
                    </div>
                  </>
               ) : (
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                     <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Control Bar */}
      <div className="relative z-10 w-full max-w-2xl px-10 pb-16 pt-8">
         <div className="bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[48px] p-8 flex items-center justify-between shadow-2xl">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-6 rounded-3xl transition-all ${isMuted ? 'bg-white text-indigo-950 shadow-xl' : 'bg-white/5 hover:bg-white/10 text-white'}`}
            >
               {isMuted ? (
                 <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
               ) : (
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               )}
            </button>

            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-6 rounded-3xl transition-all ${isVideoOff ? 'bg-white text-indigo-950 shadow-xl' : 'bg-white/5 hover:bg-white/10 text-white'}`}
            >
               {isVideoOff ? (
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
               ) : (
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
               )}
            </button>

            <button 
              onClick={onEndCall}
              className="p-10 bg-red-600 text-white rounded-[32px] shadow-[0_20px_50px_rgba(220,38,38,0.5)] hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
            >
               <svg className="w-10 h-10 rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
            </button>
         </div>
      </div>
    </div>
  );
};

export default CallOverlay;
