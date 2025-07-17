import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Settings storage path
const SETTINGS_DIR = path.join(__dirname, '..', 'settings');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'app-settings.json');

// Ensure settings directory exists
async function ensureSettingsDir() {
  try {
    await fs.access(SETTINGS_DIR);
  } catch {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  }
}

// Default settings
const DEFAULT_SETTINGS = {
  defaultStyle: 'manga',
  highResMode: false,
  maxConcurrency: 4,
  defaultWordsPerScene: 35,
  autoSave: true,
  darkMode: false,
  language: 'en',
  exportQuality: 'high',
  notifications: true,
  updatedAt: new Date().toISOString()
};

// Get current settings
async function getSettings(): Promise<any> {
  try {
    await ensureSettingsDir();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Save settings
async function saveSettings(settings: any): Promise<void> {
  await ensureSettingsDir();
  const settingsWithTimestamp = {
    ...settings,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settingsWithTimestamp, null, 2));
}

/**
 * GET /api/settings
 * Get current application settings
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const settings = await getSettings();
    res.json({
      settings,
      success: true
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      settings: DEFAULT_SETTINGS,
      success: false,
      message: 'Failed to retrieve settings, using defaults'
    });
  }
});

/**
 * POST /api/settings
 * Update application settings
 */
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const newSettings = req.body;

    // Get current settings and merge with new ones
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };

    // Validate critical settings
    if (updatedSettings.maxConcurrency) {
      updatedSettings.maxConcurrency = Math.max(1, Math.min(10, updatedSettings.maxConcurrency));
    }
    if (updatedSettings.defaultWordsPerScene) {
      updatedSettings.defaultWordsPerScene = Math.max(10, Math.min(100, updatedSettings.defaultWordsPerScene));
    }

    await saveSettings(updatedSettings);

    res.json({
      settings: updatedSettings,
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

/**
 * POST /api/settings/reset
 * Reset settings to defaults
 */
router.post('/reset', async (req: express.Request, res: express.Response) => {
  try {
    await saveSettings(DEFAULT_SETTINGS);
    res.json({
      settings: DEFAULT_SETTINGS,
      success: true,
      message: 'Settings reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings'
    });
  }
});

/**
 * GET /api/settings/styles
 * Get available comic styles
 */
router.get('/styles', (req: express.Request, res: express.Response) => {
  const styles = [
    {
      id: 'manga',
      name: 'Manga',
      description: 'Japanese comic style with detailed line art and expressive characters'
    },
    {
      id: 'cartoon',
      name: 'Cartoon',
      description: 'Colorful, fun cartoon style perfect for lighthearted stories'
    },
    {
      id: 'superhero',
      name: 'Superhero',
      description: 'Dynamic superhero comic style with bold colors and action poses'
    },
    {
      id: 'realistic',
      name: 'Realistic',
      description: 'Photorealistic style with detailed environments and characters'
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      description: 'Soft watercolor painting style with gentle colors and textures'
    },
    {
      id: 'noir',
      name: 'Film Noir',
      description: 'Black and white dramatic style with high contrast and shadows'
    },
    {
      id: 'pixel',
      name: 'Pixel Art',
      description: 'Retro pixel art style reminiscent of classic video games'
    },
    {
      id: 'fantasy',
      name: 'Fantasy',
      description: 'Magical fantasy style with mystical elements and rich details'
    }
  ];

  res.json({
    styles,
    success: true
  });
});

export default router;
