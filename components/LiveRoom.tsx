
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
import ChatPanel from './ChatPanel';
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [isParticipantsSidebarOpen, setIsParticipantsSidebarOpen] = useState(false);
  
  const [reactions, setReactions] = useState<Reaction[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [lastSessionRecord, setLastSessionRecord] = useState<PodcastRecord | null>(null);

  const [audioTracks, setAudioTracks] = useState<PlaylistTrack[]>([]);
  const [targetTranslationLang, setTargetTranslationLang] = useState<Locale>(currentUser.nativeLanguage || locale);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);

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

  const globalMusicRef = useRef<HTMLAudioElement | null>(null);
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

  const stopAllAudio = () => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const handleUpdateMediaGlobal = async (media: MediaState) => {
    if (!isHost) return;
    await StorageService.updateRoomFirebase(room.id, { activeMedia: media });
  };

  const handleUpdateAudioGlobal = async (audio: Room['activeAudio']) => {
    if (!isHost) return;
    await StorageService.updateRoomFirebase(room.id, { activeAudio: audio });
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
            if (message.serverContent?.turnComplete) {
              if (accumulatedInputRef.current) {
                const newEntry: TranscriptionEntry = {
                  userId: currentUser.id,
                  userName: currentUser.name,
                  text: accumulatedInputRef.current,
                  timestamp: Date.now()
                };
                setTranscriptions(prev => [...prev.slice(-100), newEntry]);
              }
              accumulatedInputRef.current = '';
              accumulatedOutputRef.current = '';
              setInterimTranscription('');
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
    <div className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col sm:flex-row overflow-hidden animate-in fade-in duration-500">
      <audio ref={globalMusicRef} className="hidden" />
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full aurora-mesh" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <nav className="relative z-20 px-4 sm:px-6 py-4 flex justify-between items-center bg-[var(--bg-main)]/60 backdrop-blur-3xl border-b border-[var(--glass-border)]">
          <button onClick={onExit} className="flex items-center gap-1.5 text-[var(--text-main)] hover:opacity-60 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest italic hidden sm:inline">Hallway</span>
          </button>
          
          <div className="flex flex-col items-center">
            {isRecording && (
              <div className="flex items-center gap-2 mb-1 px-3 py-1 bg-red-600/10 rounded-full border border-red-600/20">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest tabular-nums">{formatDuration(recordingDuration)}</span>
              </div>
            )}
            <h1 className="text-[10px] sm:text-[11px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] italic max-w-[150px] sm:max-w-[220px] truncate text-center leading-tight">
              {room.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 rounded-xl transition-all ${isChatOpen ? 'bg-accent text-white shadow-lg' : 'hover:bg-white/10 text-main'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L5 21V5a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3z" /></svg>
             </button>
             {isHost && (
               <button onClick={handleEndSession} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors" title="End Session">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               </button>
             )}
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-main)]">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 py-6 sm:py-8 px-4 sm:px-6">
            
            {room.activePoll && (
              <section className="animate-in slide-in-from-top-6 duration-700">
                 <div className="bg-gradient-to-br from-accent to-indigo-700 p-6 sm:p-10 rounded-[40px] sm:rounded-[50px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                       <p className="text-xl font-black mb-8 italic leading-tight">"{room.activePoll.question}"</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {room.activePoll.options.map(opt => {
                             const percentage = room.activePoll!.totalVotes > 0 ? Math.round((opt.votes / room.activePoll!.totalVotes) * 100) : 0;
                             return (
                               <button 
                                  key={opt.id} 
                                  onClick={() => {
                                    if (userVotedOptionId) return;
                                    const updatedPoll = { ...room.activePoll! };
                                    updatedPoll.options = updatedPoll.options.map(o => o.id === opt.id ? { ...o, votes: o.votes + 1 } : o);
                                    updatedPoll.totalVotes += 1;
                                    setUserVotedOptionId(opt.id);
                                    StorageService.updateRoomFirebase(room.id, { activePoll: updatedPoll });
                                  }} 
                                  className={`relative h-16 sm:h-20 rounded-[20px] sm:rounded-[28px] overflow-hidden transition-all border-2 ${userVotedOptionId === opt.id ? 'border-white ring-4 ring-white/10' : 'border-white/10'}`}
                               >
                                  <div className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-1000" style={{ width: `${percentage}%` }} />
                                  <div className="absolute inset-0 flex justify-between items-center px-6 sm:px-8">
                                     <span className="text-xs sm:text-sm font-black uppercase tracking-widest">{opt.text}</span>
                                     <span className="text-sm sm:text-lg font-black tabular-nums">{percentage}%</span>
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
              <ProjectionView media={room.activeMedia || null} room={room} />
              
              <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                 {reactions.map(r => (
                   <div key={r.id} className="absolute bottom-0 text-5xl animate-reaction opacity-0" style={{ left: `${r.x}%` }}>{r.emoji}</div>
                 ))}
              </div>

              {interimTranscription && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 sm:px-10 z-30 animate-in slide-in-from-bottom-6 duration-300">
                  <div className="bg-white/90 backdrop-blur-2xl rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-2xl border border-white/50 text-slate-900 text-center">
                     <p className="text-lg sm:text-2xl font-black italic tracking-tight leading-snug">"{interimTranscription}"</p>
                  </div>
                </div>
              )}
            </section>

            <section className="animate-in fade-in duration-1000">
              <h3 className="text-[9px] font-black text-accent uppercase tracking-[0.5em] mb-8 text-center flex items-center justify-center gap-4">
                 <span className="w-8 sm:w-12 h-0.5 bg-accent/20" /> Stage Voices <span className="w-8 sm:w-12 h-0.5 bg-accent/20" />
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-12 sm:gap-y-16 justify-items-center">
                <Avatar user={{...currentUser, isMuted, handRaised: isHandRaised, role: isHost ? UserRole.HOST : currentUser.role} as any} size="lg" onClick={onUserClick} />
                {room.speakers.map(speaker => (
                  <Avatar key={speaker.id} user={speaker} size="lg" onClick={onUserClick} volume={userVolumes[speaker.id] ?? 1} onVolumeChange={onVolumeChange} />
                ))}
              </div>
            </section>

            <section className="pb-48">
              <h3 className="text-[9px] font-black text-muted uppercase tracking-[0.5em] mb-10 text-center opacity-40 italic flex items-center justify-center gap-4">
                 <span className="w-6 sm:w-8 h-px bg-white/5" /> Gallery Listeners <span className="w-6 sm:w-8 h-px bg-white/5" />
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-y-10 sm:gap-y-12 justify-items-center px-4">
                {room.listeners.map((listener) => (
                  <Avatar key={listener.id} user={listener} size="sm" onClick={() => onUserClick(listener)} />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Reaction Picker Overlay */}
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[70] flex gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8">
           {['🔥', '👏', '❤️', '🤯', '😂'].map(emoji => (
             <button key={emoji} onClick={() => emitReaction(emoji)} className="text-xl sm:text-2xl hover:scale-150 active:scale-90 transition-transform p-1">{emoji}</button>
           ))}
        </div>

        {/* Floating Controls */}
        <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-[80] w-full max-w-[95%] sm:max-w-2xl px-4 sm:px-6">
          <div className="bg-secondary/80 backdrop-blur-3xl rounded-[32px] sm:rounded-[48px] p-3 sm:p-5 flex justify-between items-center shadow-2xl border border-white/10">
             <div className="flex items-center gap-1.5 sm:gap-3">
                <button onClick={() => setIsMediaOpen(true)} className="p-3 sm:p-5 bg-main rounded-[18px] sm:rounded-[24px] text-muted hover:text-accent border border-white/5">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
             </div>
             
             <div className="flex items-center gap-3 sm:gap-6">
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className={`p-6 sm:p-9 rounded-[28px] sm:rounded-[36px] shadow-2xl transition-all active:scale-95 flex items-center justify-center ${isMuted ? 'bg-main border border-white/10' : 'bg-accent text-white ring-8 ring-accent/10 scale-105'}`}
                >
                  <span className="text-2xl sm:text-4xl leading-none">{isMuted ? '🔇' : '🎙️'}</span>
                </button>
                <button 
                  onClick={() => setIsHandRaised(!isHandRaised)} 
                  className={`p-6 sm:p-9 rounded-[28px] sm:rounded-[36px] shadow-2xl transition-all active:scale-95 flex items-center justify-center ${isHandRaised ? 'bg-yellow-400 text-white ring-8 ring-yellow-400/10 scale-105' : 'bg-main border border-white/10'}`}
                >
                  <span className="text-2xl sm:text-4xl leading-none">✋</span>
                </button>
             </div>

             <div className="flex items-center gap-1.5 sm:gap-3">
                <button onClick={onExit} className="p-3 sm:p-5 bg-red-600/10 text-red-500 rounded-[18px] sm:rounded-[24px] border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Persistent Desktop Chat or Overlay Mobile Chat */}
      <ChatPanel roomId={room.id} currentUser={currentUser} isOpen={isChatOpen} onToggle={() => setIsChatOpen(false)} />

      <MediaConsole 
        isOpen={isMediaOpen} onClose={() => setIsMediaOpen(false)} 
        onUpdateMedia={handleUpdateMediaGlobal} onUpdateAudio={handleUpdateAudioGlobal}
        roomTopic={room.title} roomPoster={room.posterUrl} 
        transcriptionHistory={transcriptions.map(t => `${t.userName}: ${t.text}`)} 
        audioTracks={audioTracks} onUpdateAudioTracks={setAudioTracks} 
        currentMedia={room.activeMedia || { type: 'none' }} canPostAds={isHost} 
      />
      <TranslationLangSelector isOpen={isLangSelectorOpen} onClose={() => setIsLangSelectorOpen(false)} selectedLang={targetTranslationLang} onSelect={setTargetTranslationLang} />
      <SocialShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} roomTitle={room.title} roomUrl={`https://echohub.app/rooms/${room.id}`} onShowToast={() => {}} />
      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} roomId={room.id} roomTitle={room.title} senderId={currentUser.id} onSuccess={()=>{}} />
      <RoomAnalytics isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} roomId={room.id} roomTitle={room.title} speakerStats={{}} />
      <AttendanceModal isOpen={isAttendanceOpen} onClose={() => setIsAttendanceOpen(false)} roomId={room.id} roomTitle={room.title} />
      <PollModal isOpen={isPollModalOpen} onClose={() => setIsPollModalOpen(false)} onCreate={(p) => StorageService.updateRoomFirebase(room.id, { activePoll: p })} creatorId={currentUser.id} />

      <style>{`
        @keyframes reaction {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(-20vh) scale(1.2); }
          100% { transform: translateY(-80vh) scale(1); opacity: 0; }
        }
        .animate-reaction { animation: reaction 4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LiveRoom;
