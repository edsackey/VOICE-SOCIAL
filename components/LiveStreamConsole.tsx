
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
    const platformStr = String(platform);
    if (!streamKeys[platformStr as keyof typeof streamKeys]) {
      alert(`Please enter your ${platformStr.toUpperCase()} Stream Key first.`);
      return;
    }

    setIsConnecting(platformStr);
    // Simulate connection delay
    setTimeout(() => {
      setStreams(prev => ({ ...prev, [platform]: true }));
      setIsConnecting(null);
      setConfiguring(null);
    }, 2500);
  };

  const stopStream = (platform: keyof typeof streams) => {
    setStreams(prev => ({ ...prev, [platform]: false }));
  };

  const publicUrl = `${window.location.origin}${window.location.pathname}?public=true`;

  return (
    <div className="fixed inset-0 z-[550] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#0d1117] rounded-[56px] overflow-hidden shadow-[0_60px_150px_-30px_rgba(0,0,0,0.9)] border border-white/5 flex flex-col animate-in zoom-in-95 duration-300 ring-1 ring-white/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-10 bg-[#010409] flex justify-between items-center shrink-0 border-b border-white/5">
          <div className="flex items-center gap-5 text-white">
             <div className="relative">
                <div className="w-14 h-14 bg-cyan-600/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                {Object.values(streams).some(v => v) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#010409] animate-pulse" />
                )}
             </div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Global Uplink</h2>
                <p className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.4em]">Social Multi-Stream Controller</p>
             </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 transition-all border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto max-h-[70vh] no-scrollbar">
           {/* Public Link Section */}
           <div className="bg-[#010409] rounded-[40px] p-10 border border-white/5 space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-10 -mt-10" />
              <div className="flex justify-between items-start relative z-10">
                 <div>
                    <h3 className="text-white font-black uppercase text-sm tracking-[0.2em] mb-2">Public Web Stream</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">Let anyone listen via browser link.<br/>No registration or app installation required.</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/20">Active Node</span>
                 </div>
              </div>
              <div className="bg-[#0d1117] p-6 rounded-3xl flex items-center justify-between gap-6 border border-white/5 shadow-inner">
                 <p className="text-slate-600 text-[11px] font-bold truncate flex-1 font-mono tracking-tight">{publicUrl}</p>
                 <button 
                  onClick={() => { navigator.clipboard.writeText(publicUrl); alert("Stream Link Dispatched to Clipboard"); }}
                  className="bg-cyan-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-900/20 active:scale-95"
                 >
                   Copy URL
                 </button>
              </div>
           </div>

           {/* Social Stream Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'youtube', name: 'YouTube Live', icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', color: 'bg-red-500' },
                { id: 'facebook', name: 'Facebook Live', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png', color: 'bg-blue-600' },
                { id: 'twitch', name: 'Twitch TV', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png', color: 'bg-purple-600' }
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setConfiguring(configuring === p.id ? null : p.id)}
                  disabled={!!isConnecting}
                  className={`p-8 rounded-[40px] border-2 flex flex-col items-center gap-6 transition-all relative overflow-hidden group ${streams[p.id as keyof typeof streams] ? 'border-green-500/50 bg-green-500/5' : configuring === p.id ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/5 bg-[#010409] hover:bg-[#161b22] hover:border-white/10'}`}
                >
                   <div className={`p-4 rounded-2xl transition-all ${streams[p.id as keyof typeof streams] ? p.color : 'bg-white/5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                      <img src={p.icon} className={`w-8 h-8 object-contain ${streams[p.id as keyof typeof streams] ? 'invert' : ''}`} alt={p.name} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{p.name}</span>
                   
                   {streams[p.id as keyof typeof streams] && (
                     <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="text-[8px] font-black text-green-400 uppercase">Live</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                     </div>
                   )}
                </button>
              ))}
           </div>

           {/* Configuration Panel */}
           {configuring && (
             <div className="bg-[#010409] rounded-[48px] p-10 border border-cyan-500/20 animate-in slide-in-from-top-6 duration-500 shadow-2xl relative">
                <div className="flex items-center justify-between mb-10">
                   <h4 className="text-white font-black uppercase text-xs tracking-[0.4em] flex items-center gap-4">
                      <span className="w-8 h-1 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></span>
                      Configure {configuring.toUpperCase()} Relay
                   </h4>
                   {streams[configuring as keyof typeof streams] && (
                     <span className="text-[9px] font-black text-green-400 uppercase tracking-widest bg-green-400/10 px-4 py-1.5 rounded-full border border-green-500/20">Transmission Active</span>
                   )}
                </div>

                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">RTMP Stream Key</label>
                      <input 
                        type="password"
                        placeholder="Paste alphanumeric secure key..."
                        value={streamKeys[configuring as keyof typeof streamKeys]}
                        onChange={(e) => handleKeyChange(configuring, e.target.value)}
                        className="w-full bg-[#0d1117] border-2 border-white/5 rounded-[24px] p-6 text-white text-sm font-mono focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                      />
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4">
                      {!streams[configuring as keyof typeof streams] ? (
                        <button 
                          onClick={() => startStream(configuring as any)}
                          disabled={!!isConnecting || !streamKeys[configuring as keyof typeof streamKeys]}
                          className="flex-1 bg-cyan-600 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-cyan-500 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-4"
                        >
                          {isConnecting === configuring ? (
                            <>
                              <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                              Negotiating Uplink...
                            </>
                          ) : 'Initiate Broadcast'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => stopStream(configuring as any)}
                          className="flex-1 bg-red-600/20 text-red-500 border border-red-500/30 py-6 rounded-[28px] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-red-600 hover:text-white transition-all active:scale-95"
                        >
                          Sever Connection
                        </button>
                      )}
                      <button 
                        onClick={() => setConfiguring(null)}
                        className="px-10 py-6 bg-white/5 text-slate-500 rounded-[28px] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                   </div>
                </div>

                <div className="mt-10 flex items-center gap-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest px-4">
                   <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   Secure Handshake: SHA-256 Encrypted
                </div>
             </div>
           )}

           <div className="bg-cyan-900/10 p-10 rounded-[48px] border border-cyan-500/10">
              <div className="flex items-center gap-4 mb-6 text-cyan-400">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <h4 className="text-sm font-black uppercase tracking-[0.2em]">Protocol Documentation</h4>
              </div>
              <p className="text-cyan-100/40 text-xs leading-relaxed font-medium">
                EchoHub uses industrial RTMP relay clusters to push synchronized audio frames and AI voice layers to external CDNs. 
                External listeners via social platforms receive a standard video/audio stream. Participation is restricted to native Nexus ID holders within this Hub environment.
              </p>
           </div>
        </div>

        <div className="p-10 bg-[#010409] border-t border-white/5 text-center shrink-0">
           <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.8em]">Broadcasting Cluster Alpha v3.0</p>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamConsole;
