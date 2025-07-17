/**
 * Auto-Toon Backend API Types
 * TypeScript definitions for the API responses
 * 
 * Note: This backend generates visual-only comic panels without embedded text.
 * All image generation focuses on pure visual storytelling elements.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GenerateResponse extends ApiResponse {
  sessionId: string;
  scenes: string[];
  styleGuide: string;
}

export interface ScenesResponse extends ApiResponse {
  scenes: string[];
}

export interface StyleGuideResponse extends ApiResponse {
  styleGuide: string;
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

export interface ComicStyle {
  id: string;
  name: string;
  description: string;
}

export interface GenerateRequest {
  story: string;
  style: string;
  sessionId?: string;
}

export interface ScenesRequest {
  story: string;
  maxWordsPerScene?: number;
}

export interface StyleGuideRequest {
  story: string;
  style: string;
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

export interface ExportRequest {
  sessionId?: string;
  dpi?: number;
}
