
import React, { useEffect, useState } from 'react';
import { EchoNotification } from '../types';

interface NotificationToastProps {
  notification: EchoNotification | null;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500); // Allow animation to finish
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const icons = {
    ROOM_START: '🎙️',
    EVENT_NEW: '📅',
    DIRECT_MESSAGE: '💬',
    FOLLOW: '👤',
    SYSTEM: '⚙️'
  };

  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4 transition-all duration-500 pointer-events-none ${visible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
       <div className="bg-secondary/90 backdrop-blur-xl border border-white/10 p-4 rounded-[32px] shadow-2xl flex items-center gap-4 pointer-events-auto cursor-pointer hover:bg-secondary transition-colors group">
          <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
             {notification.senderAvatar ? (
               <img src={notification.senderAvatar} className="w-full h-full object-cover rounded-2xl" alt="" />
             ) : (
               <span>{icons[notification.type] || '🔔'}</span>
             )}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-0.5">{notification.title}</p>
             <p className="text-xs font-bold text-main truncate leading-tight">{notification.message}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setVisible(false); }} className="p-2 text-muted hover:text-white">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
       </div>
    </div>
  );
};

export default NotificationToast;
