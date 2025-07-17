import express from 'express';
import { splitStoryIntoScenes } from '../utils/sceneSplitter.js';

const router = express.Router();

interface ScenesRequest {
  story: string;
  maxWordsPerScene?: number;
}

interface ScenesResponse {
  scenes: string[];
  success: boolean;
  message?: string;
}

/**
 * POST /api/scenes
 * Split a story into scenes
 */
router.post('/', async (req: express.Request<{}, ScenesResponse, ScenesRequest>, res: express.Response<ScenesResponse>) => {
  try {
    const { story, maxWordsPerScene = 35 } = req.body;

    if (!story) {
      return res.status(400).json({
        scenes: [],
        success: false,
        message: 'Story is required'
      });
    }

    const scenes = splitStoryIntoScenes(story, maxWordsPerScene);

    res.json({
      scenes,
      success: true
    });
  } catch (error) {
    console.error('Error in scenes endpoint:', error);
    res.status(500).json({
      scenes: [],
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
