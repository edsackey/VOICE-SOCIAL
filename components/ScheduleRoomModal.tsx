
import React, { useState } from 'react';
import { generateRoomIdeas } from '../services/geminiService';
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
      alert("Please enter a basic topic first!");
      return;
    }
    setIsSparking(true);
    try {
      const ideas = await generateRoomIdeas(title);
      setTitle(ideas.title);
      setDescription(ideas.description);
      setTags(ideas.tags.join(', '));
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
      id: `event-${Date.now()}`,
      title,
      description,
      hostName: currentUser.name,
      hostAvatar: currentUser.avatar,
      startTime,
      duration,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      capacity: 500,
      bookedCount: 0,
      posterUrl: `https://picsum.photos/seed/${Date.now()}/1200/600`
    };

    StorageService.saveScheduledEvent(newEvent);
    
    setTimeout(() => {
      onScheduled(newEvent);
      setIsSaving(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-xl bg-[#f7f3e9] rounded-[56px] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <div>
               <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Schedule Room</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Plan your next big broadcast</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Room Title</label>
                <button 
                  onClick={handleAiSpark}
                  disabled={isSparking}
                  className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                >
                  {isSparking ? 'Sparking...' : <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg> AI SPARK</>}
                </button>
              </div>
              <input 
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Future of Social Audio..."
                className="w-full bg-white border-2 border-transparent focus:border-indigo-100 rounded-3xl p-5 text-gray-800 font-bold focus:ring-8 focus:ring-indigo-50/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white border-none rounded-2xl p-4 text-gray-800 font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Time</label>
                <input 
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-white border-none rounded-2xl p-4 text-gray-800 font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Duration</label>
              <select 
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full bg-white border-none rounded-2xl p-4 text-gray-800 font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all"
              >
                <option value="30 min">30 Minutes</option>
                <option value="60 min">1 Hour</option>
                <option value="90 min">1.5 Hours</option>
                <option value="2 hours">2 Hours</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this event about?"
                className="w-full bg-white border-none rounded-[32px] p-6 text-sm font-medium min-h-[100px] shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
              />
            </div>
          </section>
        </div>

        <div className="p-8 bg-white border-t border-gray-100 shrink-0">
          <button 
            onClick={handleSchedule}
            disabled={!title || !date || !time || isSaving}
            className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling...</>
            ) : 'Schedule Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleRoomModal;
