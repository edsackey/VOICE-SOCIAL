
import React, { useState } from 'react';

interface LiveStreamConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
}

const LiveStreamConsole: React.FC<LiveStreamConsoleProps> = ({ isOpen, onClose, roomTitle }) => {
  const [streams, setStreams] = useState({
    youtube: false,
    facebook: false,
    twitch: false,
    publicLink: true
  });
  const [streamKeys, setStreamKeys] = useState({
    youtube: '',
    facebook: '',
    twitch: ''
  });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyChange = (platform: string, value: string) => {
    setStreamKeys(prev => ({ ...prev, [platform]: value }));
  };

  const startStream = (platform: keyof typeof streams) => {
    if (!streamKeys[platform as keyof typeof streamKeys]) {
      // Fix: Wrapped platform in String() to avoid implicit conversion error from symbol to string
      alert(`Please enter your ${String(platform)} Stream Key first.`);
      return;
    }

    // Fix: Wrapped platform in String() to ensure it is treated as a string for state management
    setIsConnecting(String(platform));
    // Simulate connection delay
    setTimeout(() => {
      setStreams(prev => ({ ...prev, [platform]: true }));
      setIsConnecting(null);
      setConfiguring(null);
    }, 2000);
  };

  const stopStream = (platform: keyof typeof streams) => {
    setStreams(prev => ({ ...prev, [platform]: false }));
  };

  const publicUrl = `${window.location.origin}${window.location.pathname}?public=true`;

  return (
    <div className="fixed inset-0 z-[550] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-slate-900 rounded-[56px] overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 bg-indigo-600 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 text-white">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">Cloud Multi-Stream</h2>
                <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">EchoHub Broadcast Engine</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
           {/* Public Link Section */}
           <div className="bg-slate-800/50 rounded-[40px] p-8 border border-white/5 space-y-6">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-white font-black uppercase text-sm tracking-widest mb-1">Public Web Feed</h3>
                    <p className="text-slate-400 text-xs font-medium">Allow anyone to listen via web link (No app install)</p>
                 </div>
                 <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Active</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl flex items-center justify-between gap-4 border border-white/5">
                 <p className="text-slate-500 text-[10px] font-bold truncate flex-1">{publicUrl}</p>
                 <button 
                  onClick={() => { navigator.clipboard.writeText(publicUrl); alert("Copied!"); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all"
                 >
                   Copy
                 </button>
              </div>
           </div>

           {/* Social Stream Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'youtube', name: 'YouTube Live', icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
                { id: 'facebook', name: 'Facebook Live', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png' },
                { id: 'twitch', name: 'Twitch', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png' }
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setConfiguring(configuring === p.id ? null : p.id)}
                  disabled={!!isConnecting}
                  className={`p-6 rounded-[32px] border-2 flex flex-col items-center gap-4 transition-all relative overflow-hidden group ${streams[p.id as keyof typeof streams] ? 'border-green-500 bg-green-500/10' : configuring === p.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-slate-800/50 hover:bg-slate-800'}`}
                >
                   <img src={p.icon} className={`w-10 h-10 object-contain transition-all ${streams[p.id as keyof typeof streams] ? 'grayscale-0 opacity-100' : 'brightness-90 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`} alt={p.name} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{p.name}</span>
                   
                   {streams[p.id as keyof typeof streams] && (
                     <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   )}
                </button>
              ))}
           </div>

           {/* Configuration Panel */}
           {configuring && (
             <div className="bg-slate-800 rounded-[40px] p-8 border border-indigo-500/30 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3">
                      <span className="w-6 h-1 bg-indigo-500 rounded-full"></span>
                      Setup {configuring.toUpperCase()} Stream
                   </h4>
                   {streams[configuring as keyof typeof streams] && (
                     <span className="text-[9px] font-black text-green-400 uppercase tracking-widest bg-green-400/10 px-3 py-1 rounded-full">LIVE</span>
                   )}
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Stream Key</label>
                      <input 
                        type="password"
                        placeholder="Paste your stream key here..."
                        value={streamKeys[configuring as keyof typeof streamKeys]}
                        onChange={(e) => handleKeyChange(configuring, e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                   </div>

                   <div className="flex gap-4 pt-2">
                      {!streams[configuring as keyof typeof streams] ? (
                        <button 
                          onClick={() => startStream(configuring as any)}
                          disabled={!!isConnecting || !streamKeys[configuring as keyof typeof streamKeys]}
                          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                          {isConnecting === configuring ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Connecting...
                            </>
                          ) : 'Start Streaming'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => stopStream(configuring as any)}
                          className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-700 active:scale-95 transition-all"
                        >
                          Stop Streaming
                        </button>
                      )}
                      <button 
                        onClick={() => setConfiguring(null)}
                        className="px-8 py-4 bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-600 transition-all"
                      >
                        Cancel
                      </button>
                   </div>
                </div>

                <div className="mt-6 flex items-center gap-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   Key is encrypted and never shared.
                </div>
             </div>
           )}

           <div className="bg-indigo-900/20 p-8 rounded-[40px] border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-4 text-indigo-400">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <h4 className="text-xs font-black uppercase tracking-widest">Cloud Bridge Info</h4>
              </div>
              <p className="text-indigo-200/60 text-xs leading-relaxed">
                EchoHub uses low-latency RTMP relay to push your room's mixed audio (including background music and AI voice) to external platforms. 
                Audience on external platforms can listen but cannot participate in the conversation stage.
              </p>
           </div>
        </div>

        <div className="p-8 bg-slate-950 border-t border-white/5 text-center shrink-0">
           <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.5em]">Global Feed Controller v2.1</p>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamConsole;
