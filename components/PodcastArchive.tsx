
import React, { useState, useEffect } from 'react';
import { PodcastRecord } from '../types';

interface PodcastArchiveProps {
  isOpen: boolean;
  onClose: () => void;
}

const PodcastArchive: React.FC<PodcastArchiveProps> = ({ isOpen, onClose }) => {
  const [podcasts, setPodcasts] = useState<PodcastRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('voiceroomlive_podcasts');
    if (saved) setPodcasts(JSON.parse(saved));
  }, [isOpen]);

  const downloadMinutes = (podcast: PodcastRecord) => {
    const element = document.createElement("a");
    const file = new Blob([podcast.minutes], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `VOICE_SOCIAL_Minutes_${podcast.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAllData = () => {
    if (podcasts.length === 0) return;
    
    let consolidated = "VOICE SOCIAL GLOBAL ARCHIVE - CONSOLIDATED REPORT\n";
    consolidated += "================================================\n\n";
    
    podcasts.forEach((p, idx) => {
      consolidated += `SESSION #${idx + 1}: ${p.title}\n`;
      consolidated += `DATE: ${p.date}\n`;
      consolidated += `SPEAKERS: ${p.speakers.join(', ')}\n`;
      consolidated += `------------------------------------------------\n`;
      consolidated += p.minutes + "\n\n";
      consolidated += "************************************************\n\n";
    });

    const element = document.createElement("a");
    const file = new Blob([consolidated], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `VOICE_SOCIAL_Full_Vault_Export.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-gray-900/90 backdrop-blur-2xl flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-[#f7f3e9] rounded-[60px] overflow-hidden shadow-2xl flex flex-col h-[85vh] animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </div>
             <div>
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">VOICE SOCIAL Vault</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Podcasts & Session Minutes</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {podcasts.length > 0 && (
                <button 
                  onClick={downloadAllData}
                  className="bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export All
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
               <p className="text-sm font-black uppercase tracking-[0.3em]">No recordings found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {podcasts.map(podcast => (
                <div key={podcast.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-indigo-200 transition-all">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Archive</span>
                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{podcast.date}</span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">{podcast.title}</h3>
                      <div className="flex gap-2">
                        {podcast.speakers.map((s, i) => (
                           <span key={i} className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">@{s}</span>
                        ))}
                      </div>
                   </div>

                   <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => downloadMinutes(podcast)}
                        className="px-6 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         Download Minutes
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-gray-100 flex justify-center shrink-0">
           <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.4em]">VOICE SOCIAL Digital Archive</p>
        </div>
      </div>
    </div>
  );
};

export default PodcastArchive;
