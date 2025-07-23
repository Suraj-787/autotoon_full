import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import middleware
import { apiLimiter, generationLimiter, imageLimiter, libraryLimiter } from './middleware/rateLimiter.js';

// Import routes
import generateRoutes from './routes/generate.js';
import scenesRoutes from './routes/scenes.js';
import styleGuideRoutes from './routes/style-guide.js';
import promptsRoutes from './routes/prompts.js';
import imagesRoutes from './routes/images.js';
import exportRoutes from './routes/export.js';
import libraryRoutes from './routes/library.js';
import settingsRoutes from './routes/settings.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', // Next.js default port
    'http://localhost:3001', // Backend port
    'http://localhost:3002', // Next.js alternate port
    'http://127.0.0.1:3000', // IPv4 frontend
    'http://127.0.0.1:3001', // IPv4 backend
    'http://127.0.0.1:3002', // IPv4 frontend alternate
    'https://autotoon-full.vercel.app', // Production frontend
    'https://autotoon-full-*.vercel.app' // Preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Timeout']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for generated images
app.use('/images', express.static(path.join(__dirname, 'generated')));

// Static file serving for library PDFs
app.use('/library/pdfs', express.static(path.join(__dirname, 'library', 'pdfs')));

// Apply rate limiting
app.use('/api', apiLimiter);

// API Routes with specific rate limiting
app.use('/api/generate', generationLimiter, generateRoutes);
app.use('/api/scenes', scenesRoutes);
app.use('/api/style-guide', generationLimiter, styleGuideRoutes);
app.use('/api/prompts', generationLimiter, promptsRoutes);
app.use('/api/images', imageLimiter, imagesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/library', libraryLimiter, libraryRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Auto-Toon Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req: express.Request, res: express.Response) => {
  const endpoints = [
    { path: '/api/generate', method: 'POST', description: 'Initialize comic generation' },
    { path: '/api/scenes', method: 'POST', description: 'Split story into scenes' },
    { path: '/api/style-guide', method: 'POST', description: 'Generate style guide' },
    { path: '/api/prompts', method: 'POST', description: 'Generate panel prompts' },
    { path: '/api/images', method: 'POST', description: 'Generate comic images' },
    { path: '/api/export', method: 'GET', description: 'Export comic as PDF' },
    { path: '/api/library', method: 'GET', description: 'Get saved comics' },
    { path: '/api/library', method: 'POST', description: 'Save comic to library' },
    { path: '/api/settings', method: 'GET', description: 'Get app settings' },
    { path: '/api/settings', method: 'POST', description: 'Update app settings' },
    { path: '/api/settings/styles', method: 'GET', description: 'Get available styles' }
  ];

  res.json({
    status: 'OK',
    message: 'Auto-Toon API is ready',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    endpoints,
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Auto-Toon Backend server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

export default app;
