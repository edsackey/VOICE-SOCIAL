
import React, { useState, useEffect, useRef } from 'react';
import { PodcastRecord } from '../types';
import { StorageService } from '../services/storageService';

interface PodcastArchiveProps {
  isOpen: boolean;
  onClose: () => void;
}

const PodcastArchive: React.FC<PodcastArchiveProps> = ({ isOpen, onClose }) => {
  const [podcasts, setPodcasts] = useState<PodcastRecord[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPodcasts(StorageService.getPodcasts());
    }
  }, [isOpen]);

  const downloadFile = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePlayAudio = (record: PodcastRecord) => {
    if (audioRef.current) {
      audioRef.current.src = record.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Permanently expel this record from the vault?")) {
      const updated = podcasts.filter(p => p.id !== id);
      setPodcasts(updated);
      localStorage.setItem('voiceroomlive_podcasts', JSON.stringify(updated));
      if (selectedPodcast?.id === id) setSelectedPodcast(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-500" onClick={onClose}>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
      
      <div 
        className="w-full max-w-6xl bg-secondary rounded-[64px] overflow-hidden shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-300 border border-white/10 ring-1 ring-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-secondary shrink-0">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-accent rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-accent/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </div>
             <div>
               <h2 className="text-4xl font-black text-main uppercase tracking-tighter italic">Neural Vault</h2>
               <p className="text-[10px] text-muted font-black uppercase tracking-[0.6em] mt-1">High-Fidelity Audio Archives</p>
             </div>
          </div>
          <button onClick={onClose} className="p-5 bg-white/5 rounded-full text-muted hover:text-white transition-all active:scale-90 border border-white/5">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Recording List */}
          <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar p-8 bg-main/10">
             <h3 className="text-[10px] font-black text-accent uppercase tracking-widest mb-6 ml-2">Broadcast History</h3>
             <div className="space-y-4">
                {podcasts.length === 0 ? (
                  <p className="text-xs font-bold text-muted uppercase italic text-center py-20 opacity-30">No records found</p>
                ) : podcasts.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPodcast(p)}
                    className={`w-full text-left p-6 rounded-[32px] transition-all border group relative overflow-hidden ${selectedPodcast?.id === p.id ? 'bg-accent border-accent text-white shadow-2xl' : 'bg-secondary border-white/5 text-main hover:bg-white/5'}`}
                  >
                    <div className="relative z-10">
                       <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedPodcast?.id === p.id ? 'text-white/60' : 'text-accent'}`}>{p.date}</p>
                       <h4 className="font-black text-lg uppercase tracking-tight truncate mb-2 italic">{p.title}</h4>
                       <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>{p.duration} Master</span>
                          <span className={`text-[10px] font-black uppercase`}>{p.speakers.length} Voices</span>
                       </div>
                    </div>
                  </button>
                ))}
             </div>
          </div>

          {/* Main - Detail View */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-main/5 relative">
             {selectedPodcast ? (
               <div className="p-12 animate-in slide-in-from-right-8 duration-500">
                  <div className="bg-secondary rounded-[56px] p-12 border border-white/10 shadow-2xl space-y-12">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                           <h3 className="text-5xl font-black text-main uppercase tracking-tighter italic mb-2">{selectedPodcast.title}</h3>
                           <div className="flex flex-wrap gap-3">
                              <span className="bg-indigo-600/10 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{selectedPodcast.date} Session</span>
                              <span className="bg-orange-600/10 text-orange-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-500/20">{selectedPodcast.duration} Duration</span>
                           </div>
                        </div>
                        <div className="flex gap-4">
                           <button 
                             onClick={() => handlePlayAudio(selectedPodcast)}
                             className="bg-accent text-white px-10 py-5 rounded-[32px] font-black uppercase text-[11px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                           >
                              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                              Replay Audio
                           </button>
                           <button 
                             onClick={() => downloadFile(selectedPodcast.minutes, `EchoHub_Summary_${selectedPodcast.id}.txt`)}
                             className="p-5 bg-white/5 border border-white/10 rounded-full text-main hover:bg-white/10 transition-all"
                           >
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-6">
                           <h4 className="text-xs font-black text-accent uppercase tracking-[0.4em] flex items-center gap-4">
                              <span className="w-8 h-1 bg-accent rounded-full" />
                              AI Intelligence Report
                           </h4>
                           <div className="bg-main/30 p-10 rounded-[48px] border border-white/5 italic leading-relaxed text-2xl text-main/80 whitespace-pre-wrap font-medium">
                              "{selectedPodcast.minutes}"
                           </div>
                        </div>
                        <div className="space-y-10">
                           <div>
                              <h4 className="text-xs font-black text-orange-400 uppercase tracking-[0.4em] mb-6">Voice Nodes</h4>
                              <div className="flex flex-wrap gap-3">
                                 {selectedPodcast.speakers.map(s => (
                                   <div key={s} className="bg-secondary p-4 rounded-3xl border border-white/5 flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent">ID</div>
                                      <span className="text-xs font-black uppercase text-main">{s}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           <button 
                            onClick={() => handleDelete(selectedPodcast.id)}
                            className="w-full py-6 rounded-[32px] bg-red-600/10 text-red-500 font-black uppercase text-[10px] tracking-widest border border-red-500/20 hover:bg-red-600 hover:text-white transition-all mt-10"
                           >
                             Purge from Hub
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-20 text-center px-10">
                  <svg className="w-32 h-32 mb-10 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="text-2xl font-black uppercase tracking-[0.8em]">Secure Access</h3>
                  <p className="text-sm font-bold uppercase tracking-widest mt-4">Select a broadcast to engage with its neural master</p>
               </div>
             )}
          </div>
        </div>

        <div className="p-10 bg-secondary border-t border-white/5 text-center shrink-0">
           <p className="text-[9px] text-muted/30 font-black uppercase tracking-[1em]">EchoHub Industrial Security • Vault v4.2</p>
        </div>
      </div>
    </div>
  );
};

export default PodcastArchive;
