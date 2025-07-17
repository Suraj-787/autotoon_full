import express from 'express';
import { initGeminiClient } from '../utils/gemini.js';
import { generateStyleGuide } from '../utils/promptBuilder.js';

const router = express.Router();

interface StyleGuideRequest {
  story: string;
  style: string;
}

interface StyleGuideResponse {
  styleGuide: string;
  success: boolean;
  message?: string;
}

/**
 * POST /api/style-guide
 * Generate a style guide for the comic
 */
router.post('/', async (req: express.Request<{}, StyleGuideResponse, StyleGuideRequest>, res: express.Response<StyleGuideResponse>) => {
  try {
    const { story, style } = req.body;

    if (!story || !style) {
      return res.status(400).json({
        styleGuide: '',
        success: false,
        message: 'Story and style are required'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        styleGuide: '',
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    // Initialize Gemini client
    const client = initGeminiClient(apiKey);

    // Generate style guide
    const styleGuide = await generateStyleGuide(client, story, style);

    res.json({
      styleGuide,
      success: true
    });
  } catch (error) {
    console.error('Error in style-guide endpoint:', error);
    res.status(500).json({
      styleGuide: '',
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
