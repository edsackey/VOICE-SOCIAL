
import React, { useState } from 'react';
import { generateRoomIdeas, optimizeScheduleDetails } from '../services/geminiService';
import { ScheduledEvent, User } from '../types';
import { StorageService } from '../services/storageService';

interface ScheduleRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: (event: ScheduledEvent) => void;
  currentUser: User;
}

const ScheduleRoomModal: React.FC<ScheduleRoomModalProps> = ({ isOpen, onClose, onScheduled, currentUser }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60 min');
  const [tags, setTags] = useState('');
  const [isSparking, setIsSparking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAiSpark = async () => {
    if (!title) {
      alert("Input a seed topic first.");
      return;
    }
    setIsSparking(true);
    try {
      const data = await optimizeScheduleDetails(title, description);
      setTitle(data.title);
      setDescription(data.description);
      setTags(data.tags.join(', '));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSparking(false);
    }
  };

  const handleSchedule = async () => {
    if (!title || !date || !time) return;
    setIsSaving(true);

    const startTime = new Date(`${date}T${time}`).getTime();
    
    const newEvent: ScheduledEvent = {
      id: `user-event-${Date.now()}`,
      title,
      description,
      hostName: currentUser.name,
      hostAvatar: currentUser.avatar,
      startTime,
      duration,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      capacity: 500,
      bookedCount: 0,
      posterUrl: `https://picsum.photos/seed/sched-${Date.now()}/1200/600`
    };

    StorageService.saveScheduledEvent(newEvent);
    
    // Simulate ignition sequence
    setTimeout(() => {
      onScheduled(newEvent);
      setIsSaving(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-4 animate-in fade-in duration-500">
      <div 
        className="w-full max-w-2xl bg-secondary rounded-[64px] overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/5 bg-secondary shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-accent rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-accent/20">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <div>
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">Hub Blueprint</h2>
               <p className="text-[10px] text-muted font-bold uppercase tracking-[0.4em]">Future Event Orchestration</p>
             </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest">Session Identity</label>
                <button 
                  onClick={handleAiSpark}
                  disabled={isSparking}
                  className="text-[9px] font-black text-white uppercase tracking-widest bg-accent px-4 py-2 rounded-full hover:bg-accent/80 transition-all flex items-center gap-2 shadow-xl shadow-accent/10 active:scale-95 disabled:opacity-50"
                >
                  {isSparking ? 'Optimizing...' : <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg> AI REFINE</>}
                </button>
              </div>
              <input 
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Topic Title..."
                className="w-full bg-main/50 border-2 border-white/5 focus:border-accent rounded-[32px] p-8 text-2xl font-bold transition-all shadow-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">Launch Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-main/50 border-2 border-white/5 rounded-[24px] p-6 text-white font-bold transition-all outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">Pulse Time</label>
                <input 
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-main/50 border-2 border-white/5 rounded-[24px] p-6 text-white font-bold transition-all outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">Event Context</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is the world's focus for this room?"
                className="w-full bg-main/50 border-2 border-white/5 rounded-[40px] p-8 text-lg font-medium min-h-[160px] transition-all outline-none focus:border-accent resize-none text-white"
              />
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">Duration Selection</label>
               <div className="grid grid-cols-3 gap-3">
                 {['30 min', '60 min', '90 min'].map(dur => (
                   <button
                    key={dur}
                    onClick={() => setDuration(dur)}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${duration === dur ? 'bg-accent border-accent text-white shadow-xl shadow-accent/20' : 'bg-white/5 border-white/10 text-muted hover:border-white/20'}`}
                   >
                     {dur}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="p-10 bg-secondary border-t border-white/5 shrink-0">
          <button 
            onClick={handleSchedule}
            disabled={!title || !date || !time || isSaving}
            className="w-full bg-main text-white py-8 rounded-[48px] font-black uppercase tracking-[0.4em] text-sm shadow-2xl border border-accent/20 hover:bg-black transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4"
          >
            {isSaving ? (
              <><div className="w-5 h-5 border-4 border-accent/30 border-t-accent rounded-full animate-spin" /> ENGAGING SYSTEMS...</>
            ) : 'Commit to Timeline →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleRoomModal;
