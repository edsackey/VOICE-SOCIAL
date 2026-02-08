
import React, { useState, useEffect, useRef } from 'react';
import { Room, User, UserRole, TranscriptionEntry, MediaState, PodcastRecord, PlaylistTrack } from '../types';
import Avatar from './Avatar';
import InviteModal from './InviteModal';
import LanguagePicker from './LanguagePicker';
import ProjectionView from './ProjectionView';
import MediaConsole from './MediaConsole';
import SocialShareModal from './SocialShareModal';
import RoomAudioPlayer from './RoomAudioPlayer';
import LiveStreamConsole from './LiveStreamConsole';
import DonationModal from './DonationModal';
import AttendanceModal from './AttendanceModal';
import BroadcastModal from './BroadcastModal';
import RoomAnalytics from './RoomAnalytics';
import { translateTranscription, generateVoiceTranslation, generateMeetingMinutes } from '../services/geminiService';
import { StorageService } from '../services/storageService';

const MUTE_PREF_KEY = 'voiceroomlive_mute_preference';
const VOICE_PREF_KEY = 'voiceroomlive_voice_translation_preference';
const SELECTED_VOICE_KEY = 'voiceroomlive_selected_voice_preference';
const LANG_PREF_KEY = 'voiceroomlive_language_preference';
const BILINGUAL_PREF_KEY = 'voiceroomlive_bilingual_preference';

interface LiveRoomProps {
  room: Room;
  onExit: () => void;
  onUserClick: (user: User) => void;
  userVolumes: Record<string, number>;
  onVolumeChange: (userId: string, volume: number) => void;
  currentUser: User;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ room, onExit, onUserClick, userVolumes, onVolumeChange, currentUser }) => {
  const [transcriptions, setTranscriptions] = useState<(TranscriptionEntry & { translation?: string; isReading?: boolean; isAi?: boolean })[]>([]);
  const [recentDonation, setRecentDonation] = useState<{ amount: number; currency: string; user: string } | null>(null);
  const [speakerStats, setSpeakerStats] = useState<Record<string, number>>({});
  const [isQuotaHit, setIsQuotaHit] = useState(false);
  
  // Role Detection
  const role = currentUser.role;
  const isHost = role === UserRole.HOST;
  const isMod = role === UserRole.MODERATOR;
  const isAdvertiser = role === UserRole.ADVERTISER;
  const isSpeaker = role === UserRole.SPEAKER || isHost || isMod || isAdvertiser;
  const isListener = role === UserRole.LISTENER;

  // Granular Permissions
  const canRecord = isHost || isMod;
  const canModerate = isHost || isMod;
  const canPostAds = isHost || isMod || isAdvertiser;
  const canManageMedia = isHost || isMod || isAdvertiser;
  const canSpeak = isSpeaker;
  const canShare = true; 
  const canStream = true; 

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem(MUTE_PREF_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(VOICE_PREF_KEY);
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [isBilingualEnabled, setIsBilingualEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(BILINGUAL_PREF_KEY);
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    const saved = localStorage.getItem(SELECTED_VOICE_KEY);
    return saved !== null ? saved : 'Zephyr';
  });

  const [targetLanguage, setTargetLanguage] = useState<string>(() => {
    const saved = localStorage.getItem(LANG_PREF_KEY);
    return saved !== null ? saved : 'Original';
  });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);
  const [isMediaConsoleOpen, setIsMediaConsoleOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isStreamConsoleOpen, setIsStreamConsoleOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [currentMedia, setCurrentMedia] = useState<MediaState>({ type: 'none', isPulsing: false });
  const [isRecording, setIsRecording] = useState(false);
  const [isFinalizingArchive, setIsFinalizingArchive] = useState(false);
  const [audioTracks, setAudioTracks] = useState<PlaylistTrack[]>([]);
  
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Record Attendance on Join
  useEffect(() => {
    StorageService.recordJoin(room.id, { id: currentUser.id, name: currentUser.name });
  }, [room.id, currentUser]);

  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  useEffect(() => {
    localStorage.setItem(MUTE_PREF_KEY, JSON.stringify(isMuted));
    localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(isVoiceEnabled));
    localStorage.setItem(BILINGUAL_PREF_KEY, JSON.stringify(isBilingualEnabled));
    localStorage.setItem(SELECTED_VOICE_KEY, selectedVoice);
    localStorage.setItem(LANG_PREF_KEY, targetLanguage);
  }, [isMuted, isVoiceEnabled, selectedVoice, targetLanguage, isBilingualEnabled]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (recentDonation) {
      const timer = setTimeout(() => setRecentDonation(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [recentDonation]);

  const handleDonationSuccess = (amount: number, currency: string) => {
    setRecentDonation({ amount, currency, user: currentUser.name });
    showToast(`Successfully processed via DPO! ${currency} ${amount} sent. 💖`);
  };

  const decodeBase64Audio = async (base64: string): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return audioBuffer;
  };

  const playVoiceTranslation = async (base64: string, entryId: number) => {
    const buffer = await decodeBase64Audio(base64);
    if (!buffer || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    // Gapless queueing
    const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
    
    if (entryId !== -1) {
      const startOffset = (startTime - ctx.currentTime) * 1000;
      setTimeout(() => {
        setTranscriptions(prev => prev.map((t, idx) => idx === entryId ? { ...t, isReading: true } : t));
      }, startOffset);
      setTimeout(() => {
        setTranscriptions(prev => prev.map((t, idx) => idx === entryId ? { ...t, isReading: false } : t));
      }, startOffset + (buffer.duration * 1000));
    }
  };

  useEffect(() => {
    const mockPhrases = [
      "Welcome everyone to VOICE SOCIAL!", "Let's discuss the role of AI in design.", 
      "The real-time translation feature is live.", "Can we get a reaction on the stage?",
      "Checking out the new room media console features."
    ];
    
    const interval = setInterval(async () => {
      const allParticipants = [...room.speakers, ...room.listeners];
      const speakerCandidate = allParticipants[Math.floor(Math.random() * allParticipants.length)];
      if (!speakerCandidate) return;

      const text = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
      
      const newEntry: TranscriptionEntry & { translation?: string; isReading?: boolean } = {
        userId: speakerCandidate.id,
        userName: speakerCandidate.name,
        text,
        timestamp: Date.now()
      };

      // Update speaker stats
      setSpeakerStats(prev => ({
        ...prev,
        [speakerCandidate.name]: (prev[speakerCandidate.name] || 0) + 1
      }));

      if (targetLanguage !== 'Original') {
        try {
          const translation = await translateTranscription(text, targetLanguage);
          if (translation === text) {
            setIsQuotaHit(true);
          } else {
            setIsQuotaHit(false);
          }
          newEntry.translation = translation;
          
          if (isVoiceEnabled && !isQuotaHit) {
            // Sequence: Original -> Translation if bilingual enabled
            if (isBilingualEnabled) {
              const originalAudio = await generateVoiceTranslation(text, 'English', 'Puck');
              if (originalAudio) {
                // Play original immediately (will be queued by nextStartTimeRef)
                playVoiceTranslation(originalAudio, -1);
              }
            }

            const transAudio = await generateVoiceTranslation(translation, targetLanguage, selectedVoice);
            if (transAudio) {
              setTranscriptions(prev => {
                const nextState = [...prev.slice(-20), newEntry];
                // Play translation (will be queued after original if applicable)
                playVoiceTranslation(transAudio, nextState.length - 1);
                return nextState;
              });
              return;
            }
          }
        } catch (e) {
          setIsQuotaHit(true);
        }
      }
      setTranscriptions(prev => [...prev.slice(-20), newEntry]);
    }, 10000); 
    return () => clearInterval(interval);
  }, [room.speakers, room.listeners, targetLanguage, isVoiceEnabled, selectedVoice, isBilingualEnabled, isQuotaHit]);

  const handleExitFlow = async () => {
    if (isRecording && transcriptions.length > 2) {
      setIsFinalizingArchive(true);
      const history = transcriptions.map(t => `${t.userName}: ${t.text}`);
      const minutes = await generateMeetingMinutes(room.title, history);
      const podcast: PodcastRecord = {
        id: `pod-${Date.now()}`,
        title: room.title,
        date: new Date().toLocaleDateString(),
        duration: "Live Stream",
        speakers: room.speakers.map(s => s.name),
        minutes,
        audioUrl: '#' 
      };
      const existing = JSON.parse(localStorage.getItem('voiceroomlive_podcasts') || '[]');
      localStorage.setItem('voiceroomlive_podcasts', JSON.stringify([podcast, ...existing]));
      setIsFinalizingArchive(false);
    }
    onExit();
  };

  const showToast = (msg: string) => setToastMessage(msg);

  return (
    <div className={`flex flex-col h-screen max-h-screen bg-[#f7f3e9] overflow-hidden transition-all duration-300 ${currentMedia.isPulsing ? 'animate-pulse ring-[20px] ring-indigo-500/10' : ''}`}>
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 font-bold text-sm">
          {toastMessage}
        </div>
      )}

      {recentDonation && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[501] bg-green-500 text-white px-8 py-4 rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-500 flex items-center gap-4 border-2 border-white">
           <div className="text-2xl">💰</div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-100">DPO Secure Bounty</p>
              <p className="text-lg font-black">{recentDonation.user} sent {recentDonation.currency} {recentDonation.amount}!</p>
           </div>
           <div className="bg-white/20 p-2 rounded-full animate-ping">💖</div>
        </div>
      )}

      {isFinalizingArchive && (
        <div className="fixed inset-0 z-[600] bg-indigo-950/90 backdrop-blur-3xl flex flex-col items-center justify-center text-white p-10 text-center animate-in fade-in duration-500">
           <div className="w-24 h-24 border-8 border-white/10 border-t-white rounded-full animate-spin mb-10" />
           <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Finalizing Vault Archive</h2>
           <p className="text-xl font-medium opacity-60">Gemini is synthesizing professional session minutes...</p>
        </div>
      )}

      <div className="p-4 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <button onClick={handleExitFlow} className="text-gray-600 flex items-center gap-2 font-black uppercase text-xs tracking-widest px-4 py-2 hover:bg-white rounded-full transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          Leave
        </button>
        <div className="flex items-center gap-4">
          {isQuotaHit && (
            <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-200 animate-pulse">
              AI Quota High
            </div>
          )}
          
          <button 
            onClick={() => setIsDonationModalOpen(true)} 
            className="bg-green-500 text-white px-5 py-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-green-400 group"
          >
             <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span className="text-[10px] font-black uppercase tracking-widest">Support creator</span>
          </button>

          <button onClick={() => setIsLangPickerOpen(true)} className="bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2 hover:border-indigo-200 transition-all">
             <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c.343 3.395-1.442 6.55-4.339 8.163m3.588-8.163A18.022 18.022 0 016.412 9m0 0H2" /></svg>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{targetLanguage}</span>
          </button>
          
          <div className="bg-indigo-50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100">
            {role}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full border border-red-200 animate-pulse">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Recording</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-44 custom-scrollbar">
        <ProjectionView media={currentMedia} room={room} />

        <div className="mb-10 flex justify-between items-start px-2">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">{room.title}</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Social Audio • {room.participantCount} online</p>
          </div>
          
          <div className="flex gap-2">
            {canModerate && (
              <>
                <button onClick={() => setIsAttendanceModalOpen(true)} className="bg-white text-indigo-600 p-4 rounded-3xl shadow-xl border border-gray-100 hover:scale-110 active:scale-95 transition-all group" title="Attendance">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </button>
                <button onClick={() => setIsAnalyticsOpen(true)} className="bg-white text-indigo-600 p-4 rounded-3xl shadow-xl border border-gray-100 hover:scale-110 active:scale-95 transition-all group" title="Room Analytics">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </button>
                <button onClick={() => setIsBroadcastModalOpen(true)} className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl hover:scale-110 active:scale-95 transition-all group" title="Broadcast Message">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                </button>
              </>
            )}
            {canStream && (
              <button onClick={() => setIsStreamConsoleOpen(true)} className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl hover:scale-110 active:scale-95 transition-all group" title="Stream Settings">
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            )}
            {canManageMedia && (
              <button onClick={() => setIsMediaConsoleOpen(true)} className="bg-white text-indigo-600 p-4 rounded-3xl shadow-xl border border-gray-100 hover:scale-110 active:scale-95 transition-all group" title="Media Hub">
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-8 mb-16 px-2">
          {room.speakers.map(speaker => (
            <Avatar key={speaker.id} user={speaker} size="lg" onClick={onUserClick} />
          ))}
          <Avatar 
            onClick={onUserClick} 
            user={{ ...currentUser, isMuted, handRaised: false }} 
            size="lg" 
          />
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
           <div className="bg-white/70 backdrop-blur-md rounded-[56px] p-10 h-96 overflow-y-auto border border-white shadow-2xl mx-2">
             {transcriptions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center opacity-20 space-y-4">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Voice Activity</p>
               </div>
             ) : (
               transcriptions.map((t, idx) => (
                 <div key={idx} className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-5">
                       <img src={`https://picsum.photos/seed/${t.userId}/100`} className="w-10 h-10 rounded-[15px] object-cover shadow-md border-2 border-white" alt="" />
                       <div className="flex-1">
                          <p className="font-black text-[10px] uppercase tracking-widest text-indigo-600 mb-1">{t.userName}</p>
                          <p className="text-base font-medium leading-relaxed text-gray-500 italic">"{t.text}"</p>
                          {t.translation && (
                            <div className={`mt-4 p-5 rounded-[30px] border transition-all duration-700 ${t.isReading ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-indigo-50 text-indigo-900 border-indigo-100'}`}>
                              <p className="text-lg font-bold leading-tight">{t.translation}</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
               ))
             )}
             <div ref={transcriptionEndRef} />
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-8 pb-12 bg-white border-t border-gray-100 flex items-center justify-between fixed bottom-0 left-0 right-0 max-w-5xl mx-auto rounded-t-[64px] shadow-2xl z-20">
        <div className="flex items-center gap-3">
          <button onClick={handleExitFlow} className="bg-gray-50 text-red-500 px-6 py-5 rounded-[32px] font-black uppercase text-[11px] tracking-widest hover:bg-red-50 transition-all">
            Leave
          </button>
          {canRecord && (
            <button 
              onClick={() => setIsRecording(!isRecording)} 
              className={`p-5 rounded-[32px] transition-all shadow-xl border ${isRecording ? 'bg-red-600 text-white border-red-700' : 'bg-white text-gray-400 border-gray-100'}`}
              title={isRecording ? "Stop Record" : "Start Record"}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
           {canShare && (
             <button onClick={() => setIsShareModalOpen(true)} className="p-5 rounded-[32px] bg-white text-indigo-600 border border-indigo-100 shadow-xl transition-all" title="Share Activity"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button>
           )}
           <button onClick={() => setIsInviteModalOpen(true)} className="p-5 rounded-[32px] bg-white text-gray-900 border border-gray-100 shadow-xl transition-all" title="Invite"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
           
           <button 
             onClick={() => canSpeak && setIsMuted(!isMuted)} 
             disabled={!canSpeak}
             className={`p-7 rounded-[36px] transition-all shadow-2xl ${!isMuted ? 'bg-green-500 text-white ring-[12px] ring-green-100' : isListener ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
           >
             {!isMuted ? (
                <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-1.93z" clipRule="evenodd" /></svg>
             ) : (
                <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a3 3 0 00-3 3v2a3 3 0 006 0V5a3 3 0 00-3-3zM5 8a1 1 0 011-1h1V5a3 3 0 116 0v2h1a1 1 0 110 2h-1v2a3 3 0 01-3 3v2h-2v-2a3 3 0 01-3-3V9H5a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M3.293 3.293a1 1 0 011.414 0L16.707 15.293a1 1 0 01-1.414 1.414l-12-12a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
             )}
           </button>
        </div>
      </div>

      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} roomTitle={room.title} onShowToast={showToast} />
      <SocialShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} roomTitle={room.title} roomUrl={`${window.location.origin}${window.location.pathname}?public=true`} onShowToast={showToast} />
      <RoomAudioPlayer isOpen={isAudioPlayerOpen} onClose={() => setIsAudioPlayerOpen(false)} isHost={canModerate} tracks={audioTracks} setTracks={setAudioTracks} />
      <LiveStreamConsole isOpen={isStreamConsoleOpen} onClose={() => setIsStreamConsoleOpen(false)} roomTitle={room.title} />
      <LanguagePicker 
        isOpen={isLangPickerOpen} onClose={() => setIsLangPickerOpen(false)} 
        selectedLanguage={targetLanguage} onSelectLanguage={setTargetLanguage} 
        isVoiceEnabled={isVoiceEnabled} onToggleVoice={setIsVoiceEnabled} 
        selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} 
        isBilingualEnabled={isBilingualEnabled} onToggleBilingual={setIsBilingualEnabled}
      />
      <MediaConsole 
        isOpen={isMediaConsoleOpen} onClose={() => setIsMediaConsoleOpen(false)} 
        onUpdateMedia={setCurrentMedia} roomTopic={room.title} 
        transcriptionHistory={transcriptions.map(t => `${t.userName}: ${t.text}`)} 
        audioTracks={audioTracks} onUpdateAudioTracks={setAudioTracks}
        currentMedia={currentMedia} canPostAds={canPostAds}
      />
      
      <DonationModal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
        roomId={room.id} 
        roomTitle={room.title} 
        senderId={currentUser.id} 
        onSuccess={handleDonationSuccess} 
      />

      <AttendanceModal 
        isOpen={isAttendanceModalOpen} 
        onClose={() => setIsAttendanceModalOpen(false)} 
        roomId={room.id} 
        roomTitle={room.title} 
      />

      <BroadcastModal 
        isOpen={isBroadcastModalOpen} 
        onClose={() => setIsBroadcastModalOpen(false)} 
        roomTitle={room.title} 
        participants={[...room.speakers, ...room.listeners].map(p => ({ name: p.name, id: p.id }))} 
        onShowToast={showToast} 
      />

      <RoomAnalytics 
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        roomId={room.id}
        roomTitle={room.title}
        speakerStats={speakerStats}
      />
    </div>
  );
};

export default LiveRoom;
