
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { useLocale } from './LocaleContext';
import { appControlTools } from '../services/geminiService';
import { decode, decodeAudioData, createBlob } from '../services/audioUtils';

interface VoiceAssistantProps {
  onNavigate: (tab: any) => void;
  onMuteToggle: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onNavigate, onMuteToggle }) => {
  const { locale, selectedVoice, isBilingual } = useLocale();
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscribed, setLastTranscribed] = useState('');
  const [isAbenaTalking, setIsAbenaTalking] = useState(false);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopAllAudio = () => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startAssistant = async () => {
    if (isActive) return;
    setIsActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (!isListening) return;
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsAbenaTalking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsAbenaTalking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              stopAllAudio();
              setIsAbenaTalking(false);
            }

            if (message.serverContent?.inputTranscription) {
              setLastTranscribed(message.serverContent.inputTranscription.text);
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let result = "ok";
                if (fc.name === 'navigate_to') {
                  const args = fc.args as { tab?: string };
                  const target = (args.tab || '').toLowerCase();
                  if (target.includes('room') || target.includes('discover') || target.includes('hallway')) onNavigate('rooms');
                  else if (target.includes('feed') || target.includes('pulse')) onNavigate('feed');
                  else if (target.includes('schedule') || target.includes('timeline')) onNavigate('schedule');
                  else if (target.includes('group') || target.includes('tribe')) onNavigate('groups');
                  else if (target.includes('creator') || target.includes('hub')) onNavigate('creator');
                  else if (target.includes('call') || target.includes('connect')) onNavigate('calls');
                } else if (fc.name === 'toggle_mute') {
                  onMuteToggle();
                }
                
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result } }
                  });
                });
              }
            }
          },
          onerror: (e) => console.error("Echo Assistant Interface Error:", e),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          tools: [{ functionDeclarations: appControlTools }],
          systemInstruction: `You are the Echo Assistant for EchoHub, a premium social audio platform.
            Your role is to act as a bilingual concierge and voice navigator.
            
            NAVIGATION:
            - "hallway" or "discovery" maps to 'rooms'.
            - "tribes" maps to 'groups'.
            - "the pulse" maps to 'feed'.
            - "the vault" maps to 'creator'.
            
            TONE:
            - Current Locale: ${locale.toUpperCase()}.
            - Professional, sleek, and high-fidelity.
            - Bilingual Mode is ${isBilingual ? 'ON - provide translations where helpful.' : 'OFF'}.
            - Keep responses concise for audio delivery.`,
          inputAudioTranscription: {},
        }
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Failure in Echo Assistant Initialization:", err);
      setIsActive(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      sessionPromiseRef.current?.then(s => s.close());
      sessionPromiseRef.current = null;
      setIsActive(false);
      if (isListening) startAssistant();
    }
  }, [selectedVoice, isBilingual]);

  const toggleListening = () => {
    if (!isActive) startAssistant();
    setIsListening(!isListening);
  };

  return (
    <div className="fixed bottom-32 left-8 z-[500] flex flex-col items-start gap-4 pointer-events-none">
       {(lastTranscribed || isAbenaTalking) && (
         <div className="bg-[var(--bg-secondary)]/95 backdrop-blur-xl px-6 py-4 rounded-[32px] border border-[var(--glass-border)] shadow-2xl animate-in slide-in-from-left duration-300 ring-4 ring-accent/5">
            <div className="flex items-center gap-2 mb-1.5">
               <div className={`w-2 h-2 rounded-full ${isAbenaTalking ? 'bg-green-500 animate-pulse' : 'bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]'}`} />
               <p className="text-[10px] font-black text-accent uppercase tracking-widest italic">
                Echo Assistant ({selectedVoice})
               </p>
            </div>
            <p className="text-sm font-bold text-[var(--text-main)] italic leading-tight">
              {isAbenaTalking ? 'Processing...' : lastTranscribed ? `"${lastTranscribed}"` : 'Listening...'}
            </p>
         </div>
       )}
       
       <button onClick={toggleListening} className={`pointer-events-auto p-6 rounded-[28px] shadow-[0_24px_48px_rgba(0,0,0,0.2)] transition-all active:scale-90 group relative overflow-hidden ${isListening ? 'bg-accent text-white scale-110 shadow-[0_0_40px_var(--accent-glow)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-accent border border-[var(--glass-border)]'}`}>
         <div className="relative z-10">
           <svg className={`w-8 h-8 ${isAbenaTalking ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
         </div>
         {isListening && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
       </button>
    </div>
  );
};

export default VoiceAssistant;
