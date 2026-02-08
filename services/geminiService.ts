
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to call Gemini with exponential backoff for 429 errors.
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
    if (isRateLimit && retries > 0) {
      console.warn(`Gemini Rate Limit hit. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generates professional meeting minutes from a room transcription.
 */
export const generateMeetingMinutes = async (title: string, transcript: string[]): Promise<string> => {
  const prompt = `You are a professional executive secretary for VOICE SOCIAL. 
  Generate meeting minutes for "${title}". 
  Transcript: ${transcript.join('\n')}`;

  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.3 }
    }));
    return response.text || "Failed to generate minutes.";
  } catch (error) {
    console.error("Minutes Generation Error:", error);
    return "Error synthesizing transcript data into minutes.";
  }
};

/**
 * Summarizes the ongoing discussion and suggests 3 new topics.
 */
export const analyzeDiscussion = async (transcriptionHistory: string[]): Promise<{ summary: string; suggestions: string[] }> => {
  const prompt = `Analyze history for VOICE SOCIAL: ${transcriptionHistory.join('\n')}`;

  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "suggestions"]
        }
      }
    }));
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { summary: "Conversation is ongoing...", suggestions: ["Discuss global trends", "Share local insights"] };
  }
};

/**
 * AI Co-host: Responds to specific user questions.
 */
export const askAiCoHost = async (query: string, transcriptionHistory: string[]): Promise<string> => {
  const prompt = `You are VOICE SOCIAL AI. User says: "${query}" Context: ${transcriptionHistory.slice(-10).join('\n')}`;
  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { temperature: 0.7, maxOutputTokens: 150 }
    }));
    return response.text || "I'm processing that...";
  } catch (error) {
    return "I'm momentarily disconnected from the Hub.";
  }
};

/**
 * Generates slide content based on discussion topic.
 */
export const generateSlideContent = async (topic: string, transcriptionHistory: string[]): Promise<{ title: string; content: string; imagePrompt: string }> => {
  const prompt = `Slide for VOICE SOCIAL. Topic: "${topic}" Context: ${transcriptionHistory.slice(-5).join('\n')}`;
  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
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
    }));
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { title: "Insight Session", content: "• Dialog in progress", imagePrompt: "Abstract waves" };
  }
};

/**
 * Real-time translation with retry logic for rate limits.
 */
export const translateTranscription = async (text: string, targetLanguage: string): Promise<string> => {
  if (!targetLanguage || targetLanguage === 'Original') return text;
  const prompt = `Translate to ${targetLanguage}: "${text}"`;
  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { maxOutputTokens: 100, temperature: 0.1 }
    }));
    return response.text || text;
  } catch (error) {
    console.error("Translation Quota hit, returning original text.");
    return text;
  }
};

/**
 * Generates audio for a translated text using Gemini TTS with backoff.
 */
export const generateVoiceTranslation = async (text: string, language: string, voiceName: string = 'Zephyr'): Promise<string | null> => {
  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `In ${language}, say: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }));
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Quota hit.");
    return null;
  }
};

/**
 * Teaser generation.
 */
export const generateVoiceTeaser = async (title: string, description: string): Promise<string | null> => {
  const prompt = `Energetic invite for VOICE SOCIAL: "${title}".`;
  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      },
    }));
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    return null;
  }
};

export const generateRoomIdeas = async (baseTopic: string): Promise<{ title: string; description: string; tags: string[] }> => {
  const prompt = `Catchy VOICE SOCIAL room: "${baseTopic}".`;
  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
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
    }));
    return JSON.parse(response.text || '{}');
  } catch (err) {
    return { title: `Chat about ${baseTopic}`, description: `Joining the conversation on ${baseTopic}.`, tags: [baseTopic] };
  }
};

export const generatePromoContent = async (roomData: { title: string; description: string }): Promise<{ twitter: string; instagram: string; whatsapp: string; linkedin: string }> => {
  const prompt = `Promos for VOICE SOCIAL: "${roomData.title}".`;
  try {
    // Explicitly type the response to fix "unknown" error
    const response: GenerateContentResponse = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
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
    }));
    return JSON.parse(response.text || '{}');
  } catch (err) {
    return { twitter: '', instagram: '', whatsapp: '', linkedin: '' };
  }
};

export const generateAdPoster = async (title: string, description: string): Promise<string | null> => {
  const prompt = `Minimalist visual poster for VOICE SOCIAL: "${title}".`;
  try {
    // Explicitly type the response to ensure proper candidates access
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    // Iterate through parts to find the image part as recommended
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};
