
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types';
import { StorageService } from '../services/storageService';

interface ChatPanelProps {
  roomId: string;
  currentUser: User;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ roomId, currentUser, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = StorageService.subscribeToRoomChat(roomId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msg: Omit<ChatMessage, 'id'> = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: inputText.trim(),
      timestamp: Date.now()
    };

    setInputText('');
    await StorageService.sendChatMessage(roomId, msg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:static sm:inset-auto z-[300] sm:z-10 w-full sm:w-[400px] flex flex-col bg-secondary/95 backdrop-blur-3xl border-l border-white/5 shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden sm:h-full h-[85vh] sm:rounded-none rounded-t-[50px] bottom-0">
      {/* Chat Header */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-secondary/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L5 21V5a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3z" /></svg>
          </div>
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-main italic">Neural Chat</h3>
        </div>
        <button onClick={onToggle} className="p-2 text-muted hover:text-white transition-all sm:hidden">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-main/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10 opacity-30">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Transmission</p>
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 animate-in fade-in duration-300 ${msg.senderId === currentUser.id ? 'flex-row-reverse' : ''}`}>
             <img src={msg.senderAvatar} className="w-9 h-9 rounded-2xl border-2 border-white/5 object-cover shrink-0 shadow-lg" alt="" />
             <div className={`max-w-[75%] space-y-1.5 ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center gap-2 px-1">
                   <span className="text-[9px] font-black text-muted uppercase tracking-tighter truncate max-w-[100px]">{msg.senderName}</span>
                   <span className="text-[8px] font-bold text-muted/40 tabular-nums">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`p-4 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm ring-1 ring-black/5 ${msg.senderId === currentUser.id ? 'bg-accent text-white rounded-tr-none' : 'bg-secondary text-main rounded-tl-none'}`}>
                   {msg.text}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-6 bg-secondary shrink-0 border-t border-white/5">
        <div className="relative group">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your echo..."
            className="w-full bg-main border border-white/10 rounded-[28px] py-4 pl-6 pr-14 text-sm font-bold text-white placeholder:text-muted outline-none focus:border-accent transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-2 p-3 bg-accent text-white rounded-full shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:hover:scale-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
