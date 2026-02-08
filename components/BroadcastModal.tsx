
import React, { useState } from 'react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  participants: { name: string; id: string }[];
  onShowToast: (msg: string) => void;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, roomTitle, participants, onShowToast }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleInAppBroadcast = () => {
    if (!message.trim()) return;
    setIsSending(true);
    // Simulate in-app notification to all member IDs
    setTimeout(() => {
      setIsSending(false);
      onShowToast(`In-app broadcast sent to ${participants.length} members!`);
      setMessage('');
      onClose();
    }, 1200);
  };

  const handleWhatsAppBroadcast = () => {
    if (!message.trim()) return;
    const text = `*Message from ${roomTitle} Stage:* \n\n${message}\n\n_Sent via EchoHub_`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onShowToast("WhatsApp share initiated!");
  };

  return (
    <div className="fixed inset-0 z-[600] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#f7f3e9] rounded-[56px] overflow-hidden shadow-2xl relative border border-white/20 p-10 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-8">
           <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
           </div>
           <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Mass Broadcast</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Message all {participants.length} room members</p>
           </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Your Broadcast Message</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What do you want to say to everyone?"
                className="w-full bg-white border-2 border-transparent focus:border-indigo-100 rounded-[40px] p-8 text-lg font-medium shadow-sm outline-none transition-all resize-none h-48"
              />
           </div>

           <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleInAppBroadcast}
                disabled={isSending || !message.trim()}
                className="flex-1 bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
              >
                {isSending ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : 'In-App Inbox'}
              </button>

              <button 
                onClick={handleWhatsAppBroadcast}
                disabled={!message.trim()}
                className="flex-1 bg-green-500 text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-100 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
              >
                <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" className="w-5 h-5 invert" alt="" />
                WhatsApp Group
              </button>
           </div>

           <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest px-10">
              Note: Broadcasts are visible to all current members of the room and stored in their personal EchoHub vault.
           </p>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
