
import React, { useState, useRef } from 'react';
import { generateRoomIdeas, generatePromoContent, generateAdPoster, generateVoiceTeaser } from '../services/geminiService';
import { Room, User, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface ViralLaunchpadProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (room: Room) => void;
  currentUser: User;
}

type Step = 'concept' | 'studio' | 'teaser' | 'distribute';

const ViralLaunchpad: React.FC<ViralLaunchpadProps> = ({ isOpen, onClose, onLaunch, currentUser }) => {
  const [step, setStep] = useState<Step>('concept');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [sentiment, setSentiment] = useState<Room['sentiment']>('neutral');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [promoKit, setPromoKit] = useState<{ twitter: string; instagram: string; whatsapp: string; linkedin: string } | null>(null);
  const [adImage, setAdImage] = useState<string | null>(null);
  const [voiceTeaser, setVoiceTeaser] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleAiSpark = async () => {
    if (!title) return;
    setIsAiLoading(true);
    try {
      const ideas = await generateRoomIdeas(title);
      setTitle(ideas.title);
      setDescription(ideas.description);
      setTags(ideas.tags.join(', '));
      setSentiment(ideas.sentiment || 'neutral');
    } catch (e) {
      console.error("AI Spark Failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGoToStudio = async () => {
    setStep('studio');
    setIsAiLoading(true);
    try {
      const poster = await generateAdPoster(title, description);
      setAdImage(poster);
    } catch (e) {
      console.error("Studio design failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateTeaser = async () => {
    setStep('teaser');
    setIsAiLoading(true);
    try {
      const [promo, teaser] = await Promise.all([
        generatePromoContent({ title, description }),
        generateVoiceTeaser(title, description)
      ]);
      setPromoKit(promo);
      setVoiceTeaser(teaser);
    } catch (e) {
      console.error("Marketing generation failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const playTeaser = () => {
    if (voiceTeaser && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Payload copied to clipboard!");
  };

  const handleFinalLaunch = async () => {
    if (isLaunching) return;
    setIsLaunching(true);

    try {
      const roomBlueprint: Omit<Room, 'id'> = {
        title,
        description,
        followerCount: 0,
        followers: [],
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        participantCount: 1,
        sentiment: sentiment,
        isLive: true,
        startTime: Date.now(),
        speakers: [{
          ...currentUser,
          role: UserRole.HOST,
          isMuted: false,
          handRaised: false
        }],
        listeners: [],
        posterUrl: adImage || `https://picsum.photos/seed/${Date.now()}/800/800`
      };

      // CRITICAL: Speed up the user journey by launching as soon as Firebase responds
      const roomId = await StorageService.createRoomFirebase(roomBlueprint);
      
      // Secondary tasks run after navigation or in background
      StorageService.saveNotification({
        id: `room-notif-${Date.now()}`,
        type: 'ROOM_START',
        title: 'Hub Online',
        message: `${currentUser.name} is broadcasting: "${title}"`,
        timestamp: Date.now(),
        isRead: false,
        senderAvatar: currentUser.avatar
      });

      // Move user to the Live Stage immediately
      onLaunch({ ...roomBlueprint, id: roomId });
      onClose();
    } catch (error) {
      console.error("Launch sequence failure:", error);
      alert("Hub Ignition Delayed. Please verify your connection.");
      setIsLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-main/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-500">
      <div className="w-full max-w-5xl bg-secondary rounded-[48px] overflow-hidden shadow-2xl flex flex-col h-[90vh] border border-white/10">
        
        <div className="bg-secondary p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="bg-accent text-white p-4 rounded-[20px] shadow-2xl shadow-accent/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-main uppercase tracking-tight mb-2">Viral Ignition</h2>
              <div className="flex items-center gap-2.5">
                {(['concept', 'studio', 'teaser', 'distribute'] as Step[]).map((s) => (
                  <span key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-accent' : 'w-3 bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-main/30 rounded-full text-muted hover:text-main transition-all border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {step === 'concept' && (
            <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500">
              <div className="text-center">
                 <h3 className="text-5xl font-black text-main tracking-tight mb-6 italic uppercase">Blueprint</h3>
                 <p className="text-xl text-muted font-medium">Define your conversation. EchoHub AI will optimize the data layer.</p>
              </div>

              <div className="space-y-8">
                <div className="relative">
                  <label className="absolute -top-2.5 left-8 bg-secondary px-2.5 text-[10px] font-black text-accent uppercase tracking-[0.2em] z-10">Room Title</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Input seed topic..."
                      className="flex-1 bg-main/50 border border-white/5 focus:border-accent rounded-[24px] p-7 text-2xl font-bold transition-all shadow-sm text-main outline-none"
                    />
                    <button 
                      onClick={handleAiSpark}
                      disabled={isAiLoading || !title}
                      className="bg-accent text-white px-10 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-accent/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAiLoading ? 'Synthesizing...' : 'AI SPARK'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                   <label className="absolute -top-2.5 left-8 bg-secondary px-2.5 text-[10px] font-black text-accent uppercase tracking-[0.2em] z-10">Contextual Bio</label>
                   <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the discussion goals..."
                    className="w-full bg-main/50 border border-white/5 focus:border-accent rounded-[32px] p-9 text-xl font-medium min-h-[180px] transition-all shadow-sm resize-none text-main outline-none"
                   />
                </div>
              </div>

              <button 
                onClick={handleGoToStudio}
                disabled={!title || !description}
                className="w-full bg-main text-main py-9 rounded-[32px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl border border-accent/20 hover:bg-black hover:text-white transition-all active:scale-95 disabled:opacity-20"
              >
                Enter Design Phase →
              </button>
            </div>
          )}

          {step === 'studio' && (
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-12 animate-in slide-in-from-right-8 duration-500">
               <div className="text-center">
                  <h3 className="text-5xl font-black text-main tracking-tight mb-4 uppercase italic">Visuals</h3>
                  <p className="text-xl text-muted font-medium">Generating industrial-grade promotional graphics.</p>
               </div>

               <div className="w-full max-w-lg aspect-square bg-main rounded-[48px] shadow-2xl border-4 border-white/5 overflow-hidden relative group">
                  {isAiLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-main/50 gap-6">
                       <div className="w-16 h-16 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
                       <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] animate-pulse">Rendering...</p>
                    </div>
                  ) : adImage ? (
                    <>
                      <img src={adImage} className="w-full h-full object-cover" alt="Poster" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Save Visual</button>
                      </div>
                    </>
                  ) : <div className="absolute inset-0 flex items-center justify-center text-muted uppercase tracking-widest">Awaiting Synthesis</div>}
               </div>

               <button 
                onClick={handleGenerateTeaser}
                className="w-full max-w-xl bg-accent text-white py-9 rounded-[32px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95"
               >
                 Draft Marketing Kit →
               </button>
            </div>
          )}

          {step === 'teaser' && (
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-12 animate-in slide-in-from-right-8 duration-500">
               <div className="text-center">
                  <h3 className="text-5xl font-black text-main tracking-tight mb-4 uppercase italic">Audio Teaser</h3>
                  <p className="text-xl text-muted font-medium">Neural AI voice-over for cross-platform distribution.</p>
               </div>

               <div className="w-full bg-secondary p-12 rounded-[48px] shadow-2xl border border-white/5 flex flex-col items-center gap-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-indigo-500 to-purple-500" />
                  <div className="w-20 h-20 bg-accent/10 rounded-[24px] flex items-center justify-center text-accent">
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>

                  <div className="text-center">
                     <p className="text-lg font-bold text-main italic line-clamp-2">"Broadcasting soon: {title} on EchoHub!"</p>
                  </div>

                  {voiceTeaser && <audio ref={audioRef} src={`data:audio/mp3;base64,${voiceTeaser}`} />}

                  <button 
                    onClick={playTeaser}
                    disabled={isAiLoading || !voiceTeaser}
                    className="bg-accent text-white p-10 rounded-full shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                  >
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </button>
               </div>

               <button 
                onClick={() => setStep('distribute')}
                className="w-full max-w-xl bg-main text-main py-9 rounded-[32px] font-black uppercase tracking-[0.4em] text-lg shadow-2xl hover:bg-black hover:text-white transition-all active:scale-95"
               >
                 Finalize Payload →
               </button>
            </div>
          )}

          {step === 'distribute' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500">
               <div className="text-center">
                  <h3 className="text-5xl font-black text-main tracking-tight mb-4 uppercase italic">Global Sync</h3>
                  <p className="text-xl text-muted font-medium">Your stage is indexed. Ready for Hub Activation.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-secondary p-10 rounded-[40px] shadow-2xl border border-white/5 space-y-8">
                     <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">Platform Distribution</h4>
                     <div className="space-y-6">
                        {[
                          { id: 'twitter', icon: '🐦', name: 'X', content: promoKit?.twitter },
                          { id: 'whatsapp', icon: '💬', name: 'WhatsApp', content: promoKit?.whatsapp },
                        ].map(platform => (
                          <div key={platform.id} className="p-6 rounded-[24px] bg-main/20 border border-white/5 hover:border-accent/30 transition-all group">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[9px] font-black text-main uppercase tracking-widest">{platform.name} Payload</span>
                                <button onClick={() => copyToClipboard(platform.content || '')} className="text-[8px] font-black text-accent bg-accent/10 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">Copy</button>
                             </div>
                             <p className="text-sm font-medium text-muted italic line-clamp-2">"{platform.content || 'Synthesizing...'}"</p>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col gap-10">
                     <div className="flex-1 bg-accent p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                           <div>
                              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-60">Session Routing URL</h4>
                              <p className="text-2xl font-black mb-2">echohub.app/h/{Date.now().toString().slice(-6)}</p>
                           </div>
                           <button className="bg-white text-accent px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest self-start shadow-xl active:scale-95 transition-all">Copy URL</button>
                        </div>
                     </div>

                     <button 
                      onClick={handleFinalLaunch}
                      disabled={isLaunching}
                      className="w-full bg-green-600 text-white py-11 rounded-[40px] font-black uppercase tracking-[0.4em] text-xl shadow-2xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-4"
                     >
                       {isLaunching ? (
                         <>
                           <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                           Igniting...
                         </>
                       ) : 'Ignite Stage Now'}
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="bg-secondary p-8 border-t border-white/5 flex justify-between items-center shrink-0">
           {step !== 'concept' && (
             <button onClick={() => setStep(step === 'studio' ? 'concept' : step === 'teaser' ? 'studio' : 'teaser')} className="text-[10px] font-black text-muted uppercase tracking-widest hover:text-main">← Step Back</button>
           )}
           <div className="text-[9px] font-black text-muted/30 uppercase tracking-[0.4em]">Neural Ignition Protocol v2.0</div>
        </div>
      </div>
    </div>
  );
};

export default ViralLaunchpad;
