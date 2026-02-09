import React, { useState } from 'react';
import { generateRoomIdeas, generatePromoContent, generateAdPoster } from '../services/geminiService';
import { Room, UserRole } from '../types';

interface RoomPromotionHubProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (room: Room) => void;
}

type Step = 'details' | 'marketing' | 'launch';

const RoomPromotionHub: React.FC<RoomPromotionHubProps> = ({ isOpen, onClose, onLaunch }) => {
  const [step, setStep] = useState<Step>('details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [promoKit, setPromoKit] = useState<{ twitter: string; instagram: string; whatsapp: string; linkedin: string } | null>(null);
  const [adImage, setAdImage] = useState<string | null>(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);

  if (!isOpen) return null;

  const handleAiSpark = async () => {
    if (!title) return;
    setIsAiLoading(true);
    const ideas = await generateRoomIdeas(title);
    setTitle(ideas.title);
    setDescription(ideas.description);
    setTags(ideas.tags.join(', '));
    setIsAiLoading(false);
  };

  const handleNextToMarketing = async () => {
    setStep('marketing');
    setIsAiLoading(true);
    const [promo, poster] = await Promise.all([
      generatePromoContent({ title, description }),
      generateAdPoster(title, description)
    ]);
    setPromoKit(promo);
    setAdImage(poster);
    setIsAiLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleFinalLaunch = () => {
    // Fix: Added missing required properties 'followerCount' and 'followers' for Room interface
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      title,
      description,
      followerCount: 0,
      followers: [],
      tags: tags.split(',').map(t => t.trim()),
      participantCount: 1,
      sentiment: 'neutral',
      speakers: [],
      listeners: []
    };
    onLaunch(newRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-indigo-950/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-[#f7f3e9] rounded-[64px] overflow-hidden shadow-2xl flex flex-col h-[90vh] border border-white/20">
        
        {/* Header with Progress */}
        <div className="bg-white p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-600 text-white p-4 rounded-[20px] shadow-xl shadow-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Room Launchpad</h2>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 rounded-full transition-all duration-500 ${step === 'details' ? 'w-8 bg-indigo-600' : 'w-4 bg-gray-200'}`} />
                <span className={`h-1.5 rounded-full transition-all duration-500 ${step === 'marketing' ? 'w-8 bg-indigo-600' : 'w-4 bg-gray-200'}`} />
                <span className={`h-1.5 rounded-full transition-all duration-500 ${step === 'launch' ? 'w-8 bg-indigo-600' : 'w-4 bg-gray-200'}`} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {step === 'details' && (
            <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-500">
              <div className="text-center mb-12">
                 <h3 className="text-4xl font-black text-gray-900 tracking-tight mb-4">What's the big idea?</h3>
                 <p className="text-gray-500 font-medium">Start with a seed, and let our AI help you grow it into a global conversation.</p>
              </div>

              <div className="space-y-8">
                <div className="relative group">
                  <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest z-10">Room Topic</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., The Future of Remote Work in Ghana"
                      className="flex-1 bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-[32px] p-6 text-xl font-bold transition-all shadow-sm"
                    />
                    <button 
                      onClick={handleAiSpark}
                      disabled={isAiLoading || !title}
                      className="bg-indigo-600 text-white px-8 rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAiLoading ? 'Thinking...' : 'AI SPARK'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                   <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest z-10">Creative Context</label>
                   <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what will happen in the room..."
                    className="w-full bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-[40px] p-8 text-lg font-medium min-h-[180px] transition-all shadow-sm resize-none"
                   />
                </div>

                <div className="relative">
                   <label className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest z-10">Search Tags</label>
                   <input 
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="Tech, Career, Networking"
                    className="w-full bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all shadow-sm"
                   />
                </div>
              </div>

              <div className="pt-10">
                 <button 
                  onClick={handleNextToMarketing}
                  disabled={!title || !description}
                  className="w-full bg-gray-900 text-white py-8 rounded-[40px] font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-30"
                 >
                   Engineer My Campaign →
                 </button>
              </div>
            </div>
          )}

          {step === 'marketing' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500">
               <div className="flex flex-col md:flex-row gap-10">
                  {/* Left: AI Generated Ad Poster */}
                  <div className="w-full md:w-[400px] shrink-0">
                     <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                       <span className="w-8 h-[2px] bg-indigo-500" /> Promotional Visual
                     </h4>
                     <div className="aspect-square bg-white rounded-[56px] shadow-2xl border-4 border-white overflow-hidden relative group">
                        {isAiLoading ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-4">
                             <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Designing Poster...</p>
                          </div>
                        ) : adImage ? (
                          <>
                            <img src={adImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Generated Ad" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                               <button 
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = adImage;
                                  link.download = 'echohub-promo.png';
                                  link.click();
                                }}
                                className="bg-white text-gray-900 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                               >
                                 Download Poster
                               </button>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                             <svg className="w-16 h-16 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                     </div>
                     <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed text-center px-6">
                       Post this visual on Instagram, LinkedIn or Twitter to announce your room launch.
                     </p>
                  </div>

                  {/* Right: Platform Specific Copy */}
                  <div className="flex-1 space-y-8">
                     <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                       <span className="w-8 h-[2px] bg-indigo-500" /> Social Media Kit
                     </h4>
                     
                     <div className="grid grid-cols-1 gap-6">
                        {[
                          { id: 'twitter', icon: '🐦', label: 'X (Twitter)', content: promoKit?.twitter },
                          { id: 'linkedin', icon: '💼', label: 'LinkedIn', content: promoKit?.linkedin },
                          { id: 'whatsapp', icon: '💬', label: 'WhatsApp', content: promoKit?.whatsapp },
                          { id: 'instagram', icon: '📸', label: 'Instagram Caption', content: promoKit?.instagram },
                        ].map(platform => (
                          <div key={platform.id} className="bg-white p-6 rounded-[36px] border border-gray-100 shadow-sm group/item">
                             <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                   <span className="text-xl">{platform.icon}</span>
                                   <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{platform.label}</span>
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(platform.content || '')}
                                  className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all opacity-0 group-hover/item:opacity-100"
                                >
                                  Copy Text
                                </button>
                             </div>
                             <p className="text-xs font-medium text-gray-500 italic line-clamp-2 group-hover/item:line-clamp-none transition-all">
                               {isAiLoading ? '... generating optimized copy ...' : `"${platform.content}"`}
                             </p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="bg-indigo-600 p-10 rounded-[48px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-1000" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                     <div className="max-w-xl">
                        <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Launch Distribution</h3>
                        <p className="text-indigo-100 font-medium leading-relaxed">Your room is configured and your marketing kit is ready. Launching will notify your followers and activate the global link.</p>
                     </div>
                     <button 
                      onClick={() => setStep('launch')}
                      className="bg-white text-indigo-600 px-12 py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                     >
                       Proceed to Launch
                     </button>
                  </div>
               </div>
            </div>
          )}

          {step === 'launch' && (
            <div className="max-w-2xl mx-auto py-20 flex flex-col items-center text-center space-y-12 animate-in zoom-in-95 duration-500">
               <div className="w-32 h-32 bg-green-500 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-green-100 relative">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  <div className="absolute inset-0 bg-green-500 rounded-[40px] animate-ping opacity-20" />
               </div>
               
               <div>
                  <h3 className="text-5xl font-black text-gray-900 tracking-tight mb-4">Ignition Sequence Complete</h3>
                  <p className="text-xl text-gray-500 font-medium">Your room "{title}" is ready for the world. You've prepared the visuals and the copy—now provide the voice.</p>
               </div>

               <div className="w-full bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                     <div className="text-left">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Public Web URL</p>
                        <p className="text-sm font-bold text-indigo-600">echohub.app/rooms/launch-{Date.now().toString().slice(-6)}</p>
                     </div>
                     <button className="text-[10px] font-black text-gray-900 uppercase underline">Preview Page</button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                     <div className="text-left">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Sentiment</p>
                        <p className="text-sm font-bold text-gray-900">High Interest Potential (AI Data)</p>
                     </div>
                     <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-4 h-1.5 bg-green-500 rounded-full" />)}
                     </div>
                  </div>
               </div>

               <button 
                onClick={handleFinalLaunch}
                className="w-full bg-green-600 text-white py-8 rounded-[40px] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all"
               >
                 Launch Live Room Now
               </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-white p-8 border-t border-gray-50 flex justify-between items-center shrink-0">
           {step !== 'details' ? (
             <button onClick={() => setStep(step === 'marketing' ? 'details' : 'marketing')} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
               ← Go Back
             </button>
           ) : <div />}
           
           <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">EchoHub Creator Studio</p>
        </div>
      </div>
    </div>
  );
};

export default RoomPromotionHub;