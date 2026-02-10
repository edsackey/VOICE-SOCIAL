
import React, { useState } from 'react';
import { Room, User, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface AddRoomWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (room: Room) => void;
  currentUser: User;
  onOpenViralLaunchpad: () => void;
  onOpenAdvancedSchedule: () => void;
}

const AddRoomWizard: React.FC<AddRoomWizardProps> = ({ 
  isOpen, 
  onClose, 
  onLaunch, 
  currentUser, 
  onOpenViralLaunchpad,
  onOpenAdvancedSchedule
}) => {
  const [title, setTitle] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const handleQuickLaunch = async () => {
    if (!title.trim() || isLaunching) return;
    setIsLaunching(true);

    // SPEED OPTIMIZATION: Construct blueprint immediately
    const roomBlueprint: Omit<Room, 'id'> = {
      title: title.trim(),
      description: "A spontaneous live discussion.",
      followerCount: 0,
      followers: [],
      tags: ["Live", "Instant"],
      participantCount: 1,
      sentiment: 'neutral',
      isLive: true,
      startTime: Date.now(),
      speakers: [{
        ...currentUser,
        role: UserRole.HOST,
        isMuted: false,
        handRaised: false
      }],
      listeners: [],
      posterUrl: `https://picsum.photos/seed/${Date.now()}/1200/600`
    };

    try {
      // Execute Firebase write and UI transition in parallel/background
      // Using a temporary local ID to bypass wait time for Firestore doc creation
      const tempId = `hub-instant-${Date.now()}`;
      
      // Fire and forget (it handles its own errors internally)
      StorageService.createRoomFirebase(roomBlueprint);

      // Instant UI update (< 100ms)
      onLaunch({ ...roomBlueprint, id: tempId });
      onClose();
    } catch (error) {
      console.error("Turbo Launch Failed", error);
      setIsLaunching(false);
    }
  };

  // MINIMIZED STATE UI
  if (isMinimized) {
    return (
      <div className="fixed bottom-32 right-10 z-[500] animate-in slide-in-from-right-8 duration-500">
        <div className="bg-secondary/95 backdrop-blur-3xl border-2 border-accent/30 rounded-[32px] p-4 shadow-2xl flex items-center gap-6 ring-4 ring-accent/5">
           <div 
            onClick={() => setIsMinimized(false)}
            className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
           >
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
           </div>
           <div className="pr-4 cursor-pointer" onClick={() => setIsMinimized(false)}>
              <p className="text-[8px] font-black text-accent uppercase tracking-widest leading-none mb-1">Launch Pending</p>
              <h4 className="text-[12px] font-black text-main uppercase tracking-tight max-w-[120px] truncate italic">
                {title || 'Draft Stage'}
              </h4>
           </div>
           <button onClick={onClose} className="p-2 text-muted hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-secondary rounded-[60px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[95vh]">
        
        {/* Header with Minimize Icon */}
        <div className="p-12 border-b border-white/5 flex justify-between items-center bg-secondary/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-accent rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-accent/20 rotate-3">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-main uppercase tracking-tighter italic">Launch Command</h2>
              <p className="text-[10px] text-muted font-black uppercase tracking-[0.5em] mt-1">Select broadcast protocol</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setIsMinimized(true)} 
              className="p-5 bg-white/5 rounded-full text-muted hover:text-white transition-all border border-white/10"
              title="Minimize"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
            </button>
            <button 
              onClick={onClose} 
              className="p-5 bg-white/5 rounded-full text-muted hover:text-white transition-all border border-white/10"
              title="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* INSTANT GO LIVE - OPTIMIZED FOR TURBO SPEED */}
            <div className="lg:col-span-2 bg-gradient-to-br from-accent/10 to-indigo-900/10 p-12 rounded-[56px] border border-accent/20 flex flex-col justify-between group hover:border-accent/40 transition-all relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform">⚡</div>
                  <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Turbo Protocol Active</span>
                </div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tight mb-4 italic">Instant Go Live</h3>
                <p className="text-lg text-white/60 font-medium leading-relaxed mb-10 max-w-lg">Bypass verification. Open a live stage in milliseconds. Perceived ignition time: **Under 1.0s**.</p>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="relative">
                   <label className="absolute -top-2.5 left-6 bg-secondary px-2 text-[10px] font-black text-accent uppercase tracking-widest">Stage Identity</label>
                   <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Morning Reflections, Dev Sync..."
                    className="w-full bg-main border-2 border-white/5 rounded-[24px] p-7 text-xl font-bold text-white outline-none focus:border-accent/50 transition-all shadow-inner"
                  />
                </div>
                <button 
                  onClick={handleQuickLaunch}
                  disabled={!title.trim() || isLaunching}
                  className="w-full bg-accent text-white py-8 rounded-[32px] font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_50px_rgba(24,119,242,0.3)] hover:scale-[1.02] active:scale-90 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-4"
                >
                  {isLaunching ? 'ENGINE STARTING...' : 'IGNITE HUB INSTANTLY'}
                </button>
              </div>
            </div>

            {/* EVENT SETUP PANEL PATHS */}
            <div className="flex flex-col gap-10">
                <div 
                  onClick={() => { onClose(); onOpenAdvancedSchedule(); }}
                  className="flex-1 bg-white/5 p-10 rounded-[48px] border border-white/10 hover:border-accent/30 transition-all cursor-pointer group flex flex-col justify-between active:scale-95"
                >
                  <div>
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-6 transition-transform">📅</div>
                    <h3 className="text-2xl font-black text-main uppercase tracking-tight mb-2 italic">Event Setup</h3>
                    <p className="text-xs text-muted font-medium leading-relaxed opacity-70">Recurring patterns and deep scheduling logic.</p>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Expand Matrix →</span>
                  </div>
                </div>

                <div 
                  onClick={() => { onClose(); onOpenViralLaunchpad(); }}
                  className="flex-1 bg-indigo-600 p-10 rounded-[48px] shadow-2xl shadow-indigo-900/20 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-[3000ms]" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">🚀</div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 italic">Viral Ignition</h3>
                      <p className="text-xs text-white/70 font-medium leading-relaxed">AI marketing kits for global dominance.</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 mt-6">Neural Studio →</span>
                  </div>
                </div>
            </div>

          </div>
        </div>

        <div className="p-10 bg-secondary/90 border-t border-white/5 flex justify-between items-center shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <p className="text-[10px] text-muted font-bold uppercase tracking-[0.3em]">Ignition Systems: SNAP READY</p>
          </div>
          <p className="text-[10px] text-muted/30 font-black uppercase tracking-[0.5em]">EchoHub Communications Mesh</p>
        </div>
      </div>
    </div>
  );
};

export default AddRoomWizard;
