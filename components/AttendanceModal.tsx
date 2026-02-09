
import React from 'react';
import { StorageService } from '../services/storageService';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, roomId, roomTitle }) => {
  const attendance = StorageService.getAttendance(roomId);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    if (attendance.length === 0) return;
    
    // Create CSV content
    const header = "User ID,User Name,Join Time\n";
    const rows = attendance.map(r => 
      `${r.userId},"${r.userName.replace(/"/g, '""')}",${new Date(r.joinTime).toLocaleString()}`
    ).join("\n");
    
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Chat-Chap_Attendance_${roomTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-secondary rounded-[48px] overflow-hidden shadow-2xl relative border border-white/10 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-secondary shrink-0">
          <div>
            <h2 className="text-xl font-black text-main uppercase tracking-tight text-gradient">Session Registry</h2>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{roomTitle}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-muted hover:text-white transition-all border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {attendance.length === 0 ? (
             <div className="text-center py-20 opacity-30">
               <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
               <p className="text-sm font-black uppercase tracking-widest">Awaiting participants...</p>
             </div>
           ) : (
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-muted uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4">Identity</th>
                    <th className="pb-4">Arrival</th>
                    <th className="pb-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendance.map((record, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="py-5">
                         <div className="flex flex-col">
                            <span className="font-bold text-main text-sm">{record.userName}</span>
                            <span className="text-[9px] text-muted font-mono uppercase tracking-tighter">{record.userId}</span>
                         </div>
                      </td>
                      <td className="py-5 text-muted text-xs font-medium tabular-nums">{new Date(record.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-5 text-right">
                         <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/20">Authenticated</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           )}
        </div>

        <div className="p-8 bg-secondary/50 border-t border-white/5 shrink-0 flex justify-between items-center">
           <p className="text-[9px] text-muted font-black uppercase tracking-widest">Total Presence: {attendance.length}</p>
           <button 
            onClick={handleExportCSV}
            disabled={attendance.length === 0}
            className="bg-accent text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
           >
             Export CSV
           </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
