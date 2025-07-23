"use client"

import axios from "axios"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001"

// Export for use in other components
export { API_BASE_URL }

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10 minutes timeout for image generation
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to ensure timeout is always set
api.interceptors.request.use((config) => {
  // Ensure long timeout for image generation endpoints
  if (config.url?.includes('/api/images')) {
    if (!config.timeout || config.timeout < 600000) {
      console.log(`[API] Setting timeout for ${config.url} to 10 minutes`);
      config.timeout = 600000; // 10 minutes
    }
  }
  console.log(`[API] Request config for ${config.url}: timeout=${config.timeout}ms`);
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to log timing information
api.interceptors.response.use((response) => {
  console.log(`[API] Response received for ${response.config.url} (status: ${response.status})`);
  return response;
}, (error) => {
  if (error.code === 'ECONNABORTED') {
    console.error(`[API] Request to ${error.config?.url} timed out after ${error.config?.timeout}ms`);
  }
  return Promise.reject(error);
});

// Backend API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ComicStyle {
  id: string;
  name: string;
  description: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  story: string;
  style: string;
  scenes: string[];
  styleGuide: string;
  prompts?: string[];
  images?: string[];
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface AppSettings {
  defaultStyle: string;
  highResMode: boolean;
  maxConcurrency: number;
  defaultWordsPerScene: number;
  autoSave: boolean;
  darkMode: boolean;
  language: string;
  exportQuality: string;
  notifications: boolean;
  updatedAt: string;
}

// Generation Response Types (updated for backend compatibility)
export interface GenerateResponse extends ApiResponse {
  sessionId: string;
  scenes: string[];
  styleGuide: string;
}

export interface ScenesResponse extends ApiResponse {
  scenes: string[];
}

export interface PromptsResponse extends ApiResponse {
  prompts: string[];
}

export interface ImagesResponse extends ApiResponse {
  images: string[];
}

export interface LibraryResponse extends ApiResponse {
  comics: LibraryItem[];
}

export interface SettingsResponse extends ApiResponse {
  settings: AppSettings;
}

export interface StylesResponse extends ApiResponse {
  styles: ComicStyle[];
}

// Request Types
export interface GenerationRequest {
  story: string;
  style: string;
  sessionId?: string;
}

export interface ScenesRequest {
  story: string;
  maxWordsPerScene?: number;
}

export interface PromptsRequest {
  scenes: string[];
  styleGuide: string;
  style: string;
  sessionId?: string;
}

export interface ImagesRequest {
  prompts: string[];
  sessionId?: string;
}

export interface SaveComicRequest {
  title: string;
  story: string;
  style: string;
  scenes: string[];
  styleGuide: string;
  prompts?: string[];
  images?: string[];
  sessionId?: string;
}

// Legacy types for frontend compatibility
export interface GenerationResponse {
  id: string;
  status: "processing" | "completed" | "failed";
  message: string;
}

export interface GenerationData {
  id?: string;
  sessionId?: string;
  story: string;
  style: string;
  timestamp: number;
  scenes?: string[];
  styleGuide?: string;
  prompts?: string[];
  images?: string[];
}

export interface Scene {
  id: string;
  text: string;
  order: number;
}

export interface StyleGuide {
  colors: string[];
  characters: string[];
  mood: string;
  style: string;
}

export interface PanelPrompt {
  id: string;
  text: string;
  panelNumber: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  panelNumber: number;
  prompt: string;
}

// API Functions - Updated for backend compatibility
export const generateComic = async (request: GenerationRequest): Promise<GenerateResponse> => {
  try {
    const response = await api.post("/api/generate", request);
    return response.data;
  } catch (error) {
    console.error("Generate comic error:", error);
    throw error;
  }
};

export const generateCompleteComic = async (request: GenerationRequest): Promise<{
  sessionId: string;
  scenes: string[];
  styleGuide: string;
  prompts: string[];
  images: string[];
}> => {
  try {
    // Step 1: Generate scenes and style guide
    const generateResponse = await generateComic(request);
    const { sessionId, scenes, styleGuide } = generateResponse;
    
    // Step 2: Generate prompts
    const promptsResponse = await api.post("/api/prompts", {
      scenes,
      styleGuide,
      style: request.style,
      sessionId
    });
    const prompts = promptsResponse.data.prompts || [];
    
    // Step 3: Generate images (with extended timeout and retry logic)
    console.log(`[API] Starting image generation for ${prompts.length} prompts with sessionId: ${sessionId}`);
    const imageTimeoutMs = 600000; // 10 minutes timeout
    
    let imagesResponse: any;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`[API] Image generation attempt ${retryCount + 1}/${maxRetries + 1}`);
        imagesResponse = await api.post("/api/images", {
          prompts,
          sessionId
        }, {
          timeout: imageTimeoutMs,
          headers: {
            'X-Request-Timeout': imageTimeoutMs.toString()
          }
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        console.error(`[API] Image generation attempt ${retryCount + 1} failed:`, error.message);
        
        if (retryCount === maxRetries) {
          // Last retry failed, throw the error
          throw error;
        }
        
        // Check if it's a network error that might benefit from retry
        if (error.message?.includes('Network Error') || error.code === 'ECONNABORTED') {
          console.log(`[API] Retrying image generation in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        } else {
          // Don't retry for other types of errors
          throw error;
        }
      }
    }
    
    const images = imagesResponse?.data?.images || [];
    console.log(`[API] Image generation completed successfully. Generated ${images.length} images.`);
    
    return {
      sessionId,
      scenes,
      styleGuide,
      prompts,
      images
    };
  } catch (error: any) {
    console.error("Complete comic generation error:", error);
    
    // Handle specific error types
    if (error.message?.includes('Network Error')) {
      console.error("Network connection failed. Please check if the backend server is running on port 3001.");
      throw new Error("Unable to connect to the backend server. Please check your connection and try again.");
    }
    
    // Handle specific timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error("Complete comic generation timed out after 10 minutes");
      throw new Error("Comic generation timed out. Please try again with fewer panels or check your connection.");
    }
    
    throw error;
  }
};

export const getScenes = async (story: string, maxWordsPerScene?: number): Promise<Scene[]> => {
  try {
    const response = await api.post("/api/scenes", { story, maxWordsPerScene });
    const scenes = response.data.scenes || [];
    
    // Convert backend format to frontend format
    return scenes.map((text: string, index: number) => ({
      id: `scene_${index}`,
      text,
      order: index + 1
    }));
  } catch (error) {
    console.error("Get scenes error:", error);
    // Mock response for demo
    return [
      { id: "1", text: "Luna the fox discovers the glowing crystal", order: 1 },
      { id: "2", text: "The crystal pulses with magical energy", order: 2 },
      { id: "3", text: "Luna's transformation begins", order: 3 },
      { id: "4", text: "The forest responds to the magic", order: 4 },
    ];
  }
};

export const getStyleGuide = async (story: string, style: string): Promise<StyleGuide> => {
  try {
    const response = await api.post("/api/style-guide", { story, style });
    const styleGuide = response.data.styleGuide || "";
    
    // Parse the style guide text into structured format
    return {
      colors: ["#FF6B35", "#F7931E", "#FFD23F", "#06FFA5", "#118AB2"],
      characters: ["Main character", "Supporting characters", "Environment elements"],
      mood: "Determined from style guide",
      style: style,
    };
  } catch (error) {
    console.error("Get style guide error:", error);
    // Mock response for demo
    return {
      colors: ["#FF6B35", "#F7931E", "#FFD23F", "#06FFA5", "#118AB2"],
      characters: ["Luna - Orange fox with green eyes", "Ancient Oak Tree", "Magical Crystal"],
      mood: "Mystical and adventurous",
      style: "2d-flat",
    };
  }
};

export const getPrompts = async (scenes: string[], styleGuide: string, style: string, sessionId?: string): Promise<PanelPrompt[]> => {
  try {
    const response = await api.post("/api/prompts", { scenes, styleGuide, style, sessionId });
    const prompts = response.data.prompts || [];
    
    // Convert backend format to frontend format
    return prompts.map((text: string, index: number) => ({
      id: `prompt_${index}`,
      text,
      panelNumber: index + 1
    }));
  } catch (error) {
    console.error("Get prompts error:", error);
    // Mock response for demo
    return [
      {
        id: "1",
        text: "A brave young fox with bright orange fur and sparkling green eyes standing in a magical forest",
        panelNumber: 1,
      },
      {
        id: "2",
        text: "Close-up of a mysterious glowing crystal hidden beneath an ancient oak tree",
        panelNumber: 2,
      },
      {
        id: "3",
        text: "The fox touching the crystal as it pulses with magical energy, creating sparkles around them",
        panelNumber: 3,
      },
      {
        id: "4",
        text: "Wide shot of the magical forest responding to the crystal's power with glowing plants and floating lights",
        panelNumber: 4,
      },
    ];
  }
};

export const getImages = async (prompts: string[], sessionId?: string): Promise<GeneratedImage[]> => {
  try {
    console.log(`[API] Starting image generation for ${prompts.length} prompts with sessionId: ${sessionId}`);
    const imageTimeoutMs = 600000; // 10 minutes timeout
    const response = await api.post("/api/images", { prompts, sessionId }, {
      timeout: imageTimeoutMs,
      headers: {
        'X-Request-Timeout': imageTimeoutMs.toString()
      }
    });
    const images = response.data.images || [];
    console.log(`[API] Image generation completed successfully. Generated ${images.length} images.`);
    
    // Convert backend format to frontend format
    return images.map((imagePath: string, index: number) => ({
      id: `image_${index}`,
      url: getImageURL(imagePath),
      panelNumber: index + 1,
      prompt: prompts[index] || "Generated image"
    }));
  } catch (error: any) {
    console.error("Get images error:", error);
    
    // Handle specific timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error("Request timed out after 10 minutes");
      throw new Error("Image generation timed out. Please try again with fewer panels or check your connection.");
    }
    
    // Re-throw the original error for other types of errors
    throw error;
    // Mock response for demo
    return [
      {
        id: "1",
        url: "/placeholder.svg?height=300&width=400",
        panelNumber: 1,
        prompt: "A brave young fox with bright orange fur and sparkling green eyes standing in a magical forest",
      },
      {
        id: "2",
        url: "/placeholder.svg?height=300&width=400",
        panelNumber: 2,
        prompt: "Close-up of a mysterious glowing crystal hidden beneath an ancient oak tree",
      },
      {
        id: "3",
        url: "/placeholder.svg?height=300&width=400",
        panelNumber: 3,
        prompt: "The fox touching the crystal as it pulses with magical energy, creating sparkles around them",
      },
      {
        id: "4",
        url: "/placeholder.svg?height=300&width=400",
        panelNumber: 4,
        prompt:
          "Wide shot of the magical forest responding to the crystal's power with glowing plants and floating lights",
      },
    ];
  }
};

export const exportComic = async (sessionId?: string): Promise<Blob> => {
  try {
    const response = await api.post("/api/export", { sessionId }, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Export comic error:", error);
    throw error;
  }
};

// New backend API functions
export const getLibrary = async (): Promise<LibraryItem[]> => {
  try {
    const response = await api.get("/api/library");
    console.log('🔗 API response:', response.data);
    return response.data.comics || [];
  } catch (error) {
    console.error("Get library error:", error);
    return [];
  }
};

export const saveComic = async (request: SaveComicRequest): Promise<LibraryItem> => {
  try {
    const response = await api.post("/api/library", request);
    return response.data.comic;
  } catch (error) {
    console.error("Save comic error:", error);
    throw error;
  }
};

export const deleteComic = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/library/${id}`);
  } catch (error) {
    console.error("Delete comic error:", error);
    throw error;
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const response = await api.get("/api/settings");
    return response.data.settings;
  } catch (error) {
    console.error("Get settings error:", error);
    throw error;
  }
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<AppSettings> => {
  try {
    const response = await api.post("/api/settings", settings);
    return response.data.settings;
  } catch (error) {
    console.error("Update settings error:", error);
    throw error;
  }
};

export const getComicStyles = async (): Promise<ComicStyle[]> => {
  try {
    const response = await api.get("/api/settings/styles");
    return response.data.styles || [];
  } catch (error) {
    console.error("Get comic styles error:", error);
    // Return default styles
    return [
      { id: "manga", name: "Manga", description: "Japanese comic style" },
      { id: "cartoon", name: "Cartoon", description: "Colorful cartoon style" },
      { id: "superhero", name: "Superhero", description: "Dynamic superhero style" },
      { id: "realistic", name: "Realistic", description: "Photorealistic style" },
    ];
  }
};

// Utility functions
export const getImageURL = (imagePath: string): string => {
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath}`;
};

export const downloadPDF = async (sessionId?: string, filename: string = 'comic.pdf'): Promise<void> => {
  try {
    const blob = await exportComic(sessionId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
};

// Utility function to check API health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get("/health");
    return true;
  } catch (error) {
    console.warn("API health check failed:", error);
    return false;
  }
};

// Legacy compatibility function
export const generateComicLegacy = async (request: GenerationRequest): Promise<GenerationResponse> => {
  try {
    const result = await generateComic(request);
    return {
      id: result.sessionId,
      status: "completed",
      message: "Comic generation completed successfully"
    };
  } catch (error) {
    return {
      id: `gen_${Date.now()}`,
      status: "failed",
      message: "Comic generation failed"
    };
  }
};
