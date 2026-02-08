
import React, { useState, useEffect } from 'react';
import { generateAdPoster } from '../services/geminiService';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  roomUrl: string;
  onShowToast: (msg: string) => void;
}

const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, roomTitle, roomUrl, onShowToast }) => {
  const [adImage, setAdImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && !adImage) {
      handleGeneratePoster();
    }
  }, [isOpen]);

  const handleGeneratePoster = async () => {
    setIsGenerating(true);
    const poster = await generateAdPoster(roomTitle, "Live Audio Discussion on Voice Room Live");
    setAdImage(poster);
    setIsGenerating(false);
  };

  if (!isOpen) return null;

  const shareText = `🎙️ I'm live in "${roomTitle}" on EchoHub! Join the conversation: ${roomUrl}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(roomUrl);

  const handleShareNativeFile = async () => {
    if (!adImage) {
      onShowToast("Poster is still generating...");
      return;
    }

    try {
      const res = await fetch(adImage);
      const blob = await res.blob();
      const file = new File([blob], 'voiceroomlive-room.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Join me on Voice Room Live!`,
          text: `We are talking about: ${roomTitle}`,
          url: roomUrl
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Voice Room Live`,
          text: shareText,
          url: roomUrl
        });
      } else {
        copyLink();
      }
    } catch (err) {
      console.error("Native share failed", err);
      copyLink();
    }
  };

  const platforms = [
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
      url: `https://api.whatsapp.com/send?text=${encodedText}`,
      color: 'bg-[#25D366]'
    },
    { 
      id: 'twitter', 
      name: 'Twitter / X', 
      icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png',
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
      color: 'bg-[#000000]'
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-[#1877F2]'
    },
    { 
      id: 'snapchat', 
      name: 'Snapchat', 
      icon: 'https://cdn-icons-png.flaticon.com/512/3670/3670162.png',
      url: `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`,
      color: 'bg-[#FFFC00]',
      textColor: 'text-black'
    },
    { 
      id: 'instagram', 
      name: 'IG Stories', 
      icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      handler: handleShareNativeFile,
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]'
    },
    { 
      id: 'native', 
      name: 'System Share', 
      icon: 'https://cdn-icons-png.flaticon.com/512/1159/1159633.png',
      handler: handleShareNativeFile,
      color: 'bg-indigo-600'
    }
  ];

  const handleAction = (p: any) => {
    if (p.handler) {
      p.handler();
    } else if (p.url) {
      window.open(p.url, '_blank');
    } else {
      onShowToast(p.instruction || "Option selected");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    onShowToast("Link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-[350] bg-indigo-950/80 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#f7f3e9] rounded-[60px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Social Outreach</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Share this moment with the world</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          {/* AI Poster Preview */}
          <div className="bg-white p-6 rounded-[48px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
             <div className="w-48 h-48 rounded-[32px] bg-gray-50 overflow-hidden shadow-xl border-4 border-white shrink-0 relative group">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-[8px] font-black text-gray-400 uppercase">Designing...</span>
                  </div>
                ) : adImage ? (
                  <>
                    <img src={adImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Promo" />
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = adImage;
                        link.download = 'echohub-live.png';
                        link.click();
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      Save Image
                    </button>
                  </>
                ) : null}
             </div>
             <div className="flex-1">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Live Now Poster</h3>
                <p className="text-sm font-medium text-gray-600 mb-6">Maximize virality by sharing this AI-generated visual to your Stories or feeds.</p>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 truncate flex-1">{roomUrl}</p>
                  <button onClick={copyLink} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Copy Link</button>
                </div>
             </div>
          </div>

          {/* Platform Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             {platforms.map(p => (
               <button 
                key={p.id}
                onClick={() => handleAction(p)}
                className={`${p.color} ${p.textColor || 'text-white'} p-6 rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95 transition-all relative overflow-hidden group`}
               >
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <img src={p.icon} className="w-10 h-10 object-contain drop-shadow-md" alt={p.name} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
               </button>
             ))}
          </div>

          <div className="bg-gray-100 p-6 rounded-[32px] text-center">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
               By sharing, you're inviting the world to a moderated, AI-powered social space. 
               Room: <span className="text-gray-900 font-black">{roomTitle}</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialShareModal;
