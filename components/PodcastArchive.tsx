
import React, { useState, useEffect } from 'react';
import { PodcastRecord } from '../types';
import { StorageService } from '../services/storageService';

interface PodcastArchiveProps {
  isOpen: boolean;
  onClose: () => void;
}

const PodcastArchive: React.FC<PodcastArchiveProps> = ({ isOpen, onClose }) => {
  const [podcasts, setPodcasts] = useState<PodcastRecord[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastRecord | null>(null);

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

  const downloadMinutes = (podcast: PodcastRecord) => {
    const filename = `Chat-Chap_Minutes_${podcast.title.replace(/\s+/g, '_')}_${podcast.date.replace(/\//g, '-')}.txt`;
    downloadFile(podcast.minutes, filename);
  };

  const downloadAllData = () => {
    if (podcasts.length === 0) return;
    
    let consolidated = "CHAT-CHAP GLOBAL ARCHIVE - CONSOLIDATED REPORT\n";
    consolidated += "================================================\n\n";
    
    podcasts.forEach((p, idx) => {
      consolidated += `SESSION #${idx + 1}: ${p.title}\n`;
      consolidated += `DATE: ${p.date}\n`;
      consolidated += `SPEAKERS: ${p.speakers.join(', ')}\n`;
      consolidated += `------------------------------------------------\n`;
      consolidated += p.minutes + "\n\n";
      consolidated += "************************************************\n\n";
    });

    downloadFile(consolidated, `Chat-Chap_Vault_Export_${new Date().toISOString().split('T')[0]}.txt`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-gray-900/90 backdrop-blur-2xl flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-[#f7f3e9] rounded-[60px] overflow-hidden shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </div>
             <div>
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Chat-Chap Vault</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Podcasts & AI Session Summary</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {podcasts.length > 0 && (
                <button 
                  onClick={downloadAllData}
                  className="bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Consolidated Export
                </button>
             )}
             <button onClick={onClose} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-100">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {podcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20 text-center space-y-4">
               <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <p className="text-sm font-black uppercase tracking-[0.3em]">No records found</p>
            </div>
          ) : selectedPodcast ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <button onClick={() => setSelectedPodcast(null)} className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  Back to Hub
               </button>
               <div className="bg-white p-10 rounded-[56px] shadow-sm border border-gray-100 mb-10">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">{selectedPodcast.title}</h3>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedPodcast.date} • Session Captured</p>
                     </div>
                     <button 
                        onClick={() => downloadMinutes(selectedPodcast)}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                     >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Transcription
                     </button>
                  </div>
                  <div className="prose prose-indigo max-w-none">
                     <div className="whitespace-pre-wrap font-medium text-gray-600 leading-relaxed bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                        {selectedPodcast.minutes}
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {podcasts.map(podcast => (
                <div 
                   key={podcast.id} 
                   onClick={() => setSelectedPodcast(podcast)}
                   className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer"
                >
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Capture Node</span>
                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{podcast.date}</span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{podcast.title}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {podcast.speakers.map((s, i) => (
                           <span key={i} className="bg-gray-50 text-[9px] font-bold text-gray-400 px-2 py-1 rounded-md uppercase tracking-tighter border border-gray-100">@{s}</span>
                        ))}
                      </div>
                   </div>

                   <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => downloadMinutes(podcast)}
                        className="p-5 bg-white text-indigo-600 rounded-[24px] border-2 border-indigo-50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Download Log"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button 
                        onClick={() => setSelectedPodcast(podcast)}
                        className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                      >
                         Analysis Hub
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-gray-100 flex justify-center shrink-0">
           <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.4em]">Chat-Chap Neural Archive • Industrial Grade Security</p>
        </div>
      </div>
    </div>
  );
};

export default PodcastArchive;
