
import React, { useState } from 'react';
import { generateRoomIdeas, generatePromoContent } from '../services/geminiService';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (room: any) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSparking, setIsSparking] = useState(false);
  const [promoContent, setPromoContent] = useState<{ twitter: string; instagram: string; whatsapp: string } | null>(null);
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);

  if (!isOpen) return null;

  const handleAiSpark = async () => {
    if (!title) {
      alert("Please enter a basic topic in the title field first!");
      return;
    }
    setIsSparking(true);
    const ideas = await generateRoomIdeas(title);
    setTitle(ideas.title);
    setDescription(ideas.description);
    setTags(ideas.tags.join(', '));
    setIsSparking(false);
  };

  const handleGeneratePromo = async () => {
    if (!title || !description) return;
    setIsGeneratingPromo(true);
    const promo = await generatePromoContent({ title, description });
    setPromoContent(promo);
    setIsGeneratingPromo(false);
  };

  const handleCreate = () => {
    onCreate({
      id: `room-${Date.now()}`,
      title,
      description,
      tags: tags.split(',').map(t => t.trim()),
      participantCount: 1,
      speakers: [],
      listeners: [],
      sentiment: 'neutral'
    });
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl bg-[#f7f3e9] rounded-[56px] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-100">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
             </div>
             <div>
               <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Launch a Room</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Broadcast your voice to the world</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Main Form */}
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Room Title or Topic</label>
                <button 
                  onClick={handleAiSpark}
                  disabled={isSparking}
                  className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSparking ? 'Sparking...' : <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg> AI SPARK</>}
                </button>
              </div>
              <input 
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What are we talking about?"
                className="w-full bg-white border-2 border-transparent focus:border-green-100 rounded-3xl p-5 text-gray-800 font-bold focus:ring-8 focus:ring-green-50/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Share more details about the discussion..."
                className="w-full bg-white border-2 border-transparent focus:border-green-100 rounded-[32px] p-6 text-sm font-medium min-h-[100px] focus:ring-8 focus:ring-green-50/30 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tags (comma separated)</label>
              <input 
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Tech, AI, Future, etc."
                className="w-full bg-white border-2 border-transparent focus:border-green-100 rounded-full px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-8 focus:ring-green-50/30 transition-all"
              />
            </div>
          </section>

          {/* Promotion / Advertise Section */}
          <section className="bg-indigo-600 rounded-[48px] p-8 text-white shadow-2xl shadow-indigo-100/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                 <h3 className="text-sm font-black uppercase tracking-widest">Global Outreach</h3>
              </div>
              <p className="text-xs opacity-80 mb-6 font-medium">Advertise your room beyond EchoHub with AI-generated social media campaigns.</p>
              
              {!promoContent ? (
                <button 
                  onClick={handleGeneratePromo}
                  disabled={isGeneratingPromo || !title}
                  className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingPromo ? 'PREPARING CAMPAIGN...' : 'GENERATE AD CAMPAIGN'}
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {[
                    { label: 'X (Twitter)', icon: '🐦', content: promoContent.twitter },
                    { label: 'Instagram', icon: '📸', content: promoContent.instagram },
                    { label: 'WhatsApp', icon: '💬', content: promoContent.whatsapp },
                  ].map(platform => (
                    <div key={platform.label} className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 group/item">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200 flex items-center gap-2">
                           <span className="text-lg">{platform.icon}</span> {platform.label}
                         </span>
                         <button 
                           onClick={() => copyToClipboard(platform.content)}
                           className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full hover:bg-white/40 transition-all opacity-0 group-hover/item:opacity-100"
                         >
                           Copy
                         </button>
                       </div>
                       <p className="text-[11px] font-medium leading-relaxed italic">"{platform.content}"</p>
                    </div>
                  ))}
                  <button 
                    onClick={() => setPromoContent(null)}
                    className="text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-colors block mx-auto pt-2"
                  >
                    Clear Campaign
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-8 bg-white border-t border-gray-100 shrink-0">
          <button 
            onClick={handleCreate}
            disabled={!title || !description}
            className="w-full bg-green-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            Launch Room Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
