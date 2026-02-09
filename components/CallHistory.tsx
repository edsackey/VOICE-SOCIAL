
import React from 'react';
import { CallRecord } from '../types';

interface CallHistoryProps {
  history: CallRecord[];
  onClose: () => void;
  currentUserId: string;
}

const CallHistory: React.FC<CallHistoryProps> = ({ history, onClose, currentUserId }) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-secondary rounded-[48px] overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/5 bg-secondary shrink-0 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent shadow-lg shadow-accent/10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-main uppercase tracking-tight leading-none">Connection Log</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Personal Call History</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-muted hover:text-white transition-all border border-white/5">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
           {history.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center space-y-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <p className="text-sm font-black uppercase tracking-widest text-muted">No calls recorded yet</p>
             </div>
           ) : (
             <div className="space-y-4">
                {history.map(record => {
                  const remoteParticipant = record.participants.find(p => p.id !== currentUserId) || record.participants[0];
                  return (
                    <div key={record.id} className="bg-main/30 p-5 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-accent/30 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 squircle overflow-hidden border-2 border-white/5 bg-slate-800">
                             <img src={remoteParticipant.avatar} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-main uppercase tracking-tight">{remoteParticipant.name}</h4>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${record.type === 'video' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">{record.type} • {formatDuration(record.duration)}</p>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-muted font-black uppercase tracking-tighter tabular-nums mb-1">{formatDate(record.startTime)}</p>
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-2 bg-accent/10 rounded-xl text-accent hover:bg-accent hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                             </button>
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>

        <div className="p-8 bg-secondary border-t border-white/5 text-center shrink-0">
           <p className="text-[8px] text-muted font-black uppercase tracking-[0.5em]">EchoHub Communications Ledger</p>
        </div>
      </div>
    </div>
  );
};

export default CallHistory;
