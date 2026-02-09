
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Tools for Abena AI co-host to drive app interactivity.
 */
export const appControlTools: FunctionDeclaration[] = [
  {
    name: 'navigate_to',
    parameters: {
      type: Type.OBJECT,
      description: 'Navigate to specific application sections or tabs.',
      properties: {
        tab: { 
          type: Type.STRING, 
          description: 'The target tab ID. Options: "rooms" (Discovery), "feed" (The Pulse), "schedule" (Timeline), "groups" (Tribes), "creator" (Creator Hub), "calls" (Connect).' 
        },
      },
      required: ['tab'],
    },
  },
  {
    name: 'toggle_mute',
    parameters: {
      type: Type.OBJECT,
      description: 'Toggle the user\'s microphone status.',
      properties: {},
    }
  },
  {
    name: 'launch_creation_portal',
    parameters: { type: Type.OBJECT, description: 'Open the Viral Launchpad for room creation.', properties: {} },
  }
];

/**
 * Transcribes audio using Gemini 3 Flash for speed and accuracy.
 */
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
          { text: "Transcribe this audio strictly verbatim. Do not summarize." },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription Error:", error);
    return "";
  }
};

/**
 * Real-time translation logic using Gemini Native Audio.
 */
export const translateAudioStream = async (base64Audio: string, targetLang: string, voice: string = 'Puck'): Promise<{ text: string, audio: string }> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/pcm;rate=16000', data: base64Audio } },
          { text: `Transcribe audio and translate into ${targetLang}. Return JSON format with "transcription" and "translation" fields.` }
        ],
      },
      config: { responseMimeType: 'application/json' }
    });
    
    const data = JSON.parse(response.text || '{}');
    
    const ttsResponse: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: data.translation }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
      }
    });

    return {
      text: data.translation,
      audio: ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || ''
    };
  } catch (error) {
    console.error("Translation Stream Error:", error);
    throw error;
  }
};

/**
 * Previews an AI voice using Gemini TTS.
 */
export const previewVoice = async (voiceName: string, text: string = "Welcome to Chat-Chap! I am Abena, your AI co-host."): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    console.error("Voice Preview Error:", error);
    return "";
  }
};

/**
 * Summarizes the stage session into structured minutes using Gemini 3 Flash.
 */
export const generateMeetingMinutes = async (title: string, transcriptions: string[]): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Synthesize professional meeting minutes for: "${title}". Transcript: ${transcriptions.join('\n')}. Include Key Takeaways and Action Items.`,
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Minutes Error:", error);
    return "Error generating minutes.";
  }
};

/**
 * Generates catchy room identity using Gemini 3 Flash.
 */
export const generateRoomIdeas = async (baseTopic: string): Promise<any> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Brainstorm a catchy social audio room title/desc for: "${baseTopic}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'intense', 'controversial'] }
        },
        required: ["title", "description", "tags", "sentiment"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

/**
 * Creates dynamic slide content for the projection view.
 */
export const generateSlideContent = async (topic: string, transcriptions: string[]): Promise<any> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze room topic "${topic}" and transcript "${transcriptions.slice(-10).join('\n')}". Generate visual slide data.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["title", "content", "imagePrompt"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Slide Content Error:", error);
    return { title: topic, content: "Continuing...", imagePrompt: topic };
  }
};

/**
 * Crafts viral marketing copy for external distribution.
 */
export const generatePromoContent = async (data: { title: string, description: string }): Promise<any> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create viral social media copy for a room titled "${data.title}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            twitter: { type: Type.STRING },
            instagram: { type: Type.STRING },
            whatsapp: { type: Type.STRING },
            linkedin: { type: Type.STRING }
          },
          required: ["twitter", "instagram", "whatsapp", "linkedin"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Promo Content Error:", error);
    return { twitter: "", instagram: "", whatsapp: "", linkedin: "" };
  }
};

/**
 * Optimizes a scheduled event's details.
 */
export const optimizeScheduleDetails = async (title: string, description: string): Promise<any> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Refine this event for social growth: Title: "${title}", Desc: "${description}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "tags"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Schedule Optimization Error:", error);
    return { title, description, tags: [] };
  }
};

// Fix for missing member generateAdPoster
/**
 * Generates a promotional image for a room using Gemini 2.5 Flash Image.
 */
export const generateAdPoster = async (title: string, description: string): Promise<string | null> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Create a cinematic, professional promotional poster for a social audio room. Title: "${title}". Context: "${description}". The style should be modern, sleek, and high-tech.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Poster Generation Error:", error);
    return null;
  }
};

// Fix for missing member generateVoiceTeaser
/**
 * Generates a voice teaser audio clip using Gemini 2.5 Flash TTS.
 */
export const generateVoiceTeaser = async (title: string, description: string): Promise<string | null> => {
  try {
    const prompt = `Create a short, high-energy 10-second audio teaser for a social audio room titled "${title}". Use an enthusiastic tone. Description: ${description}. The voice should invite people to join now.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Voice Teaser Error:", error);
    return null;
  }
};
