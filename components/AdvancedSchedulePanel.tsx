
import React, { useState } from 'react';
import { ScheduledEvent, User, RecurrenceType } from '../types';
import { StorageService } from '../services/storageService';
import { optimizeScheduleDetails } from '../services/geminiService';

interface AdvancedSchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: (event: ScheduledEvent) => void;
  currentUser: User;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AdvancedSchedulePanel: React.FC<AdvancedSchedulePanelProps> = ({ isOpen, onClose, onScheduled, currentUser }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60 min');
  const [tags, setTags] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('NONE');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [capacity, setCapacity] = useState(500);
  const [price, setPrice] = useState(0);
  
  const [isSparking, setIsSparking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAiSpark = async () => {
    if (!title) return alert("Seed topic required.");
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

  const toggleDay = (index: number) => {
    setRecurringDays(prev => 
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

  const handleSchedule = async () => {
    if (!title || !date || !time) return;
    setIsSaving(true);

    const startTime = new Date(`${date}T${time}`).getTime();
    
    const newEvent: ScheduledEvent = {
      id: `adv-event-${Date.now()}`,
      title,
      description,
      hostName: currentUser.name,
      hostAvatar: currentUser.avatar,
      startTime,
      duration,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      capacity,
      bookedCount: 0,
      posterUrl: `https://picsum.photos/seed/sched-${Date.now()}/1200/600`,
      recurrence,
      recurringDays,
      isPrivate,
      price: price > 0 ? price : undefined,
      currency: 'USD'
    };

    StorageService.saveScheduledEvent(newEvent);
    
    setTimeout(() => {
      onScheduled(newEvent);
      setIsSaving(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-4 animate-in fade-in duration-500">
      <div 
        className="w-full max-w-4xl bg-secondary rounded-[64px] overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/5 bg-secondary shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <div>
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2 italic">Event Setup Panel</h2>
               <p className="text-[10px] text-muted font-bold uppercase tracking-[0.4em]">One-Time & Recurring Series Matrix</p>
             </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Identity & Schedule */}
            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-accent uppercase tracking-widest">Hub Identity</label>
                  <button 
                    onClick={handleAiSpark}
                    disabled={isSparking}
                    className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-4 py-2 rounded-full border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isSparking ? 'Optimizing...' : 'Neural Refine ✨'}
                  </button>
                </div>
                <input 
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="The Masterclass Series..."
                  className="w-full bg-main/50 border-2 border-white/5 focus:border-accent rounded-[32px] p-8 text-2xl font-bold transition-all shadow-sm text-white outline-none"
                />
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contextual Bio..."
                  className="w-full bg-main/50 border-2 border-white/5 focus:border-accent rounded-[40px] p-8 text-lg font-medium min-h-[160px] transition-all outline-none focus:border-accent resize-none text-white shadow-inner"
                />
              </section>

              <section className="grid grid-cols-2 gap-6">
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
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">Start Time</label>
                  <input 
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full bg-main/50 border-2 border-white/5 rounded-[24px] p-6 text-white font-bold transition-all outline-none focus:border-accent"
                  />
                </div>
              </section>
            </div>

            {/* Right Column: Advanced Logic */}
            <div className="space-y-10">
              {/* Recurrence Setup */}
              <section className="space-y-6 bg-white/5 p-10 rounded-[48px] border border-white/5 shadow-2xl">
                 <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Recurrence Matrix
                 </h4>
                 <div className="grid grid-cols-4 gap-2">
                   {['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'].map(type => (
                     <button
                      key={type}
                      onClick={() => setRecurrence(type as any)}
                      className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${recurrence === type ? 'bg-accent border-accent text-white shadow-xl shadow-accent/20' : 'bg-white/5 border-white/10 text-muted hover:border-white/20'}`}
                     >
                       {type}
                     </button>
                   ))}
                 </div>

                 {recurrence === 'WEEKLY' && (
                   <div className="flex justify-between gap-1 animate-in slide-in-from-top-4 duration-300">
                     {DAYS.map((day, i) => (
                       <button
                        key={day}
                        onClick={() => toggleDay(i)}
                        className={`w-10 h-10 rounded-full text-[9px] font-black uppercase transition-all border flex items-center justify-center ${recurringDays.includes(i) ? 'bg-accent border-accent text-white shadow-lg' : 'bg-white/5 border-white/5 text-muted hover:bg-white/10'}`}
                       >
                         {day[0]}
                       </button>
                     ))}
                   </div>
                 )}
              </section>

              {/* Booking & Monetary Protocol */}
              <section className="space-y-6 bg-white/5 p-10 rounded-[48px] border border-white/5 shadow-2xl">
                 <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Booking Protocol
                 </h4>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Max Capacity</label>
                       <input 
                        type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))}
                        className="w-full bg-main border border-white/5 rounded-2xl p-5 text-white font-bold outline-none"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Ticket Value ($)</label>
                       <input 
                        type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value))}
                        placeholder="0.00 (Free)"
                        className="w-full bg-main border border-white/5 rounded-2xl p-5 text-white font-bold outline-none"
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-7 rounded-full relative transition-all duration-500 cursor-pointer ${isPrivate ? 'bg-orange-600' : 'bg-slate-700'}`} onClick={() => setIsPrivate(!isPrivate)}>
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${isPrivate ? 'left-6' : 'left-1'}`} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Private Mesh</p>
                          <p className="text-[8px] text-muted font-bold uppercase tracking-widest">Link-Only Discovery</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Visibility</p>
                       <p className="text-[10px] font-black text-white uppercase">{isPrivate ? 'HIDDEN' : 'PUBLIC'}</p>
                    </div>
                 </div>
              </section>
            </div>
          </div>
        </div>

        <div className="p-10 bg-secondary border-t border-white/5 shrink-0">
          <button 
            onClick={handleSchedule}
            disabled={!title || !date || !time || isSaving}
            className="w-full bg-accent text-white py-8 rounded-[48px] font-black uppercase tracking-[0.4em] text-sm shadow-[0_20px_60px_rgba(24,119,242,0.3)] hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4"
          >
            {isSaving ? (
              <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> COMMITTING ARCHITECTURE...</>
            ) : 'ENGAGE EVENT TIMELINE →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSchedulePanel;
