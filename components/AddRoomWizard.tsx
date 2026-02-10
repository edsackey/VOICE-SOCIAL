
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

  if (!isOpen) return null;

  const handleQuickLaunch = async () => {
    if (!title.trim() || isLaunching) return;
    setIsLaunching(true);

    try {
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

      const roomId = await StorageService.createRoomFirebase(roomBlueprint);
      onLaunch({ ...roomBlueprint, id: roomId });
      onClose();
    } catch (error) {
      console.error("Quick Launch Error", error);
      alert("Hub synchronization delayed.");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-5xl bg-secondary rounded-[60px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[95vh]">
        
        {/* Header */}
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
          <button onClick={onClose} className="p-5 bg-white/5 rounded-full text-muted hover:text-white transition-all border border-white/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* INSTANT GO LIVE */}
            <div className="lg:col-span-2 bg-gradient-to-br from-accent/10 to-indigo-900/10 p-12 rounded-[56px] border border-accent/20 flex flex-col justify-between group hover:border-accent/40 transition-all relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform">⚡</div>
                  <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Priority protocol</span>
                </div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tight mb-4 italic">Instant Go Live</h3>
                <p className="text-lg text-white/60 font-medium leading-relaxed mb-10 max-w-lg">Bypass scheduling. Open a live stage immediately for spontaneous tribal syncing. Pure voice, zero friction.</p>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="relative">
                   <label className="absolute -top-2.5 left-6 bg-secondary px-2 text-[10px] font-black text-accent uppercase tracking-widest">Stage Identity</label>
                   <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Morning Reflections, Dev Sync, Open Mic..."
                    className="w-full bg-main border-2 border-white/5 rounded-[24px] p-7 text-xl font-bold text-white outline-none focus:border-accent/50 transition-all shadow-inner"
                  />
                </div>
                <button 
                  onClick={handleQuickLaunch}
                  disabled={!title.trim() || isLaunching}
                  className="w-full bg-accent text-white py-8 rounded-[32px] font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_50px_rgba(24,119,242,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-4"
                >
                  {isLaunching ? (
                    <><div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> SYNCING WITH HUB...</>
                  ) : 'IGNITE INSTANT STAGE'}
                </button>
              </div>
            </div>

            {/* EVENT SETUP PANEL PATHS */}
            <div className="flex flex-col gap-10">
                {/* Advanced Schedule */}
                <div 
                  onClick={() => { onClose(); onOpenAdvancedSchedule(); }}
                  className="flex-1 bg-white/5 p-10 rounded-[48px] border border-white/10 hover:border-accent/30 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-6 transition-transform">📅</div>
                    <h3 className="text-2xl font-black text-main uppercase tracking-tight mb-2 italic">Event Setup</h3>
                    <p className="text-xs text-muted font-medium leading-relaxed opacity-70">Recurring series, one-time bookings, and seat reservations. Advanced audience logic.</p>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Open Panel →</span>
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-accent/20 border border-white/10" />)}
                    </div>
                  </div>
                </div>

                {/* Viral Ignition */}
                <div 
                  onClick={() => { onClose(); onOpenViralLaunchpad(); }}
                  className="flex-1 bg-indigo-600 p-10 rounded-[48px] shadow-2xl shadow-indigo-900/20 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-[3000ms]" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">🚀</div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 italic">Viral Ignition</h3>
                      <p className="text-xs text-white/70 font-medium leading-relaxed">AI-generated marketing kit. Viral posters, teasers, and cross-platform payloads.</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 mt-6">Neural Studio →</span>
                  </div>
                </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-secondary/90 border-t border-white/5 flex justify-between items-center shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <p className="text-[10px] text-muted font-bold uppercase tracking-[0.3em]">Hub Engine v3.0 • Industrial Redundancy Active</p>
          </div>
          <p className="text-[10px] text-muted/30 font-black uppercase tracking-[0.5em]">EchoHub Communications Mesh</p>
        </div>
      </div>
    </div>
  );
};

export default AddRoomWizard;
