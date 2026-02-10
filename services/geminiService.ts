
import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Tools for Assistant AI to drive app interactivity.
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
          description: 'The target tab ID. Options: "rooms", "feed", "schedule", "groups", "creator", "calls".' 
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
 * Transcribes audio using Gemini 3 Flash.
 */
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
          { text: "Transcribe this audio strictly verbatim." },
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
 * Summarizes the stage session into structured minutes.
 */
export const generateMeetingMinutes = async (title: string, transcriptions: string[]): Promise<string> => {
  try {
    if (transcriptions.length === 0) return "No conversation data was captured during this session.";
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Title: "${title}". Transcript: ${transcriptions.join('\n')}. Synthesize a professional summary with key takeaways.`,
    });
    return response.text || "Summary analysis complete but returned empty.";
  } catch (error) {
    console.error("Minutes Error:", error);
    return "The AI was unable to synthesize minutes for this session due to a technical error.";
  }
};

/**
 * Generates catchy room identity.
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
      contents: `Analyze room topic "${topic}" and generate a visual slide content.`,
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
    return { title: topic, content: "Continuing the discussion...", imagePrompt: topic };
  }
};

/**
 * Crafts viral marketing copy.
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
    return { twitter: "", instagram: "", whatsapp: "", linkedin: "" };
  }
};

/**
 * Generates a promotional image for a room.
 */
export const generateAdPoster = async (title: string, description: string): Promise<string | null> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A professional, cinematic promotional poster for a social audio room about "${title}". ${description}. Sleek typography, minimalist style.` }
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
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Poster Generation Error:", error);
    return null;
  }
};

/**
 * Generates a voice teaser audio clip.
 * FIX: Simplified prompt to avoid 500 errors from complex TTS instructions.
 */
export const generateVoiceTeaser = async (title: string, description: string): Promise<string | null> => {
  try {
    // Simplify spoken text to avoid internal synthesis errors
    const spokenText = `Hello! Join us live right now on Chat Chap to discuss ${title.substring(0, 50)}. It is going to be an amazing conversation!`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: spokenText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is often more stable for longer strings
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

// Fix: Added missing previewVoice function for testing voices
/**
 * Previews an AI voice by generating a short clip.
 */
export const previewVoice = async (voiceName: string): Promise<string | null> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'This is a preview of the Chat-Chap neural voice layer.' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Voice Preview Error:", error);
    return null;
  }
};

/**
 * Refines schedule details.
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
    return { title, description, tags: [] };
  }
};
