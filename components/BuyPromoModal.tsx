
import React, { useState, useRef, useEffect } from 'react';
import { DBUser, MonetizedPromo, ScheduledEvent } from '../types';
import { StorageService } from '../services/storageService';

interface BuyPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: DBUser;
  onSuccess: () => void;
}

const BuyPromoModal: React.FC<BuyPromoModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [days, setDays] = useState(1);
  const [step, setStep] = useState<'details' | 'media' | 'payment' | 'processing'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MOMO'>('CARD');
  const [myEvents, setMyEvents] = useState<ScheduledEvent[]>([]);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const allEvents = StorageService.getScheduledEvents();
      // Filter for events hosted by current user
      const userEvents = allEvents.filter(e => e.hostName === currentUser.displayName);
      setMyEvents(userEvents);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const totalCost = days * 1.0;

  const handleNext = () => {
    if (step === 'details') setStep('media');
    else if (step === 'media') setStep('payment');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === 'image') setImageUrl(result);
      else setAudioUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectEvent = (event: ScheduledEvent) => {
    setTitle(event.title);
    setDescription(event.description);
    setImageUrl(event.posterUrl || '');
    // In a real app, we might also auto-link to the room
  };

  const handlePayment = () => {
    setStep('processing');
    setTimeout(() => {
      const newPromo: MonetizedPromo = {
        id: `promo-${Date.now()}`,
        userId: currentUser.id,
        title,
        description,
        targetUrl: targetUrl || '#',
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/400`,
        audioUrl: audioUrl,
        startDate: Date.now(),
        durationDays: days,
        totalPaid: totalCost,
        status: 'active'
      };
      StorageService.savePromo(newPromo);
      onSuccess();
      reset();
    }, 3000);
  };

  const reset = () => {
    setStep('details');
    setTitle('');
    setDescription('');
    setImageUrl('');
    setAudioUrl('');
    setTargetUrl('');
    setDays(1);
    onClose();
  };

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-[700] bg-indigo-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-24 h-24 border-8 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-8" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">DPO Secure Checkout</h2>
        <p className="text-indigo-300 font-bold uppercase text-[10px] tracking-widest animate-pulse">Confirming Transaction...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[650] bg-indigo-950/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#f7f3e9] rounded-[56px] overflow-hidden shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
           <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Boost Your Hub</h2>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">$1.00 USD per day • Audio & Visual Ads</p>
           </div>
           <button onClick={reset} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
           {step === 'details' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                {myEvents.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Your Upcoming Events</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {myEvents.map(event => (
                        <button 
                          key={event.id}
                          onClick={() => handleSelectEvent(event)}
                          className="shrink-0 w-40 p-4 bg-white rounded-3xl border-2 border-indigo-50 hover:border-indigo-600 transition-all text-left group"
                        >
                          <p className="text-[10px] font-black text-gray-900 line-clamp-2 uppercase leading-tight mb-1 group-hover:text-indigo-600">{event.title}</p>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Use This</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Promo Title</label>
                   <input 
                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Grand Opening: Digital Art Gallery"
                    className="w-full bg-white border-none rounded-2xl p-5 text-gray-800 font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                   <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Join us for a unique auditory experience..."
                    className="w-full bg-white border-none rounded-3xl p-5 text-sm font-medium shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all resize-none h-24"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Campaign Duration</label>
                    <div className="flex items-center bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                       <button onClick={() => setDays(Math.max(1, days - 1))} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-indigo-600 font-black">-</button>
                       <span className="flex-1 text-center font-black text-gray-900">{days} Days</span>
                       <button onClick={() => setDays(days + 1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-indigo-600 font-black">+</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Total Budget</label>
                    <div className="bg-indigo-600 text-white rounded-2xl p-4 text-center font-black text-xl shadow-lg shadow-indigo-100">
                       ${totalCost.toFixed(2)}
                    </div>
                  </div>
                </div>
             </div>
           )}

           {step === 'media' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                   <div className="flex justify-between items-center px-2">
                     <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Promotion Visual</h3>
                     {imageUrl && (
                       <button onClick={() => setImageUrl('')} className="text-[10px] font-black text-red-500 uppercase tracking-widest">Clear</button>
                     )}
                   </div>
                   <div 
                    onClick={() => imgInputRef.current?.click()}
                    className="aspect-video bg-white rounded-[40px] border-4 border-dashed border-indigo-50 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all relative overflow-hidden shadow-inner group"
                   >
                     {imageUrl ? (
                       <>
                        <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Preview" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                           <span className="text-[10px] text-white font-black uppercase tracking-widest bg-white/20 px-6 py-2 rounded-full border border-white/20">Change Graphic</span>
                        </div>
                       </>
                     ) : (
                       <div className="text-center p-6">
                         <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         </div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Upload High-Res Banner or GIF</p>
                       </div>
                     )}
                     <input type="file" ref={imgInputRef} className="hidden" accept="image/png, image/jpeg, image/gif" onChange={(e) => handleFileUpload(e, 'image')} />
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest px-2">Audio Teaser (Optional)</h3>
                   <div 
                    onClick={() => audioInputRef.current?.click()}
                    className={`p-8 rounded-[40px] border-2 transition-all flex items-center justify-between cursor-pointer group ${audioUrl ? 'bg-green-50 border-green-200' : 'bg-white border-indigo-50 hover:bg-indigo-50'}`}
                   >
                     <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg transition-all ${audioUrl ? 'bg-green-500 text-white animate-pulse' : 'bg-indigo-50 text-indigo-400 group-hover:scale-110'}`}>
                           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                            {audioUrl ? 'Voice Teaser Attached' : 'Attach Professional Audio'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {audioUrl ? 'Ready for broadcast' : 'Select MP3, WAV or AAC'}
                          </p>
                        </div>
                     </div>
                     <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} />
                     {audioUrl && (
                       <button 
                        onClick={(e) => { e.stopPropagation(); setAudioUrl(''); }}
                        className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                     )}
                   </div>
                </div>
             </div>
           )}

           {step === 'payment' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-10 rounded-[56px] border border-indigo-100 shadow-xl text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Order Summary</p>
                   <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">{title}</h3>
                   <div className="flex items-center justify-center gap-4 mt-6">
                      <div className="bg-indigo-50 px-6 py-2 rounded-2xl text-indigo-600 font-black text-sm">{days} Days</div>
                      <div className="w-2 h-2 bg-gray-200 rounded-full" />
                      <div className="bg-green-50 px-6 py-2 rounded-2xl text-green-600 font-black text-sm">${totalCost.toFixed(2)}</div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-4">Payment Selection</h4>
                   
                   <button 
                    onClick={() => setPaymentMethod('CARD')}
                    className={`w-full p-8 rounded-[40px] border-2 flex items-center justify-between transition-all group ${paymentMethod === 'CARD' ? 'bg-indigo-50 border-indigo-600 shadow-2xl scale-105' : 'bg-white border-indigo-50 hover:bg-indigo-50'}`}
                   >
                     <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg transition-all ${paymentMethod === 'CARD' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>
                           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        <div className="text-left">
                           <p className="text-lg font-black text-gray-800 uppercase tracking-tight">Direct Pay Online</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Supports Visa, MC & Amex</p>
                        </div>
                     </div>
                     <div className={`w-6 h-6 rounded-full border-4 transition-all ${paymentMethod === 'CARD' ? 'bg-indigo-600 border-indigo-200 shadow-inner' : 'border-indigo-100'}`} />
                   </button>

                   <button 
                    onClick={() => setPaymentMethod('MOMO')}
                    className={`w-full p-8 rounded-[40px] border-2 flex items-center justify-between transition-all group ${paymentMethod === 'MOMO' ? 'bg-yellow-50 border-yellow-400 shadow-2xl scale-105' : 'bg-white border-indigo-50 hover:bg-yellow-50'}`}
                   >
                     <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg p-3 transition-all ${paymentMethod === 'MOMO' ? 'bg-yellow-400' : 'bg-white border border-indigo-100'}`}>
                           <img src="https://logowik.com/content/uploads/images/mtn-mobile-money8896.jpg" className="w-full object-contain" alt="MTN" />
                        </div>
                        <div className="text-left">
                           <p className="text-lg font-black text-gray-800 uppercase tracking-tight">Mobile Money</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ghana STK Push Activation</p>
                        </div>
                     </div>
                     <div className={`w-6 h-6 rounded-full border-4 transition-all ${paymentMethod === 'MOMO' ? 'bg-yellow-500 border-yellow-100 shadow-inner' : 'border-indigo-100'}`} />
                   </button>
                </div>
             </div>
           )}
        </div>

        <div className="p-10 bg-white border-t border-gray-100 flex gap-4 shrink-0">
           {step !== 'details' && (
             <button 
              onClick={() => setStep(step === 'media' ? 'details' : 'media')}
              className="px-10 py-6 bg-gray-100 text-gray-400 rounded-[32px] font-black uppercase text-xs transition-all active:scale-95"
             >
               Back
             </button>
           )}
           <button 
            onClick={step === 'payment' ? handlePayment : handleNext}
            disabled={step === 'details' && (!title || !description)}
            className="flex-1 bg-indigo-600 text-white py-8 rounded-[36px] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30"
           >
             {step === 'payment' ? `Finalize & Pay $${totalCost.toFixed(2)}` : 'Next Sequence →'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default BuyPromoModal;
