import express from 'express';
import { sessions } from './generate.js';
import { generateComicPanelsParallel } from '../utils/imageGen.js';

const router = express.Router();

interface ImagesRequest {
  prompts: string[];
  sessionId?: string;
}

interface ImagesResponse {
  images: string[];
  success: boolean;
  message?: string;
}

/**
 * POST /api/images
 * Generate comic panel images from prompts
 */
router.post('/', async (req: express.Request<{}, ImagesResponse, ImagesRequest>, res: express.Response<ImagesResponse>) => {
  try {
    const { prompts, sessionId } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({
        images: [],
        success: false,
        message: 'Prompts must be a non-empty array'
      });
    }

    // Log the start of image generation with count
    console.log(`🎬 Starting image generation for ${prompts.length} panels...`);
    
    // Send keep-alive headers for long-running requests
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=600'); // 10 minutes
    
    // Try to get client from session if sessionId is provided
    let client = null;
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        client = session.client;
      }
    }

    // If no client from session, create a new one
    if (!client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          images: [],
          success: false,
          message: 'Gemini API key not configured'
        });
      }

      const { initGeminiClient } = await import('../utils/gemini.js');
      client = initGeminiClient(apiKey);
    }

    // Generate images in parallel
    const imagePaths = await generateComicPanelsParallel(client, prompts);

    // Convert absolute paths to relative paths for client
    const relativeImagePaths = imagePaths.map(absolutePath => {
      const filename = absolutePath.split('/').pop() || '';
      return `/images/${filename}`;
    });

    // Update session with image paths if sessionId is provided
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.imagePaths = imagePaths;
        session.relativeImagePaths = relativeImagePaths;
        sessions.set(sessionId, session);
      }
    }

    res.json({
      images: relativeImagePaths,
      success: true
    });
  } catch (error) {
    console.error('Error in images endpoint:', error);
    res.status(500).json({
      images: [],
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/images/generated
 * Get list of all generated images
 */
router.get('/generated', async (req: express.Request, res: express.Response) => {
  try {
    const { getGeneratedImagePaths } = await import('../utils/imageGen.js');
    const imagePaths = await getGeneratedImagePaths();
    
    // Convert to relative paths for client
    const relativeImagePaths = imagePaths.map(path => {
      const filename = path.split('/').pop() || '';
      return `/images/${filename}`;
    });

    res.json({
      images: relativeImagePaths,
      success: true
    });
  } catch (error) {
    console.error('Error getting generated images:', error);
    res.status(500).json({
      images: [],
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
