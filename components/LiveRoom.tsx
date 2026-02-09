
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Room, User, UserRole, TranscriptionEntry, MediaState, PlaylistTrack, Locale, PodcastRecord } from '../types';
import Avatar from './Avatar';
import ProjectionView from './ProjectionView';
import MediaConsole from './MediaConsole';
import SocialShareModal from './SocialShareModal';
import DonationModal from './DonationModal';
import LiveStreamConsole from './LiveStreamConsole';
import RoomAnalytics from './RoomAnalytics';
import TranslationLangSelector from './TranslationLangSelector';
import RoomRecordingsModal from './RoomRecordingsModal';
import AttendanceModal from './AttendanceModal';
import { generateMeetingMinutes } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { useLocale } from './LocaleContext';
import { decode, decodeAudioData, createBlob, resample } from '../services/audioUtils';

interface LiveRoomProps {
  room: Room;
  onExit: () => void;
  onUserClick: (user: User) => void;
  userVolumes: Record<string, number>;
  onVolumeChange: (userId: string, volume: number) => void;
  currentUser: User;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ room, onExit, onUserClick, userVolumes, onVolumeChange, currentUser }) => {
  const { locale, isBilingual } = useLocale();
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [interimTranscription, setInterimTranscription] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStreamConsoleOpen, setIsStreamConsoleOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isLangSelectorOpen, setIsLangSelectorOpen] = useState(false);
  const [isRecordingsOpen, setIsRecordingsOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSessionReport, setShowSessionReport] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [lastSessionRecord, setLastSessionRecord] = useState<PodcastRecord | null>(null);

  const [currentMedia, setCurrentMedia] = useState<MediaState>({ type: 'none' });
  const [audioTracks, setAudioTracks] = useState<PlaylistTrack[]>([]);
  const [targetTranslationLang, setTargetTranslationLang] = useState<Locale>(currentUser.nativeLanguage || locale);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTranscriptionRef = useRef('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const isHost = currentUser.id === 'me' || currentUser.role === UserRole.HOST;

  // Simulate audience hands raised for host testing
  const [simulatedListeners, setSimulatedListeners] = useState<User[]>(() => 
    [...Array(12)].map((_, i) => ({
      id: `l-${i}`,
      name: i % 2 === 0 ? `Participant ${i}` : `Listener ${i}`,
      avatar: `https://picsum.photos/seed/lstn${i}/100`,
      role: UserRole.LISTENER,
      isMuted: true,
      handRaised: i === 3 || i === 7 // Mock some hands raised
    }))
  );

  useEffect(() => {
    StorageService.recordJoin(room.id, { id: currentUser.id, name: currentUser.name });
  }, [room.id, currentUser.id, currentUser.name]);

  useEffect(() => {
    if (isFeedOpen || interimTranscription) {
      transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions, isFeedOpen, interimTranscription]);

  const startLiveEngine = async () => {
    if (sessionPromiseRef.current) return;
    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = inputCtx;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isMuted) return;
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const resampledData = resample(inputData, inputCtx.sampleRate, 16000);
              const pcmBlob = createBlob(resampledData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentTranscriptionRef.current = text;
              setInterimTranscription(text);
            }
            if (message.serverContent?.outputTranscription) {
              const translatedText = message.serverContent.outputTranscription.text;
              if (message.serverContent?.turnComplete) {
                const newEntry: TranscriptionEntry = {
                  userId: currentUser.id,
                  userName: currentUser.name,
                  text: currentTranscriptionRef.current || "Voice pattern captured",
                  translation: translatedText,
                  timestamp: Date.now()
                };
                setTranscriptions(prev => [...prev.slice(-100), newEntry]);
                currentTranscriptionRef.current = '';
                setInterimTranscription('');
              }
            }
          },
          onerror: (e) => console.error("Chat-Chap Link Failure:", e),
          onclose: () => {
            sessionPromiseRef.current = null;
            setIsConnecting(false);
            setInterimTranscription('');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the Chat-Chap AI co-host.
            Your task is to provide real-time verbatim transcription and translation.
            Target Language: ${targetTranslationLang.toUpperCase()}.
            Bilingual Mode: ${isBilingual ? 'ON' : 'OFF'}.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Neural Bridge Failure:", err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!isMuted && !sessionPromiseRef.current) startLiveEngine();
  }, [isMuted]);

  useEffect(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(s => s.close());
      sessionPromiseRef.current = null;
      if (!isMuted) startLiveEngine();
    }
  }, [isBilingual, targetTranslationLang]);

  const startRecording = async () => {
    if (!isHost) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setIsFinalizing(true);
        try {
          const minutes = await generateMeetingMinutes(room.title, transcriptions.map(t => `${t.userName}: ${t.text}`));
          const newRecord: PodcastRecord = {
            id: `chat-${Date.now()}`,
            title: room.title,
            date: new Date().toLocaleDateString(),
            duration: formatDuration(recordingDuration),
            speakers: [currentUser.name, ...room.speakers.map(s => s.name)],
            minutes,
            audioUrl
          };
          StorageService.savePodcast(newRecord);
          setLastSessionRecord(newRecord);
          setShowSessionReport(true);
        } finally {
          setIsFinalizing(false);
          setRecordingDuration(0);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
      recordingTimerRef.current = window.setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleDownloadMinutes = () => {
    if (!lastSessionRecord) return;
    const element = document.createElement("a");
    const file = new Blob([lastSessionRecord.minutes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Chat-Chap_Minutes_${room.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const raisedHandCount = simulatedListeners.filter(l => l.handRaised).length + (isHandRaised ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col overflow-hidden animate-in fade-in duration-500">
      <nav className="relative z-20 px-6 py-4 flex justify-between items-center bg-[var(--bg-main)] border-b border-[var(--glass-border)]">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[var(--text-main)] hover:opacity-60 transition-opacity">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest italic">Hallway</span>
        </button>
        <div className="flex flex-col items-center">
          {isRecording && (
            <div className="flex items-center gap-2 mb-1">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-red-500 uppercase tracking-widest tabular-nums">{formatDuration(recordingDuration)}</span>
            </div>
          )}
          <h1 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] italic max-w-[180px] truncate text-center">
            {room.title}
          </h1>
        </div>
        <div className="flex items-center gap-4">
           {isHost && raisedHandCount > 0 && (
             <div className="bg-yellow-400 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 animate-bounce shadow-lg shadow-yellow-400/20">
                <span className="text-[9px] font-black uppercase tracking-widest">{raisedHandCount} Hand Raised</span>
             </div>
           )}
           <button onClick={() => setIsShareOpen(true)} className="text-[var(--text-main)] hover:scale-110 transition-transform">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
           </button>
           <button onClick={() => onUserClick(currentUser)} className="w-8 h-8 rounded-full border-2 border-[var(--accent)] overflow-hidden">
             <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
           </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-main)]">
        <div className="max-w-3xl mx-auto space-y-10 py-6 px-6">
          <section className="relative">
            <ProjectionView media={currentMedia} room={room} />
            
            {interimTranscription && (
              <div className="absolute bottom-10 left-10 right-10 z-30 animate-in slide-in-from-bottom-4 duration-300">
                <div className="premium-glass rounded-[32px] p-6 shadow-2xl border-indigo-500/30 ring-4 ring-indigo-500/10">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-xl overflow-hidden border border-indigo-500/50">
                        <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                     </div>
                     <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic animate-pulse">Neural Burst</span>
                   </div>
                   <p className="text-xl font-black text-slate-900 leading-tight">"{interimTranscription}"</p>
                </div>
              </div>
            )}
          </section>

          <section className="bg-[var(--bg-secondary)] rounded-[32px] p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-[var(--glass-border)] gap-4">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsLangSelectorOpen(true)} className="flex items-center gap-2 hover:bg-[var(--bg-main)] px-4 py-2 rounded-2xl transition-colors">
                  <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">Target: {targetTranslationLang.toUpperCase()}</span>
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="h-4 w-[1px] bg-[var(--glass-border)]" />
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${!isMuted ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                   <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Stage Uplink {isConnecting ? 'Syncing...' : 'Active'}</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setIsFeedOpen(!isFeedOpen)} className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--accent)] flex items-center gap-2 px-4 py-2">
                  {isFeedOpen ? 'Hide Pulse' : 'The Feed'}
                </button>
                {isHost && (
                  <button onClick={() => setIsAttendanceOpen(true)} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Registry</button>
                )}
             </div>
          </section>

          <section>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-12 justify-items-center">
              <Avatar user={{...currentUser, isMuted, handRaised: isHandRaised} as any} size="lg" onClick={onUserClick} />
              {room.speakers.map(speaker => (
                <Avatar key={speaker.id} user={speaker} size="lg" onClick={onUserClick} volume={userVolumes[speaker.id] ?? 1} onVolumeChange={onVolumeChange} />
              ))}
            </div>
          </section>

          <section className="pb-40">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-10 text-center italic opacity-40">Stage Listeners</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-10 justify-items-center">
              {simulatedListeners.map((listener) => (
                <div key={listener.id} className={listener.handRaised ? 'animate-pulse' : 'opacity-60'}>
                   <Avatar user={listener} size="sm" onClick={() => isHost ? onUserClick(listener) : undefined} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Control Surface */}
      <div className={`fixed bottom-0 left-0 right-0 z-[60] bg-[var(--bg-main)]/95 backdrop-blur-2xl rounded-t-[48px] shadow-[0_-30px_80px_rgba(0,0,0,0.2)] border-t border-[var(--glass-border)] transition-transform duration-700 ${isFeedOpen || isMixerOpen ? 'translate-y-0 h-[65vh]' : 'translate-y-full'}`}>
         <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-main)] italic">{isMixerOpen ? 'Level Control' : 'Simultaneous Stream'}</h4>
               <button onClick={() => { setIsFeedOpen(false); setIsMixerOpen(false); }} className="p-3 bg-white/5 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-12 px-6">
               {isMixerOpen ? (
                 <div className="space-y-6 max-w-2xl mx-auto">
                    {room.speakers.map(speaker => (
                      <div key={speaker.id} className="bg-[var(--bg-secondary)] p-6 rounded-[32px] border border-[var(--glass-border)] flex items-center justify-between gap-8 group transition-all">
                        <div className="flex items-center gap-5 shrink-0">
                          <img src={speaker.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                          <div><h5 className="font-black text-[var(--text-main)] uppercase italic">{speaker.name}</h5><p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active Node</p></div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <input type="range" min="0" max="1.5" step="0.05" value={userVolumes[speaker.id] ?? 1} onChange={(e) => onVolumeChange(speaker.id, parseFloat(e.target.value))} className="w-full h-3 bg-[var(--bg-main)] rounded-full appearance-none accent-[var(--accent)] cursor-pointer" />
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <>
                   {transcriptions.map((t, i) => (
                     <div key={i} className="animate-in slide-in-from-bottom-4 group">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 rounded-[14px] border border-[var(--accent)]/30 overflow-hidden shadow-sm">
                            <img src={t.userId === currentUser.id ? currentUser.avatar : `https://picsum.photos/seed/${t.userId}/100/100`} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--accent)] uppercase italic">{t.userName}</p>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(t.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="space-y-3 pl-14">
                          <p className={`text-base font-medium text-[var(--text-main)] leading-relaxed italic ${isBilingual ? 'opacity-50' : 'opacity-80'}`}>"{t.text}"</p>
                          {t.translation && (targetTranslationLang !== 'en' || isBilingual) && (
                            <div className="bg-[var(--accent)]/5 p-6 rounded-[28px] border border-[var(--accent)]/10 relative overflow-hidden group-hover:bg-[var(--accent)]/10 transition-all mt-2">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" />
                              <p className="text-[8px] font-black text-[var(--accent)] uppercase tracking-widest mb-2 flex items-center gap-2">Nexus Node ({targetTranslationLang.toUpperCase()})</p>
                              <p className="text-base font-bold text-[var(--text-main)] italic leading-relaxed">"{t.translation}"</p>
                            </div>
                          )}
                        </div>
                     </div>
                   ))}
                   {interimTranscription && (
                     <div className="animate-in fade-in duration-200 opacity-60">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 rounded-[14px] border border-[var(--accent)]/10 overflow-hidden ring-2 ring-accent/5 ring-offset-2">
                            <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--accent)] uppercase italic">{currentUser.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-accent/60 font-black uppercase animate-pulse">Streaming Neural...</span>
                            </div>
                          </div>
                        </div>
                        <div className="pl-14">
                          <p className="text-base font-medium text-[var(--text-main)] leading-relaxed italic opacity-40 animate-pulse">"{interimTranscription}"</p>
                        </div>
                     </div>
                   )}
                   <div ref={transcriptionEndRef} className="h-20" />
                 </>
               )}
            </div>
         </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] w-full max-w-xl px-6">
        <div className="bg-[var(--bg-main)]/90 backdrop-blur-3xl rounded-full p-4 flex justify-between items-center shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-white/10">
           <div className="flex items-center gap-2">
              <button onClick={() => setIsMediaOpen(true)} className="p-5 bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
              {isHost && (
                <button onClick={() => isRecording ? stopRecording() : startRecording()} className={`p-5 rounded-full transition-all ${isRecording ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500'}`} title={isRecording ? "Stop Recording" : "Archive Stage"}>
                  <svg className={`w-6 h-6 ${isRecording ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                </button>
              )}
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => setIsMuted(!isMuted)} className={`p-7 rounded-full transition-all transform hover:scale-105 shadow-2xl ${isMuted ? 'bg-[var(--bg-secondary)] text-slate-400' : 'bg-[var(--accent)] text-white shadow-[var(--accent-glow)]'}`}>{isMuted ? '🔇' : '🎙️'}</button>
              <button onClick={() => setIsHandRaised(!isHandRaised)} className={`p-7 rounded-full transition-all transform hover:scale-105 shadow-2xl ${isHandRaised ? 'bg-yellow-400 text-white shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'bg-[var(--bg-secondary)] text-slate-400'}`} title="Raise Hand">
                <span className="text-3xl leading-none">✋</span>
              </button>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => { setIsMixerOpen(!isMixerOpen); setIsFeedOpen(false); }} className={`p-5 rounded-full transition-all ${isMixerOpen ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100 4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></button>
              <button onClick={() => setIsAnalyticsOpen(true)} className="p-5 bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></button>
           </div>
        </div>
      </div>

      <MediaConsole isOpen={isMediaOpen} onClose={() => setIsMediaOpen(false)} onUpdateMedia={setCurrentMedia} roomTopic={room.title} roomPoster={room.posterUrl} transcriptionHistory={transcriptions.map(t => `${t.userName}: ${t.text}`)} audioTracks={audioTracks} onUpdateAudioTracks={setAudioTracks} currentMedia={currentMedia} canPostAds={isHost} />
      <SocialShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomTitle={room.title} roomUrl={`https://chat-chap.app/rooms/${room.id}`} onShowToast={() => {}} />
      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} roomId={room.id} roomTitle={room.title} senderId={currentUser.id} onSuccess={()=>{}} />
      <LiveStreamConsole isOpen={isStreamConsoleOpen} onClose={() => setIsStreamConsoleOpen(false)} roomTitle={room.title} />
      <RoomAnalytics isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} roomId={room.id} roomTitle={room.title} speakerStats={{}} />
      <TranslationLangSelector isOpen={isLangSelectorOpen} onClose={() => setIsLangSelectorOpen(false)} selectedLang={targetTranslationLang} onSelect={setTargetTranslationLang} />
      <RoomRecordingsModal isOpen={isRecordingsOpen} onClose={() => setIsRecordingsOpen(false)} roomTitle={room.title} />
      <AttendanceModal isOpen={isAttendanceOpen} onClose={() => setIsAttendanceOpen(false)} roomId={room.id} roomTitle={room.title} />

      {isFinalizing && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in">
           <div className="w-20 h-20 border-8 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-10" />
           <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-white italic animate-pulse">Syncing to Vault</h2>
        </div>
      )}

      {showSessionReport && lastSessionRecord && (
        <div className="fixed inset-0 z-[400] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
           <div className="w-full max-w-4xl bg-[var(--bg-secondary)] rounded-[64px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-12 bg-gradient-to-br from-indigo-700 via-accent to-indigo-900 text-white shrink-0 flex justify-between items-center">
                 <div><h2 className="text-5xl font-black uppercase tracking-tighter italic">Vault Secure</h2><p className="text-[10px] font-bold uppercase tracking-[0.8em] opacity-60">Chat-Chap Neural Archive</p></div>
                 <button onClick={() => setShowSessionReport(false)} className="p-5 bg-black/30 rounded-full hover:bg-black/50 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-main/20">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <h3 className="text-[14px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-3"><span className="w-8 h-0.5 bg-indigo-500" />AI Neural Analysis</h3>
                       <div className="bg-[var(--bg-secondary)] p-10 rounded-[48px] border border-[var(--glass-border)] shadow-inner min-h-[300px] italic leading-relaxed text-xl whitespace-pre-wrap">{lastSessionRecord.minutes}</div>
                    </div>
                    <div className="flex flex-col gap-8 justify-center">
                       <h3 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.4em] flex items-center gap-3"><span className="w-8 h-0.5 bg-orange-500" />Master Suite</h3>
                       <button onClick={handleDownloadMinutes} className="group bg-indigo-600 text-white p-10 rounded-48 shadow-2xl flex items-center justify-between border-4 border-indigo-500/20 active:scale-95 transition-all">
                         <div className="text-left">
                            <p className="text-2xl font-black uppercase">Transcription</p>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Download .txt Minutes</p>
                         </div>
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </button>
                       <button 
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = lastSessionRecord.audioUrl;
                          link.download = `Chat-Chap_Master_${room.title.replace(/\s+/g, '_')}.webm`;
                          link.click();
                        }}
                        className="group bg-orange-500 text-white p-10 rounded-48 shadow-2xl flex items-center justify-between border-4 border-orange-400/20 active:scale-95 transition-all"
                       >
                         <div className="text-left">
                            <p className="text-2xl font-black uppercase">Audio Master</p>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Download .webm Broadcast</p>
                         </div>
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LiveRoom;
