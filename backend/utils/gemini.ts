import { GoogleGenAI, Modality } from '@google/genai';

export interface GeminiClient {
  ai: GoogleGenAI;
  textModel: string;
  imageModel: string;
}

export function initGeminiClient(apiKey: string): GeminiClient {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid API key provided');
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });
    
    return {
      ai,
      textModel: 'gemini-2.0-flash',
      imageModel: 'gemini-2.0-flash-preview-image-generation'
    };
  } catch (error) {
    throw new Error(`❌ Failed to initialize Gemini client: ${error}`);
  }
}

export async function generateText(client: GeminiClient, prompt: string | string[]): Promise<string> {
  try {
    const promptText = Array.isArray(prompt) ? prompt.join('\n') : prompt;
    const response = await client.ai.models.generateContent({
      model: client.textModel,
      contents: promptText
    });
    
    return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Error generating text:', error);
    return '';
  }
}

export async function generateComicTitle(client: GeminiClient, story: string, style: string): Promise<string> {
  try {
    const prompt = `Generate a unique, catchy title for a comic book based on this story and style:

Story: ${story.substring(0, 500)}...
Style: ${style}

Requirements:
- Title should be 2-6 words maximum
- Should capture the essence of the story
- Should be unique and memorable
- No special characters or punctuation except hyphens
- Format: "Title Words Here"

Just return the title, nothing else.`;

    const response = await client.ai.models.generateContent({
      model: client.textModel,
      contents: prompt
    });
    
    const title = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Clean up the title - remove quotes and extra whitespace
    const cleanTitle = title.replace(/['"]/g, '').trim();
    
    // If no title generated, create a fallback
    if (!cleanTitle) {
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      return `Comic-${timestamp}`;
    }
    
    return cleanTitle;
  } catch (error) {
    console.error('Error generating comic title:', error);
    // Fallback title with timestamp
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
    return `Comic-${timestamp}`;
  }
}

export async function generateImage(client: GeminiClient, prompt: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
    });

    const responsePromise = client.ai.models.generateContent({
      model: client.imageModel,
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE]
      }
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    // Look for image data in the response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate && candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return {
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png'
            };
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}
