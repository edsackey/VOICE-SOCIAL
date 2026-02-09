
import React, { useState, useEffect } from 'react';
import { PodcastRecord } from '../types';
import { StorageService } from '../services/storageService';

interface RoomRecordingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  roomId: string;
}

const RoomRecordingsModal: React.FC<RoomRecordingsModalProps> = ({ isOpen, onClose, roomTitle, roomId }) => {
  const [recordings, setRecordings] = useState<PodcastRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecordings(StorageService.getPodcasts(roomId));
    }
  }, [isOpen, roomId]);

  const downloadMinutes = (podcast: PodcastRecord) => {
    const element = document.createElement("a");
    const file = new Blob([podcast.minutes], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `VOICE_SOCIAL_Minutes_${podcast.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#f7f3e9] rounded-[56px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
             </div>
             <div>
               <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1">{roomTitle}</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Previous Session Recordings</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center space-y-4">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <p className="text-sm font-black uppercase tracking-widest">No recordings found for this Hub</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recordings.map(rec => (
                <div key={rec.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:border-orange-200 transition-all">
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">{rec.date}</p>
                      <h4 className="text-sm font-bold text-gray-900 truncate pr-4">{rec.title}</h4>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        title="Download Minutes"
                        onClick={() => downloadMinutes(rec)}
                        className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-50 hover:bg-indigo-50 active:scale-95 transition-all"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button 
                        title="Listen to Podcast"
                        className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                        onClick={() => alert("Replaying audio stream from Vault...")}
                      >
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center shrink-0">
           <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.4em]">VOICE SOCIAL Vault • Cloud Redundancy Enabled</p>
        </div>
      </div>
    </div>
  );
};

export default RoomRecordingsModal;
