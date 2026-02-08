
import React, { useState, useRef } from 'react';
import { generateRoomIdeas, generatePromoContent, generateAdPoster, generateVoiceTeaser } from '../services/geminiService';
import { Room } from '../types';

interface ViralLaunchpadProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (room: Room) => void;
}

type Step = 'concept' | 'studio' | 'teaser' | 'distribute';

const ViralLaunchpad: React.FC<ViralLaunchpadProps> = ({ isOpen, onClose, onLaunch }) => {
  const [step, setStep] = useState<Step>('concept');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [promoKit, setPromoKit] = useState<{ twitter: string; instagram: string; whatsapp: string; linkedin: string } | null>(null);
  const [adImage, setAdImage] = useState<string | null>(null);
  const [voiceTeaser, setVoiceTeaser] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleGoToStudio = async () => {
    setStep('studio');
    setIsAiLoading(true);
    const poster = await generateAdPoster(title, description);
    setAdImage(poster);
    setIsAiLoading(false);
  };

  const handleGenerateTeaser = async () => {
    setStep('teaser');
    setIsAiLoading(true);
    const [promo, teaser] = await Promise.all([
      generatePromoContent({ title, description }),
      generateVoiceTeaser(title, description)
    ]);
    setPromoKit(promo);
    setVoiceTeaser(teaser);
    setIsAiLoading(false);
  };

  const playTeaser = () => {
    if (voiceTeaser && audioRef.current) {
      audioRef.current.play();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleFinalLaunch = () => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      title,
      description,
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
    <div className="fixed inset-0 z-[300] bg-indigo-950/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-500">
      <div className="w-full max-w-5xl bg-[#f7f3e9] rounded-[64px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col h-[90vh] border border-white/10">
        
        {/* Navigation / Progress */}
        <div className="bg-white p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-600 text-white p-4 rounded-[24px] shadow-2xl shadow-indigo-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">Viral Launchpad</h2>
              <div className="flex items-center gap-3">
                {(['concept', 'studio', 'teaser', 'distribute'] as Step[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className={`h-2 rounded-full transition-all duration-700 ${step === s ? 'w-10 bg-indigo-600' : 'w-4 bg-gray-200'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {step === 'concept' && (
            <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500">
              <div className="text-center">
                 <h3 className="text-5xl font-black text-gray-900 tracking-tight mb-6">Drop a Topic</h3>
                 <p className="text-xl text-gray-500 font-medium">What's the world talking about today? We'll help you refine the hook for Voice Room Live.</p>
              </div>

              <div className="space-y-8">
                <div className="relative">
                  <label className="absolute -top-3 left-8 bg-white px-3 text-xs font-black text-indigo-600 uppercase tracking-[0.2em] z-10">Room Title</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., The Future of Social Commerce"
                      className="flex-1 bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-[32px] p-8 text-2xl font-bold transition-all shadow-sm"
                    />
                    <button 
                      onClick={handleAiSpark}
                      disabled={isAiLoading || !title}
                      className="bg-indigo-600 text-white px-10 rounded-[32px] font-black uppercase text-sm tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAiLoading ? 'Refining...' : 'AI SPARK'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                   <label className="absolute -top-3 left-8 bg-white px-3 text-xs font-black text-indigo-600 uppercase tracking-[0.2em] z-10">Description</label>
                   <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Briefly describe the discussion context..."
                    className="w-full bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-[48px] p-10 text-xl font-medium min-h-[200px] transition-all shadow-sm resize-none"
                   />
                </div>
              </div>

              <button 
                onClick={handleGoToStudio}
                disabled={!title || !description}
                className="w-full bg-gray-900 text-white py-10 rounded-[48px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-20"
              >
                Enter Creative Studio →
              </button>
            </div>
          )}

          {step === 'studio' && (
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-12 animate-in slide-in-from-right-8 duration-500">
               <div className="text-center">
                  <h3 className="text-5xl font-black text-gray-900 tracking-tight mb-4">Branding Your Moment</h3>
                  <p className="text-xl text-gray-500 font-medium">Generating a unique promotional visual using Gemini for Voice Room Live.</p>
               </div>

               <div className="w-full max-w-lg aspect-square bg-white rounded-[72px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-8 border-white overflow-hidden relative group">
                  {isAiLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-6">
                       <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                       <p className="text-sm font-black text-gray-400 uppercase tracking-[0.4em] animate-pulse">Rendering Poster...</p>
                    </div>
                  ) : adImage ? (
                    <>
                      <img src={adImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" alt="AI Poster" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                         <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = adImage;
                            link.download = 'voiceroomlive-viral.png';
                            link.click();
                          }}
                          className="bg-white text-gray-900 px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                         >
                           Save Visual
                         </button>
                      </div>
                    </>
                  ) : null}
               </div>

               <button 
                onClick={handleGenerateTeaser}
                className="w-full max-w-xl bg-indigo-600 text-white py-10 rounded-[48px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
               >
                 Create Audio Teaser →
               </button>
            </div>
          )}

          {step === 'teaser' && (
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-12 animate-in slide-in-from-right-8 duration-500">
               <div className="text-center">
                  <h3 className="text-5xl font-black text-gray-900 tracking-tight mb-4">Voice of Invitation</h3>
                  <p className="text-xl text-gray-500 font-medium">Our AI is drafting a high-energy audio clip to post on your stories.</p>
               </div>

               <div className="w-full bg-white p-12 rounded-[64px] shadow-2xl border border-gray-100 flex flex-col items-center gap-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  
                  <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-600">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>

                  <div className="text-center space-y-2">
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Preview Teaser</p>
                     <p className="text-lg font-bold text-gray-800 italic">"Hey everyone! I'm live on VOICE ROOM LIVE talking about {title}..."</p>
                  </div>

                  {voiceTeaser && (
                    <audio 
                      ref={audioRef}
                      src={`data:audio/mp3;base64,${voiceTeaser}`} 
                      className="hidden"
                    />
                  )}

                  <button 
                    onClick={playTeaser}
                    disabled={isAiLoading || !voiceTeaser}
                    className="group bg-indigo-600 text-white p-10 rounded-full shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                  >
                    <svg className="w-10 h-10 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </button>

                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">AI Character: Puck (Energetic)</p>
               </div>

               <button 
                onClick={() => setStep('distribute')}
                className="w-full max-w-xl bg-gray-900 text-white py-10 rounded-[48px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl hover:bg-black transition-all active:scale-95"
               >
                 Go To Launchpad →
               </button>
            </div>
          )}

          {step === 'distribute' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500">
               <div className="text-center">
                  <h3 className="text-5xl font-black text-gray-900 tracking-tight mb-4">The Viral Kit</h3>
                  <p className="text-xl text-gray-500 font-medium">Your room is engineered for growth. Deploy to all channels.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[56px] shadow-2xl border border-gray-50 space-y-8">
                     <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-8 h-0.5 bg-indigo-600" /> Platform Deployment
                     </h4>
                     
                     <div className="space-y-6">
                        {[
                          { id: 'twitter', icon: '🐦', name: 'X (Twitter)', content: promoKit?.twitter },
                          { id: 'instagram', icon: '📸', name: 'Instagram', content: promoKit?.instagram },
                          { id: 'whatsapp', icon: '💬', name: 'WhatsApp', content: promoKit?.whatsapp },
                        ].map(platform => (
                          <div key={platform.id} className="group p-6 rounded-[32px] bg-gray-50 border border-gray-100 hover:bg-white hover:border-indigo-100 transition-all">
                             <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                   <span className="text-2xl">{platform.icon}</span>
                                   <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{platform.name}</span>
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(platform.content || '')}
                                  className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Copy Text
                                </button>
                             </div>
                             <p className="text-sm font-medium text-gray-500 italic leading-relaxed line-clamp-2 group-hover:line-clamp-none">"{platform.content}"</p>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col gap-10">
                     <div className="flex-1 bg-indigo-600 p-10 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-[2000ms]" />
                        <div className="relative z-10 flex flex-col h-full justify-between">
                           <div>
                              <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-4 text-indigo-200">Public Deep Link</h4>
                              <p className="text-2xl font-black mb-2">voiceroomlive.app/launch-{Date.now().toString().slice(-6)}</p>
                              <p className="text-sm font-medium text-indigo-100 opacity-60 italic">This link auto-opens the app for your listeners.</p>
                           </div>
                           <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest self-start mt-6 shadow-xl hover:scale-105 active:scale-95 transition-all">
                              Copy Link
                           </button>
                        </div>
                     </div>

                     <button 
                      onClick={handleFinalLaunch}
                      className="w-full bg-green-600 text-white py-12 rounded-[56px] font-black uppercase tracking-[0.4em] text-xl shadow-2xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all"
                     >
                       Launch Live Room
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white p-8 border-t border-gray-100 flex justify-between items-center shrink-0">
           {step !== 'concept' ? (
             <button onClick={() => setStep(step === 'studio' ? 'concept' : step === 'teaser' ? 'studio' : 'teaser')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
               ← Step Back
             </button>
           ) : <div />}
           <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">VOICE ROOM LIVE Engine v1.2</div>
        </div>
      </div>
    </div>
  );
};

export default ViralLaunchpad;
