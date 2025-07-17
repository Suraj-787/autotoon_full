/**
 * Auto-Toon Backend API Client
 * 
 * This file provides a complete TypeScript API client for the Auto-Toon backend.
 * Copy this to your Next.js frontend's lib/api.ts file.
 */

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Data Types
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
export interface GenerateRequest {
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

// API Client Class
export class AutoToonAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // System endpoints
  async getHealthCheck() {
    return this.request<{ status: string; message: string; timestamp: string; version: string }>('/health');
  }

  async getAPIStatus() {
    return this.request<{
      status: string;
      message: string;
      timestamp: string;
      geminiConfigured: boolean;
      endpoints: Array<{ path: string; method: string; description: string }>;
      version: string;
    }>('/api/status');
  }

  // Core generation endpoints
  async generateComic(request: GenerateRequest): Promise<GenerateResponse> {
    return this.request<GenerateResponse>('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getScenes(request: ScenesRequest): Promise<ScenesResponse> {
    return this.request<ScenesResponse>('/api/scenes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateStyleGuide(story: string, style: string): Promise<{ styleGuide: string; success: boolean }> {
    return this.request('/api/style-guide', {
      method: 'POST',
      body: JSON.stringify({ story, style }),
    });
  }

  async generatePrompts(request: PromptsRequest): Promise<PromptsResponse> {
    return this.request<PromptsResponse>('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateImages(request: ImagesRequest): Promise<ImagesResponse> {
    return this.request<ImagesResponse>('/api/images', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getGeneratedImages(): Promise<ImagesResponse> {
    return this.request<ImagesResponse>('/api/images/generated');
  }

  // Export endpoints
  async exportComicPDF(sessionId?: string, dpi: number = 100): Promise<Blob> {
    const url = `${this.baseURL}/api/export`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, dpi }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to export PDF');
    }

    return response.blob();
  }

  async getExistingPDF(): Promise<Blob> {
    const url = `${this.baseURL}/api/export`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No PDF available');
    }

    return response.blob();
  }

  async getPDFInfo(): Promise<{
    available: boolean;
    size?: number;
    createdAt?: string;
    modifiedAt?: string;
    message?: string;
  }> {
    return this.request('/api/export/info');
  }

  // Library management
  async getLibrary(): Promise<LibraryResponse> {
    return this.request<LibraryResponse>('/api/library');
  }

  async saveComic(request: SaveComicRequest): Promise<{ comic: LibraryItem; success: boolean; message?: string }> {
    return this.request('/api/library', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getComic(id: string): Promise<{ comic: LibraryItem; success: boolean }> {
    return this.request(`/api/library/${id}`);
  }

  async updateComic(id: string, updates: Partial<LibraryItem>): Promise<{ comic: LibraryItem; success: boolean }> {
    return this.request(`/api/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteComic(id: string): Promise<{ success: boolean; message?: string }> {
    return this.request(`/api/library/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings management
  async getSettings(): Promise<SettingsResponse> {
    return this.request<SettingsResponse>('/api/settings');
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<SettingsResponse> {
    return this.request<SettingsResponse>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async resetSettings(): Promise<SettingsResponse> {
    return this.request<SettingsResponse>('/api/settings/reset', {
      method: 'POST',
    });
  }

  async getComicStyles(): Promise<StylesResponse> {
    return this.request<StylesResponse>('/api/settings/styles');
  }

  // Session management
  async getSession(sessionId: string): Promise<{
    sessionId: string;
    story: string;
    style: string;
    scenes: string[];
    styleGuide: string;
    success: boolean;
  }> {
    return this.request(`/api/generate/session/${sessionId}`);
  }

  // Utility methods
  getImageURL(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${this.baseURL}${imagePath}`;
  }

  async downloadPDF(sessionId?: string, filename: string = 'comic.pdf'): Promise<void> {
    try {
      const blob = await this.exportComicPDF(sessionId);
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
  }
}

// Default API instance
export const api = new AutoToonAPI();

// Convenience functions
export const generateComic = (request: GenerateRequest) => api.generateComic(request);
export const getScenes = (request: ScenesRequest) => api.getScenes(request);
export const generateStyleGuide = (story: string, style: string) => api.generateStyleGuide(story, style);
export const generatePrompts = (request: PromptsRequest) => api.generatePrompts(request);
export const generateImages = (request: ImagesRequest) => api.generateImages(request);
export const exportComic = (sessionId?: string) => api.exportComicPDF(sessionId);
export const getLibrary = () => api.getLibrary();
export const saveComic = (request: SaveComicRequest) => api.saveComic(request);
export const getSettings = () => api.getSettings();
export const updateSettings = (settings: Partial<AppSettings>) => api.updateSettings(settings);
export const getComicStyles = () => api.getComicStyles();

export default api;
