import express from 'express';
import { sessions } from './generate.js';
import { generatePanelPromptsParallel } from '../utils/promptBuilder.js';

const router = express.Router();

interface PromptsRequest {
  scenes: string[];
  styleGuide: string;
  style: string;
  sessionId?: string;
}

interface PromptsResponse {
  prompts: string[];
  success: boolean;
  message?: string;
}

/**
 * POST /api/prompts
 * Generate detailed image prompts for each scene
 */
router.post('/', async (req: express.Request<{}, PromptsResponse, PromptsRequest>, res: express.Response<PromptsResponse>) => {
  try {
    const { scenes, styleGuide, style, sessionId } = req.body;

    if (!scenes || !styleGuide || !style) {
      return res.status(400).json({
        prompts: [],
        success: false,
        message: 'Scenes, style guide, and style are required'
      });
    }

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({
        prompts: [],
        success: false,
        message: 'Scenes must be a non-empty array'
      });
    }

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
          prompts: [],
          success: false,
          message: 'Gemini API key not configured'
        });
      }

      const { initGeminiClient } = await import('../utils/gemini.js');
      client = initGeminiClient(apiKey);
    }

    // Generate prompts in parallel
    const prompts = await generatePanelPromptsParallel(
      client,
      scenes,
      styleGuide,
      style
    );

    // Update session with prompts if sessionId is provided
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.prompts = prompts;
        sessions.set(sessionId, session);
      }
    }

    res.json({
      prompts,
      success: true
    });
  } catch (error) {
    console.error('Error in prompts endpoint:', error);
    res.status(500).json({
      prompts: [],
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
