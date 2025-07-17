import express from 'express';
import { initGeminiClient } from '../utils/gemini.js';
import { splitStoryIntoScenes } from '../utils/sceneSplitter.js';
import { generateStyleGuide } from '../utils/promptBuilder.js';
import { validateRequest, ValidationRules } from '../middleware/validation.js';

const router = express.Router();

// In-memory session storage (replace with Redis or database in production)
const sessions = new Map();

interface GenerateRequest {
  story: string;
  style: string;
  sessionId?: string;
}

interface GenerateResponse {
  sessionId: string;
  scenes: string[];
  styleGuide: string;
  success: boolean;
  message?: string;
}

/**
 * POST /api/generate
 * Initialize Gemini client, split story into scenes, and generate style guide
 */
router.post('/', 
  validateRequest([ValidationRules.story, ValidationRules.style]),
  async (req: express.Request<{}, GenerateResponse, GenerateRequest>, res: express.Response<GenerateResponse>) => {
  try {
    const { story, style } = req.body;

    if (!story || !style) {
      return res.status(400).json({
        sessionId: '',
        scenes: [],
        styleGuide: '',
        success: false,
        message: 'Story and style are required'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        sessionId: '',
        scenes: [],
        styleGuide: '',
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    // Initialize Gemini client
    const client = initGeminiClient(apiKey);

    // Split story into scenes
    const scenes = splitStoryIntoScenes(story);

    // Generate style guide
    const styleGuide = await generateStyleGuide(client, story, style);

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store session data
    sessions.set(sessionId, {
      story,
      style,
      scenes,
      styleGuide,
      client,
      imagePaths: [], // Track generated image paths for this session
      createdAt: new Date()
    });

    res.json({
      sessionId,
      scenes,
      styleGuide,
      success: true
    });
  } catch (error) {
    console.error('Error in generate endpoint:', error);
    res.status(500).json({
      sessionId: '',
      scenes: [],
      styleGuide: '',
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/generate/session/:sessionId
 * Get session data
 */
router.get('/session/:sessionId', (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      sessionId,
      story: session.story,
      style: session.style,
      scenes: session.scenes,
      styleGuide: session.styleGuide,
      success: true
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { sessions };
export default router;
