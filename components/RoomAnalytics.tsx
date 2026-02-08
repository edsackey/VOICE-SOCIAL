
import React, { useMemo } from 'react';
import { StorageService } from '../services/storageService';

interface RoomAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
  speakerStats: Record<string, number>;
}

const RoomAnalytics: React.FC<RoomAnalyticsProps> = ({ isOpen, onClose, roomId, roomTitle, speakerStats }) => {
  const attendance = StorageService.getAttendance(roomId);

  const metrics = useMemo(() => {
    if (attendance.length === 0) return { avgDuration: '0m', total: 0 };
    
    const now = Date.now();
    // Use explicit number subtraction for totalJoinTime calculation
    const totalJoinTime = attendance.reduce((acc, curr) => acc + (now - curr.joinTime), 0);
    const avgMs = totalJoinTime / attendance.length;
    const avgMinutes = Math.floor(avgMs / 60000);
    
    return {
      avgDuration: `${avgMinutes}m`,
      total: attendance.length
    };
  }, [attendance]);

  const topSpeakers = useMemo(() => {
    // Explicitly cast Object.entries output to avoid arithmetic operation errors during sort
    const entries = Object.entries(speakerStats) as Array<[string, number]>;
    return entries
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3);
  }, [speakerStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-end p-4 sm:p-8 pointer-events-none">
      <div 
        className="w-full max-w-sm bg-white/90 backdrop-blur-2xl rounded-[48px] shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-white p-8 pointer-events-auto animate-in slide-in-from-right-8 duration-500"
      >
        <div className="flex justify-between items-center mb-8">
           <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Live Insights</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Real-time Performance</p>
           </div>
           <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="space-y-8">
           {/* Core Metrics */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Reach</p>
                 <p className="text-2xl font-black text-indigo-600">{metrics.total}</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100">
                 <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Avg. Stay</p>
                 <p className="text-2xl font-black text-orange-600">{metrics.avgDuration}</p>
              </div>
           </div>

           {/* Speaker Leaderboard */}
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Most Active Voices</h3>
              <div className="space-y-3">
                 {topSpeakers.length > 0 ? topSpeakers.map(([name, count], i) => (
                   <div key={name} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-gray-300 w-4">0{i+1}</span>
                         <span className="text-xs font-bold text-gray-700">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (Number(count) / (Number(topSpeakers[0][1]) || 1)) * 100)}%` }} />
                         </div>
                         <span className="text-[10px] font-black text-indigo-600">{count}</span>
                      </div>
                   </div>
                 )) : (
                   <p className="text-[10px] text-gray-400 italic text-center py-4 uppercase tracking-widest">Awaiting contributions...</p>
                 )}
              </div>
           </div>

           {/* Trend graph simulation */}
           <div className="bg-gray-900 p-6 rounded-[32px] relative overflow-hidden h-32 flex items-end gap-1">
              <div className="absolute top-4 left-4">
                 <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Audience Retention</p>
              </div>
              {[40, 60, 30, 80, 95, 70, 85, 60, 90, 100].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-indigo-500/30 rounded-t-sm animate-in slide-in-from-bottom duration-1000" 
                  style={{ height: `${h}%`, transitionDelay: `${i * 100}ms` }} 
                />
              ))}
           </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
           <p className="text-[8px] text-gray-300 font-black uppercase tracking-[0.3em]">VOICE SOCIAL Analytics Engine v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default RoomAnalytics;
