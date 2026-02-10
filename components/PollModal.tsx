
import React, { useState } from 'react';
import { Poll } from '../types';

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (poll: Poll) => void;
  creatorId: string;
}

const PollModal: React.FC<PollModalProps> = ({ isOpen, onClose, onCreate, creatorId }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    if (!question.trim() || options.some(opt => !opt.trim())) return;

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: question.trim(),
      options: options.map((opt, i) => ({
        id: `opt-${i}`,
        text: opt.trim(),
        votes: 0
      })),
      totalVotes: 0,
      isActive: true,
      creatorId
    };

    onCreate(poll);
  };

  return (
    <div className="fixed inset-0 z-[700] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-secondary rounded-[56px] overflow-hidden shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-secondary shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent/20">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </div>
             <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Create Pulse Poll</h2>
               <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Engage your audience in real-time</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-muted hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 space-y-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-2">Question</label>
              <input 
                autoFocus
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-main border border-white/5 rounded-[24px] p-6 text-white font-bold shadow-sm focus:ring-4 focus:ring-accent/10 outline-none transition-all"
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                 <label className="text-[10px] font-black text-accent uppercase tracking-widest">Options</label>
                 {options.length < 4 && (
                   <button onClick={handleAddOption} className="text-[9px] font-black text-accent uppercase tracking-widest hover:underline">+ Add Choice</button>
                 )}
              </div>
              <div className="space-y-3">
                 {options.map((opt, i) => (
                   <div key={i} className="flex gap-3">
                      <input 
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-main border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-accent/30 transition-all"
                      />
                      {options.length > 2 && (
                        <button onClick={() => handleRemoveOption(i)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                   </div>
                 ))}
              </div>
           </div>

           <button 
            onClick={handleCreate}
            disabled={!question.trim() || options.some(opt => !opt.trim())}
            className="w-full bg-accent text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-accent/20 hover:bg-accent/80 active:scale-95 transition-all disabled:opacity-30"
           >
             Launch Live Poll
           </button>
        </div>
      </div>
    </div>
  );
};

export default PollModal;
