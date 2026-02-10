
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Room, User, UserRole, TranscriptionEntry, MediaState, PlaylistTrack, Locale, PodcastRecord, Poll } from '../types';
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
import PollModal from './PollModal';
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
  onUpdateRoom?: (room: Room) => void;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ room, onExit, onUserClick, userVolumes, onVolumeChange, currentUser, onUpdateRoom }) => {
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
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [isParticipantsSidebarOpen, setIsParticipantsSidebarOpen] = useState(false);
  
  const [reactions, setReactions] = useState<Reaction[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [lastSessionRecord, setLastSessionRecord] = useState<PodcastRecord | null>(null);

  const [currentMedia, setCurrentMedia] = useState<MediaState>({ type: 'none' });
  const [audioTracks, setAudioTracks] = useState<PlaylistTrack[]>([]);
  const [targetTranslationLang, setTargetTranslationLang] = useState<Locale>(currentUser.nativeLanguage || locale);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);

  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const accumulatedInputRef = useRef('');
  const accumulatedOutputRef = useRef('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const isHost = currentUser.id === 'me' || currentUser.role === UserRole.HOST;

  // Real-time synchronization
  useEffect(() => {
    StorageService.recordJoin(room.id, { id: currentUser.id, name: currentUser.name });
    setIsFollowing(StorageService.isFollowingRoom(currentUser.id, room.id));
    
    const unsubscribe = StorageService.subscribeToLiveRooms((rooms) => {
      const current = rooms.find(r => r.id === room.id);
      if (current && onUpdateRoom) {
         onUpdateRoom(current);
      }
    });

    return () => {
      unsubscribe();
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(s => s.close());
      }
      stopAllAudio();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [room.id, currentUser.id, currentUser.name]);

  // Sync local user status (Hand Raise/Mute) to Firebase
  useEffect(() => {
    const syncStatus = async () => {
       const updatedSpeakers = room.speakers.map(s => 
         s.id === currentUser.id ? { ...s, isMuted, handRaised: isHandRaised } : s
       );
       const updatedListeners = room.listeners.map(l => 
         l.id === currentUser.id ? { ...l, isMuted, handRaised: isHandRaised } : l
       );
       await StorageService.updateRoomFirebase(room.id, { 
         speakers: updatedSpeakers, 
         listeners: updatedListeners 
       });
    };
    syncStatus();
  }, [isMuted, isHandRaised, room.id]);

  const stopAllAudio = () => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const handleEndSession = async () => {
    if (window.confirm("End this session for everyone? The Hub will be archived.")) {
      await StorageService.closeRoomFirebase(room.id);
      onExit();
    }
  };

  const emitReaction = (emoji: string) => {
    const reaction: Reaction = {
      id: Math.random().toString(),
      emoji,
      x: Math.random() * 80 + 10 
    };
    setReactions(prev => [...prev, reaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 4000);
  };

  const handleCreatePoll = (poll: Poll) => {
    StorageService.updateRoomFirebase(room.id, { activePoll: poll });
    setIsPollModalOpen(false);
  };

  const handleVote = (optionId: string) => {
    if (userVotedOptionId || !room.activePoll) return;

    const updatedPoll = { ...room.activePoll };
    updatedPoll.options = updatedPoll.options.map(o => 
      o.id === optionId ? { ...o, votes: o.votes + 1 } : o
    );
    updatedPoll.totalVotes += 1;

    setUserVotedOptionId(optionId);
    StorageService.updateRoomFirebase(room.id, { activePoll: updatedPoll });
  };

  const handleEndPoll = () => {
    if (!room.activePoll) return;
    StorageService.updateRoomFirebase(room.id, { activePoll: undefined });
    setUserVotedOptionId(null);
  };

  const startLiveEngine = async () => {
    if (sessionPromiseRef.current) return;
    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = aiInstance.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (isMuted) return;
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
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
              accumulatedInputRef.current += message.serverContent.inputTranscription.text;
              setInterimTranscription(accumulatedInputRef.current);
            }
            if (message.serverContent?.modelTurn) {
              const base64Audio = message.serverContent.modelTurn.parts[0]?.inlineData?.data;
              if (base64Audio) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                audioSourcesRef.current.add(source);
              }
            }
            if (message.serverContent?.outputTranscription) {
              accumulatedOutputRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              if (accumulatedInputRef.current) {
                const newEntry: TranscriptionEntry = {
                  userId: currentUser.id,
                  userName: currentUser.name,
                  text: accumulatedInputRef.current,
                  translation: accumulatedOutputRef.current || undefined,
                  timestamp: Date.now()
                };
                setTranscriptions(prev => [...prev.slice(-100), newEntry]);
              }
              accumulatedInputRef.current = '';
              accumulatedOutputRef.current = '';
              setInterimTranscription('');
            }
            if (message.serverContent?.interrupted) {
              stopAllAudio();
            }
          },
          onerror: (e) => console.error("Neural Failure:", e),
          onclose: () => {
            sessionPromiseRef.current = null;
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `Simultaneous interpreter mode. Target: ${targetTranslationLang.toUpperCase()}. Keep translations concise.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Engine Start Error:", err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!isMuted && !sessionPromiseRef.current) startLiveEngine();
    if (isMuted && sessionPromiseRef.current) {
        sessionPromiseRef.current.then(s => s.close());
        sessionPromiseRef.current = null;
    }
  }, [isMuted]);

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
          const transcriptText = transcriptions.map(t => `${t.userName}: ${t.text}`).join('\n');
          const minutes = transcriptText ? await generateMeetingMinutes(room.title, [transcriptText]) : "Quiet session recorded.";
          
          const newRecord: PodcastRecord = {
            id: `podcast-${Date.now()}`,
            roomId: room.id,
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
        } catch (err) {
          console.error("Finalization failed", err);
        } finally {
          setIsFinalizing(false);
          setRecordingDuration(0);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      recordingTimerRef.current = window.setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } catch (err) { console.error("Rec failed", err); }
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

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full aurora-mesh" />
      </div>

      <nav className="relative z-20 px-6 py-4 flex justify-between items-center bg-[var(--bg-main)]/60 backdrop-blur-3xl border-b border-[var(--glass-border)]">
        <button onClick={onExit} className="flex items-center gap-1.5 text-[var(--text-main)] hover:opacity-60 transition-opacity">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest italic">Hallway</span>
        </button>
        
        <div className="flex flex-col items-center">
          {isRecording && (
            <div className="flex items-center gap-2 mb-1 px-3 py-1 bg-red-600/10 rounded-full border border-red-600/20">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-red-500 uppercase tracking-widest tabular-nums">{formatDuration(recordingDuration)}</span>
            </div>
          )}
          <h1 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] italic max-w-[220px] truncate text-center leading-tight">
            {room.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
           {isHost && (
             <button onClick={handleEndSession} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors" title="End Session">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </button>
           )}
           <button onClick={() => setIsParticipantsSidebarOpen(true)} className="text-[var(--text-main)] p-2 hover:bg-white/10 rounded-xl transition-colors relative">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
             </svg>
             <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white rounded-full flex items-center justify-center text-[7px] font-black">{room.participantCount}</span>
           </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-main)] relative z-10">
        <div className="max-w-4xl mx-auto space-y-12 py-8 px-6">
          {room.activePoll && (
            <section className="animate-in slide-in-from-top-6 duration-700">
               <div className="bg-gradient-to-br from-accent to-indigo-700 p-10 rounded-[50px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10">
                     <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[24px] flex items-center justify-center text-3xl shadow-xl">📊</div>
                           <div>
                              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Hub Consensus</h3>
                              <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.4em]">{room.activePoll.totalVotes} PULSES RECORDED</p>
                           </div>
                        </div>
                        {isHost && <button onClick={handleEndPoll} className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">Terminate</button>}
                     </div>
                     <p className="text-2xl font-black mb-10 italic leading-tight">"{room.activePoll.question}"</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {room.activePoll.options.map(opt => {
                           const percentage = room.activePoll!.totalVotes > 0 ? Math.round((opt.votes / room.activePoll!.totalVotes) * 100) : 0;
                           const isSelected = userVotedOptionId === opt.id;
                           return (
                             <button key={opt.id} onClick={() => handleVote(opt.id)} disabled={!!userVotedOptionId} className={`relative h-20 rounded-[28px] overflow-hidden transition-all border-2 ${isSelected ? 'border-white ring-8 ring-white/10' : 'border-white/10 hover:bg-white/5'}`}>
                                <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isSelected ? 'bg-white/25' : 'bg-white/10'}`} style={{ width: `${percentage}%` }} />
                                <div className="absolute inset-0 flex justify-between items-center px-8">
                                   <span className="text-sm font-black uppercase tracking-widest">{opt.text}</span>
                                   <span className="text-lg font-black tabular-nums">{percentage}%</span>
                                </div>
                             </button>
                           );
                        })}
                     </div>
                  </div>
               </div>
            </section>
          )}

          <section className="relative">
            <ProjectionView media={currentMedia} room={room} />
            
            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
               {reactions.map(r => (
                 <div 
                  key={r.id} 
                  className="absolute bottom-0 text-5xl animate-reaction opacity-0"
                  style={{ left: `${r.x}%` }}
                 >
                   {r.emoji}
                 </div>
               ))}
            </div>

            {interimTranscription && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-10 z-30 animate-in slide-in-from-bottom-6 duration-300">
                <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-indigo-50/20 ring-1 ring-white/50 text-slate-900">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                      <span className="text-[8px] font-black text-accent uppercase tracking-widest">Real-time Echo</span>
                   </div>
                   <p className="text-2xl font-black italic tracking-tight leading-snug">"{interimTranscription}"</p>
                </div>
              </div>
            )}
          </section>

          <section className="bg-secondary/40 rounded-[40px] p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl border border-[var(--glass-border)] gap-6 backdrop-blur-md">
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                   <p className="text-[9px] font-black text-muted uppercase tracking-[0.4em] mb-1">Target AI dialect</p>
                   <button onClick={() => setIsLangSelectorOpen(true)} className="flex items-center gap-3 bg-accent/10 px-5 py-2.5 rounded-2xl transition-all hover:bg-accent/20 text-xs font-black text-accent uppercase tracking-widest border border-accent/20">
                     <span className="text-lg">🌐</span>
                     {targetTranslationLang.toUpperCase()}
                   </button>
                </div>
                <div className="w-px h-10 bg-white/5" />
                <div className="flex flex-col">
                   <p className="text-[9px] font-black text-muted uppercase tracking-[0.4em] mb-1">Global Reach</p>
                   <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-main tabular-nums">{room.participantCount}</span>
                      <span className="text-[8px] font-black text-green-500 uppercase">Live Nodes</span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <div className="flex bg-main/50 rounded-2xl p-1.5 border border-white/5">
                  <button onClick={() => setIsFeedOpen(!isFeedOpen)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFeedOpen ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-white'}`}>
                    The Feed
                  </button>
                  <button onClick={() => setIsAnalyticsOpen(true)} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-white transition-all">
                    Insights
                  </button>
                </div>
                {isHost && (
                  <button onClick={() => setIsPollModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
                    Launch Poll
                  </button>
                )}
             </div>
          </section>

          <section className="animate-in fade-in duration-1000">
            <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.5em] mb-10 text-center flex items-center justify-center gap-4">
               <span className="w-12 h-0.5 bg-accent/20" /> Stage Voices <span className="w-12 h-0.5 bg-accent/20" />
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-16 justify-items-center">
              <Avatar user={{...currentUser, isMuted, handRaised: isHandRaised, role: isHost ? UserRole.HOST : currentUser.role} as any} size="lg" onClick={onUserClick} />
              {room.speakers.map(speaker => (
                <Avatar key={speaker.id} user={speaker} size="lg" onClick={onUserClick} volume={userVolumes[speaker.id] ?? 1} onVolumeChange={onVolumeChange} />
              ))}
            </div>
          </section>

          <section className="pb-48">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.5em] mb-12 text-center opacity-40 italic flex items-center justify-center gap-4">
               <span className="w-8 h-px bg-white/5" /> Gallery Listeners <span className="w-8 h-px bg-white/5" />
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-y-12 justify-items-center">
              {room.listeners.map((listener) => (
                <Avatar key={listener.id} user={listener} size="sm" onClick={() => onUserClick(listener)} />
              ))}
              {room.listeners.length === 0 && (
                <div className="col-span-full py-10 opacity-20 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">Gallery empty • Syncing nodes...</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[70] flex gap-3 p-3 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
         {['🔥', '👏', '❤️', '🤯', '😂'].map(emoji => (
           <button 
            key={emoji} 
            onClick={() => emitReaction(emoji)}
            className="text-2xl hover:scale-150 active:scale-90 transition-transform p-1"
           >
             {emoji}
           </button>
         ))}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] w-full max-w-2xl px-6">
        <div className="bg-secondary/80 backdrop-blur-3xl rounded-[48px] p-5 flex justify-between items-center shadow-[0_32px_96px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMediaOpen(true)} className="p-5 bg-main rounded-[24px] text-[var(--text-muted)] hover:text-accent transition-all shadow-sm border border-white/5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              {isHost && (
                <button onClick={() => isRecording ? stopRecording() : startRecording()} className={`p-5 rounded-[24px] transition-all border border-white/5 shadow-sm ${isRecording ? 'bg-red-600 text-white' : 'bg-main text-red-500'}`}>
                  <svg className={`w-6 h-6 ${isRecording ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>
                </button>
              )}
           </div>
           
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className={`p-9 rounded-[36px] shadow-2xl transition-all active:scale-95 flex items-center justify-center ${isMuted ? 'bg-main border border-white/10' : 'bg-accent text-white shadow-accent/20 ring-8 ring-accent/10 scale-105'}`}
              >
                <span className="text-4xl leading-none">{isMuted ? '🔇' : '🎙️'}</span>
              </button>
              <button 
                onClick={() => setIsHandRaised(!isHandRaised)} 
                className={`p-9 rounded-[36px] shadow-2xl transition-all active:scale-95 flex items-center justify-center ${isHandRaised ? 'bg-yellow-400 text-white shadow-yellow-500/20 ring-8 ring-yellow-400/10 scale-105' : 'bg-main border border-white/10'}`}
              >
                <span className="text-4xl leading-none">✋</span>
              </button>
           </div>

           <div className="flex items-center gap-3">
              <button onClick={() => setIsMixerOpen(!isMixerOpen)} className={`p-5 rounded-[24px] border border-white/5 transition-all shadow-sm ${isMixerOpen ? 'bg-accent text-white' : 'bg-main text-muted'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100 4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </button>
              <button onClick={onExit} className="p-5 bg-red-600/10 text-red-500 rounded-[24px] border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>
      </div>

      {isParticipantsSidebarOpen && (
        <div className="fixed inset-0 z-[500] flex justify-end animate-in fade-in duration-300" onClick={() => setIsParticipantsSidebarOpen(false)}>
           <div 
            className="w-full max-w-md bg-secondary h-full shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-500"
            onClick={e => e.stopPropagation()}
           >
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-secondary/80 backdrop-blur-md shrink-0">
                 <div>
                    <h2 className="text-3xl font-black text-main uppercase tracking-tighter italic">Room Hub</h2>
                    <p className="text-[10px] text-muted font-black uppercase tracking-[0.4em] mt-1">{room.participantCount} active nodes</p>
                 </div>
                 <button onClick={() => setIsParticipantsSidebarOpen(false)} className="p-4 bg-white/5 rounded-full text-muted hover:text-white transition-all">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
                 <section>
                    <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                       <span className="w-4 h-1 bg-accent rounded-full" /> Stage (Speakers)
                    </h3>
                    <div className="space-y-4">
                       <div onClick={() => onUserClick(currentUser)} className="p-5 bg-white/5 rounded-[32px] border border-accent/20 flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-5">
                             <img src={currentUser.avatar} className="w-14 h-14 rounded-[40%] object-cover border-2 border-accent" alt="" />
                             <div>
                                <p className="text-sm font-black text-white uppercase tracking-tight italic">{currentUser.name} (You)</p>
                                <p className="text-[9px] text-accent font-bold uppercase tracking-widest">{isHost ? 'Session Host' : 'Speaker Node'}</p>
                             </div>
                          </div>
                          {!isMuted && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                       </div>
                       {room.speakers.map(s => (
                         <div key={s.id} onClick={() => onUserClick(s)} className="p-5 bg-white/5 rounded-[32px] border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-5">
                               <img src={s.avatar} className="w-14 h-14 rounded-[40%] object-cover border-2 border-white/10 group-hover:border-accent" alt="" />
                               <div>
                                  <p className="text-sm font-black text-white uppercase tracking-tight italic">{s.name}</p>
                                  <p className="text-[9px] text-muted font-bold uppercase tracking-widest">{s.role.replace('_', ' ')}</p>
                               </div>
                            </div>
                            {s.handRaised && <span className="text-xl">✋</span>}
                         </div>
                       ))}
                    </div>
                 </section>

                 <section>
                    <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                       <span className="w-4 h-1 bg-white/20 rounded-full" /> The Gallery (Listeners)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                       {room.listeners.map(l => (
                         <div key={l.id} onClick={() => onUserClick(l)} className="p-4 bg-white/5 rounded-[24px] border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-4">
                               <img src={l.avatar} className="w-10 h-10 rounded-[40%] object-cover" alt="" />
                               <p className="text-xs font-bold text-main uppercase tracking-tight">{l.name}</p>
                            </div>
                            {l.handRaised && <span className="text-lg">✋</span>}
                         </div>
                       ))}
                    </div>
                 </section>
              </div>

              <div className="p-10 border-t border-white/5 bg-secondary shrink-0">
                 <button onClick={() => setIsShareOpen(true)} className="w-full py-6 bg-accent text-white rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-accent/20 hover:scale-105 transition-all">
                    Expand Tribal Reach
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Existing Modals */}
      <PollModal isOpen={isPollModalOpen} onClose={() => setIsPollModalOpen(false)} onCreate={handleCreatePoll} creatorId={currentUser.id} />
      <MediaConsole isOpen={isMediaOpen} onClose={() => setIsMediaOpen(false)} onUpdateMedia={setCurrentMedia} roomTopic={room.title} roomPoster={room.posterUrl} transcriptionHistory={transcriptions.map(t => `${t.userName}: ${t.text}`)} audioTracks={audioTracks} onUpdateAudioTracks={setAudioTracks} currentMedia={currentMedia} canPostAds={isHost} />
      <TranslationLangSelector isOpen={isLangSelectorOpen} onClose={() => setIsLangSelectorOpen(false)} selectedLang={targetTranslationLang} onSelect={setTargetTranslationLang} />
      <SocialShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomTitle={room.title} roomUrl={`https://echohub.app/rooms/${room.id}`} onShowToast={() => {}} />
      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} roomId={room.id} roomTitle={room.title} senderId={currentUser.id} onSuccess={()=>{}} />
      <LiveStreamConsole isOpen={isStreamConsoleOpen} onClose={() => setIsStreamConsoleOpen(false)} roomTitle={room.title} />
      <RoomAnalytics isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} roomId={room.id} roomTitle={room.title} speakerStats={{}} />
      <AttendanceModal isOpen={isAttendanceOpen} onClose={() => setIsAttendanceOpen(false)} roomId={room.id} roomTitle={room.title} />

      {isFinalizing && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center">
           <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-10" />
           <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-white italic animate-pulse">Neural Mastering...</h2>
        </div>
      )}

      {showSessionReport && lastSessionRecord && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-500" onClick={() => setShowSessionReport(false)}>
           <div className="w-full max-w-4xl bg-secondary rounded-[64px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="p-12 bg-gradient-to-br from-indigo-700 via-accent to-indigo-900 text-white shrink-0 flex justify-between items-center">
                 <div><h2 className="text-5xl font-black uppercase tracking-tighter italic">Archive Secure</h2><p className="text-[10px] font-bold uppercase tracking-[0.8em] opacity-60">EchoHub Neural Vault</p></div>
                 <button onClick={() => setShowSessionReport(false)} className="p-5 bg-black/30 rounded-full hover:bg-black/50 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-main/20">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <h3 className="text-[14px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-3"><span className="w-8 h-0.5 bg-indigo-500" />Master Summary</h3>
                       <div className="bg-main/50 p-10 rounded-[48px] border border-white/5 shadow-inner min-h-[300px] italic leading-relaxed text-xl text-main whitespace-pre-wrap">{lastSessionRecord.minutes}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes reaction {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(-20vh) scale(1.2); }
          100% { transform: translateY(-80vh) scale(1); opacity: 0; }
        }
        .animate-reaction {
          animation: reaction 4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LiveRoom;
