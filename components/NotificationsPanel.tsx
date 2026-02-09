
import React from 'react';
import { EchoNotification } from '../types';
import { StorageService } from '../services/storageService';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EchoNotification[];
  onRefresh: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, notifications, onRefresh }) => {
  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    StorageService.markAsRead(id);
    onRefresh();
  };

  const handleMarkAllRead = () => {
    StorageService.markAllAsRead();
    onRefresh();
  };

  const handleClear = () => {
    StorageService.clearNotifications();
    onRefresh();
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const icons = {
    ROOM_START: '🎙️',
    EVENT_NEW: '📅',
    DIRECT_MESSAGE: '💬',
    FOLLOW: '👤',
    SYSTEM: '⚙️'
  };

  return (
    <div className="fixed inset-0 z-[800] bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-secondary h-full shadow-2xl border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-500"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-secondary/80 backdrop-blur-md sticky top-0 z-10">
           <div>
              <h2 className="text-2xl font-black text-main uppercase tracking-tighter">In-Box Hub</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Real-time alerts & activity</p>
           </div>
           <button onClick={onClose} className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
           {notifications.length > 0 && (
             <div className="flex justify-between items-center px-4 mb-2">
                <button onClick={handleMarkAllRead} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Mark all read</button>
                <button onClick={handleClear} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline">Clear all</button>
             </div>
           )}

           {notifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl">📭</div>
                <p className="text-sm font-black uppercase tracking-widest">No activity yet</p>
             </div>
           ) : (
             notifications.map(notif => (
               <div 
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className={`p-6 rounded-[32px] border transition-all cursor-pointer group relative overflow-hidden ${notif.isRead ? 'bg-main/30 border-white/5 opacity-60' : 'bg-main border-accent/20 shadow-lg shadow-accent/5'}`}
               >
                 {!notif.isRead && (
                   <div className="absolute top-6 left-0 w-1.5 h-10 bg-accent rounded-r-full" />
                 )}
                 <div className="flex gap-5">
                    <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                       {notif.senderAvatar ? (
                         <img src={notif.senderAvatar} className="w-full h-full object-cover rounded-2xl" alt="" />
                       ) : (
                         <span>{icons[notif.type] || '🔔'}</span>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-black uppercase tracking-tight group-hover:text-accent transition-colors ${notif.isRead ? 'text-muted' : 'text-main'}`}>{notif.title}</h4>
                          <span className="text-[9px] font-black text-muted uppercase tracking-tighter tabular-nums">{getTimeAgo(notif.timestamp)}</span>
                       </div>
                       <p className={`text-xs font-medium leading-relaxed line-clamp-3 ${notif.isRead ? 'text-muted/60' : 'text-main/80'}`}>{notif.message}</p>
                    </div>
                 </div>
               </div>
             ))
           )}
        </div>

        <div className="p-8 bg-secondary border-t border-white/5 text-center shrink-0">
           <p className="text-[8px] text-muted font-black uppercase tracking-[0.5em]">Global Alert Network • EchoHub Security</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
