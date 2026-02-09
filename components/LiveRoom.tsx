
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
import { generateMeetingMinutes } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { useLocale } from './LocaleContext';
import { decode, decodeAudioData, createBlob } from '../services/audioUtils';

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
  const [isMuted, setIsMuted] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStreamConsoleOpen, setIsStreamConsoleOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isLangSelectorOpen, setIsLangSelectorOpen] = useState(false);
  const [isRecordingsOpen, setIsRecordingsOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  // Recording State
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
  
  // Media Recorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const isHost = currentUser.id === 'me' || currentUser.role === UserRole.HOST;

  useEffect(() => {
    if (isFeedOpen) {
      transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions, isFeedOpen]);

  // LIVE TRANSCRIPTION & TRANSLATION ENGINE
  const startLiveEngine = async () => {
    if (sessionPromiseRef.current) return;
    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = inputCtx;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
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
              currentTranscriptionRef.current = message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              const translatedText = message.serverContent.outputTranscription.text;
              if (message.serverContent?.turnComplete) {
                const newEntry: TranscriptionEntry = {
                  userId: currentUser.id,
                  userName: currentUser.name,
                  text: currentTranscriptionRef.current || "Voice pattern detected",
                  translation: translatedText,
                  timestamp: Date.now()
                };
                setTranscriptions(prev => [...prev.slice(-40), newEntry]);
                currentTranscriptionRef.current = '';
              }
            }
          },
          onerror: (e) => console.error("Neural Error:", e),
          onclose: () => {
            sessionPromiseRef.current = null;
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the EchoHub AI co-host. Transcribe and translate dialogue accurately.
            Target Language for Translation: ${targetTranslationLang.toUpperCase()}.
            Bilingual Interface Mode: ${isBilingual ? 'ON - provide high-fidelity transcriptions for both source and target tongues.' : 'OFF'}.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Mic Error:", err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!isMuted && !sessionPromiseRef.current) {
      startLiveEngine();
    }
  }, [isMuted]);

  // RECORDING SUITE LOGIC
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setIsFinalizing(true);
        try {
          const minutes = await generateMeetingMinutes(room.title, transcriptions.map(t => `${t.userName}: ${t.text}`));
          const newRecord: PodcastRecord = {
            id: `rec-${Date.now()}`,
            title: room.title,
            date: new Date().toLocaleDateString(),
            duration: formatDuration(recordingDuration),
            speakers: [currentUser.name, ...room.speakers.map(s => s.name)],
            minutes,
            audioUrl
          };
          StorageService.savePodcast(newRecord);
          setLastSessionRecord(newRecord);
          alert("Archive Ready: Session minutes and recording synchronized to Vault.");
        } catch (err) {
          console.error("Archiving failed", err);
        } finally {
          setIsFinalizing(false);
          setRecordingDuration(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Recording init failed", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadMinutes = () => {
    if (!lastSessionRecord) return;
    const blob = new Blob([lastSessionRecord.minutes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EchoHub_Minutes_${room.title.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  const downloadAudio = () => {
    if (!lastSessionRecord) return;
    const a = document.createElement('a');
    a.href = lastSessionRecord.audioUrl;
    a.download = `EchoHub_Recording_${room.title.replace(/\s+/g, '_')}.webm`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col overflow-hidden animate-in fade-in duration-500">
      
      {/* 1. HEADER (International Broadcasting Standard) */}
      <nav className="relative z-20 px-6 py-4 flex justify-between items-center bg-[var(--bg-main)] border-b border-[var(--glass-border)]">
        <button 
          onClick={onExit}
          className="flex items-center gap-1.5 text-[var(--text-main)] hover:opacity-60 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest italic">All Stages</span>
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
          
          {/* PROJECTION BANNER */}
          <section className="relative">
            <ProjectionView media={currentMedia} room={room} />
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
               {isRecording && (
                 <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-full border border-red-500/50 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Live Recording</span>
                 </div>
               )}
            </div>
          </section>

          {/* NEURAL INSIGHTS BAR (High-Visibility Controls) */}
          <section className="bg-[var(--bg-secondary)] rounded-[32px] p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-[var(--glass-border)] gap-4">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsLangSelectorOpen(true)}
                  className="flex items-center gap-2 hover:bg-[var(--bg-main)] px-4 py-2 rounded-2xl transition-all border border-transparent hover:border-[var(--glass-border)]"
                >
                  <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">Localization: {targetTranslationLang.toUpperCase()}</span>
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="h-4 w-[1px] bg-[var(--glass-border)] hidden sm:block" />
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${!isMuted ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                   <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Neural {isConnecting ? 'Linking...' : 'Active'}</span>
                </div>
             </div>
             
             {/* Dynamic Documentation Buttons */}
             <div className="flex items-center gap-2">
                {lastSessionRecord ? (
                  <div className="flex gap-2 animate-in zoom-in-95">
                    <button 
                      onClick={downloadMinutes}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Minutes
                    </button>
                    <button 
                      onClick={downloadAudio}
                      className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Audio
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsFeedOpen(!isFeedOpen)}
                    className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--accent)] flex items-center gap-2 px-4 py-2"
                  >
                    {isFeedOpen ? 'Close Monitor' : 'Open Neural Feed'}
                    <svg className={`w-4 h-4 transition-transform ${isFeedOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                )}
             </div>
          </section>

          {/* SPEAKERS GRID */}
          <section>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-12 justify-items-center">
              <Avatar 
                user={{...currentUser, isMuted, handRaised: isHandRaised} as any} 
                size="lg" 
                onClick={onUserClick} 
              />
              {room.speakers.map(speaker => (
                <Avatar 
                  key={speaker.id} 
                  user={speaker} 
                  size="lg" 
                  onClick={onUserClick} 
                  volume={userVolumes[speaker.id] ?? 1}
                  onVolumeChange={onVolumeChange}
                />
              ))}
            </div>
          </section>

          {/* HUB AUDIENCE */}
          <section className="pb-40">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-10 text-center italic opacity-40">Stage Listeners</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-10 justify-items-center opacity-60">
              {[...Array(12)].map((_, i) => (
                <Avatar 
                  key={i} 
                  user={{ id: `l-${i}`, name: `Listener`, avatar: `https://picsum.photos/seed/lstn${i}/100`, role: UserRole.LISTENER, isMuted: true, handRaised: false }} 
                  size="sm" 
                  volume={userVolumes[`l-${i}`] ?? 1}
                  onVolumeChange={onVolumeChange}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 3. NEURAL DRAWER / STAGE MIXER */}
      <div className={`fixed bottom-0 left-0 right-0 z-[60] bg-[var(--bg-main)]/95 backdrop-blur-2xl rounded-t-[48px] shadow-[0_-30px_80px_rgba(0,0,0,0.2)] border-t border-[var(--glass-border)] transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isFeedOpen || isMixerOpen ? 'translate-y-0 h-[65vh]' : 'translate-y-full'}`}>
         <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[var(--accent)] animate-ping'}`} />
                  <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-main)] italic">
                    {isMixerOpen ? 'Central Audio Mixer' : isRecording ? 'Capturing Session...' : 'Neural Stream Monitor'}
                  </h4>
               </div>
               <button onClick={() => { setIsFeedOpen(false); setIsMixerOpen(false); }} className="p-3 hover:bg-[var(--bg-secondary)] rounded-full border border-[var(--glass-border)] transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-12 px-6">
               {isMixerOpen ? (
                 <div className="space-y-6 max-w-2xl mx-auto">
                    {room.speakers.length === 0 && (
                      <p className="text-center text-muted font-bold uppercase py-20 tracking-widest opacity-40">No guest speakers on stage</p>
                    )}
                    {room.speakers.map(speaker => (
                      <div key={speaker.id} className="bg-[var(--bg-secondary)] p-6 rounded-[32px] border border-[var(--glass-border)] flex items-center justify-between gap-8 group hover:border-[var(--accent)]/30 transition-all">
                        <div className="flex items-center gap-5 shrink-0">
                          <img src={speaker.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                          <div>
                            <h5 className="font-black text-[var(--text-main)] uppercase italic">{speaker.name}</h5>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active Speaker</p>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex justify-between items-center px-1">
                             <span className="text-[10px] font-black text-[var(--accent)]">{Math.round((userVolumes[speaker.id] ?? 1) * 100)}%</span>
                             <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Neural Level</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="1.5"
                            step="0.05"
                            value={userVolumes[speaker.id] ?? 1}
                            onChange={(e) => onVolumeChange(speaker.id, parseFloat(e.target.value))}
                            className="w-full h-3 bg-[var(--bg-main)] rounded-full appearance-none accent-[var(--accent)] cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <>
                   {transcriptions.length === 0 && (
                     <div className="py-32 text-center opacity-20">
                        <p className="text-sm font-black uppercase tracking-widest italic">Awaiting speech patterns to materialize...</p>
                     </div>
                   )}
                   {transcriptions.map((t, i) => (
                     <div key={i} className="animate-in slide-in-from-bottom-4 group">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 rounded-[14px] border border-[var(--accent)]/30 overflow-hidden shadow-sm">
                             <img src={`https://picsum.photos/seed/${t.userId}/100/100`} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--accent)] uppercase italic">{t.userName}</p>
                            <span className="text-[8px] text-slate-400 font-bold tabular-nums">{new Date(t.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="space-y-3 pl-14">
                          {/* Original Speech (Visible if Bilingual or not translated yet) */}
                          <p className={`text-base font-medium text-[var(--text-main)] leading-relaxed italic ${isBilingual ? 'opacity-50' : 'opacity-80'}`}>"{t.text}"</p>
                          
                          {/* Bilingual Enhancement Layer */}
                          {t.translation && (targetTranslationLang !== 'en' || isBilingual) && (
                            <div className="bg-[var(--accent)]/5 p-6 rounded-[28px] border border-[var(--accent)]/10 relative overflow-hidden group-hover:bg-[var(--accent)]/10 transition-all mt-2">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" />
                              <p className="text-[8px] font-black text-[var(--accent)] uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                                 Localized ({targetTranslationLang.toUpperCase()})
                              </p>
                              <p className="text-base font-bold text-[var(--text-main)] italic leading-relaxed">"{t.translation}"</p>
                            </div>
                          )}
                        </div>
                     </div>
                   ))}
                   <div ref={transcriptionEndRef} />
                 </>
               )}
            </div>
         </div>
      </div>

      {/* 4. FLOATING DOCK */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] w-full max-w-xl px-6">
        <div className="bg-[var(--bg-main)]/90 backdrop-blur-3xl rounded-full p-4 flex justify-between items-center shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-white/10 ring-1 ring-black/5">
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMediaOpen(true)} 
                className="p-5 bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] transition-all"
                title="Media Deck"
              >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              <button 
                onClick={() => isRecording ? stopRecording() : startRecording()} 
                className={`p-5 rounded-full transition-all relative overflow-hidden group ${isRecording ? 'bg-red-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500'}`}
                title="Stage Recorder"
              >
                 <svg className={`w-6 h-6 ${isRecording ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                 {isRecording && <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping" />}
              </button>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-7 rounded-full transition-all transform hover:scale-105 shadow-2xl ${isMuted ? 'bg-[var(--bg-secondary)] text-slate-400 border border-[var(--glass-border)]' : 'bg-[var(--accent)] text-white shadow-[var(--accent-glow)]'}`}
              >
                {isMuted ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a3 3 0 00-3 3v2a3 3 0 006 0V5a3 3 0 00-3-3zM5 8a1 1 0 011-1h1V5a3 3 0 116 0v2h1a1 1 0 110 2h-1v2a3 3 0 01-3 3v2h-2v-2a3 3 0 01-3-3V9H5a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M3.293 3.293a1 1 0 011.414 0L16.707 15.293a1 1 0 01-1.414 1.414l-12-12a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-8 h-8 animate-bounce" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H7a1 1 0 100 2h6a1 1 0 1010-2h-1.93z" clipRule="evenodd" /></svg>
                )}
              </button>

              <button 
                onClick={() => setIsHandRaised(!isHandRaised)}
                className={`p-7 rounded-full transition-all transform hover:scale-105 shadow-2xl ${isHandRaised ? 'bg-yellow-400 text-white shadow-yellow-200' : 'bg-[var(--bg-secondary)] text-slate-400 border border-[var(--glass-border)]'}`}
              >
                 <span className="text-3xl leading-none">✋</span>
              </button>
           </div>

           <div className="flex items-center gap-2">
              <button 
                onClick={() => { setIsMixerOpen(!isMixerOpen); setIsFeedOpen(false); }} 
                className={`p-5 rounded-full transition-all ${isMixerOpen ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--accent)]'}`}
                title="Stage Mixer"
              >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </button>
              <button onClick={() => setIsAnalyticsOpen(true)} className="p-5 bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" title="Analytics">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </button>
           </div>

        </div>
      </div>

      <MediaConsole 
        isOpen={isMediaOpen} 
        onClose={() => setIsMediaOpen(false)} 
        onUpdateMedia={setCurrentMedia} 
        roomTopic={room.title} 
        roomPoster={room.posterUrl} 
        transcriptionHistory={transcriptions.map(t => `${t.userName}: ${t.text}`)} 
        audioTracks={audioTracks} 
        onUpdateAudioTracks={setAudioTracks} 
        currentMedia={currentMedia} 
        canPostAds={isHost} 
      />
      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} roomId={room.id} roomTitle={room.title} senderId={currentUser.id} onSuccess={()=>{}} />
      <SocialShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomTitle={room.title} roomUrl={`https://echo-hub.app/rooms/${room.id}`} onShowToast={(msg) => console.log(msg)} />
      <LiveStreamConsole isOpen={isStreamConsoleOpen} onClose={() => setIsStreamConsoleOpen(false)} roomTitle={room.title} />
      <RoomAnalytics isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} roomId={room.id} roomTitle={room.title} speakerStats={{}} />
      <TranslationLangSelector isOpen={isLangSelectorOpen} onClose={() => setIsLangSelectorOpen(false)} selectedLang={targetTranslationLang} onSelect={(l) => { setTargetTranslationLang(l); sessionPromiseRef.current = null; }} />
      <RoomRecordingsModal isOpen={isRecordingsOpen} onClose={() => setIsRecordingsOpen(false)} roomTitle={room.title} />
      
      {isFinalizing && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in">
           <div className="w-20 h-20 border-8 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-10" />
           <div className="text-center space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-white italic animate-pulse">Archiving Session</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synthesizing Neural Transcripts into AI Minutes...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default LiveRoom;
