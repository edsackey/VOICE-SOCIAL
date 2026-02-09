
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
    const header = "User ID,User Name,Join Time\n";
    const rows = attendance.map(r => 
      `${r.userId},"${r.userName.replace(/"/g, '""')}",${new Date(r.joinTime).toLocaleString()}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${roomTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#f7f3e9] rounded-[48px] overflow-hidden shadow-2xl relative border border-white/20 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Attendance Record</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{roomTitle}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {attendance.length === 0 ? (
             <div className="text-center py-20 opacity-30">
               <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
               <p className="text-sm font-black uppercase tracking-widest">No attendance data captured yet</p>
             </div>
           ) : (
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="pb-4">Participant</th>
                    <th className="pb-4">Join Time</th>
                    <th className="pb-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendance.map((record, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-5 font-bold text-gray-800 text-sm">{record.userName}</td>
                      <td className="py-5 text-gray-500 text-xs font-medium">{new Date(record.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-5 text-right">
                         <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           )}
        </div>

        <div className="p-8 bg-white border-t border-gray-100 shrink-0 flex justify-between items-center">
           <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest">Total Participants: {attendance.length}</p>
           <button 
            onClick={handleExportCSV}
            disabled={attendance.length === 0}
            className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline disabled:opacity-30 disabled:no-underline"
           >
             Export CSV
           </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
