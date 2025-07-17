import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Library storage path
const LIBRARY_DIR = path.join(__dirname, '..', 'library');
const LIBRARY_INDEX_FILE = path.join(LIBRARY_DIR, 'index.json');

// Ensure library directory exists
async function ensureLibraryDir() {
  try {
    await fs.access(LIBRARY_DIR);
  } catch {
    await fs.mkdir(LIBRARY_DIR, { recursive: true });
  }
}

// Get library index
async function getLibraryIndex(): Promise<any[]> {
  try {
    await ensureLibraryDir();
    const data = await fs.readFile(LIBRARY_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save library index
async function saveLibraryIndex(index: any[]): Promise<void> {
  await ensureLibraryDir();
  await fs.writeFile(LIBRARY_INDEX_FILE, JSON.stringify(index, null, 2));
}

interface LibraryItem {
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

interface SaveComicRequest {
  title: string;
  story: string;
  style: string;
  scenes: string[];
  styleGuide: string;
  prompts?: string[];
  images?: string[];
  sessionId?: string;
}

/**
 * GET /api/library
 * Get all saved comics
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const library = await getLibraryIndex();
    res.json({
      comics: library,
      success: true
    });
  } catch (error) {
    console.error('Error getting library:', error);
    res.status(500).json({
      comics: [],
      success: false,
      message: 'Failed to retrieve library'
    });
  }
});

/**
 * POST /api/library
 * Save a comic to the library
 */
router.post('/', async (req: express.Request<{}, any, SaveComicRequest>, res: express.Response) => {
  try {
    const { title, story, style, scenes, styleGuide, prompts, images, sessionId } = req.body;

    if (!title || !story || !style || !scenes) {
      return res.status(400).json({
        success: false,
        message: 'Title, story, style, and scenes are required'
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const libraryItem: LibraryItem = {
      id,
      title,
      story,
      style,
      scenes,
      styleGuide,
      prompts,
      images,
      createdAt: now,
      updatedAt: now
    };

    // Generate thumbnail if images are available
    if (images && images.length > 0) {
      libraryItem.thumbnail = images[0];
    }

    // Get current library
    const library = await getLibraryIndex();
    library.push(libraryItem);

    // Save updated library
    await saveLibraryIndex(library);

    // Save detailed comic data to separate file
    const comicDataPath = path.join(LIBRARY_DIR, `${id}.json`);
    await fs.writeFile(comicDataPath, JSON.stringify(libraryItem, null, 2));

    res.json({
      comic: libraryItem,
      success: true,
      message: 'Comic saved to library successfully'
    });
  } catch (error) {
    console.error('Error saving comic to library:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save comic to library'
    });
  }
});

/**
 * GET /api/library/:id
 * Get a specific comic from the library
 */
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const comicDataPath = path.join(LIBRARY_DIR, `${id}.json`);

    try {
      const data = await fs.readFile(comicDataPath, 'utf-8');
      const comic = JSON.parse(data);
      res.json({
        comic,
        success: true
      });
    } catch {
      res.status(404).json({
        success: false,
        message: 'Comic not found'
      });
    }
  } catch (error) {
    console.error('Error getting comic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comic'
    });
  }
});

/**
 * PUT /api/library/:id
 * Update a comic in the library
 */
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const comicDataPath = path.join(LIBRARY_DIR, `${id}.json`);

    try {
      const data = await fs.readFile(comicDataPath, 'utf-8');
      const comic = JSON.parse(data);

      // Update comic data
      const updatedComic = {
        ...comic,
        ...updates,
        id, // Preserve original ID
        updatedAt: new Date().toISOString()
      };

      // Save updated comic data
      await fs.writeFile(comicDataPath, JSON.stringify(updatedComic, null, 2));

      // Update library index
      const library = await getLibraryIndex();
      const index = library.findIndex(item => item.id === id);
      if (index !== -1) {
        library[index] = updatedComic;
        await saveLibraryIndex(library);
      }

      res.json({
        comic: updatedComic,
        success: true,
        message: 'Comic updated successfully'
      });
    } catch {
      res.status(404).json({
        success: false,
        message: 'Comic not found'
      });
    }
  } catch (error) {
    console.error('Error updating comic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comic'
    });
  }
});

/**
 * DELETE /api/library/:id
 * Delete a comic from the library
 */
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const comicDataPath = path.join(LIBRARY_DIR, `${id}.json`);

    try {
      // Remove comic data file
      await fs.unlink(comicDataPath);

      // Update library index
      const library = await getLibraryIndex();
      const filteredLibrary = library.filter(item => item.id !== id);
      await saveLibraryIndex(filteredLibrary);

      res.json({
        success: true,
        message: 'Comic deleted successfully'
      });
    } catch {
      res.status(404).json({
        success: false,
        message: 'Comic not found'
      });
    }
  } catch (error) {
    console.error('Error deleting comic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comic'
    });
  }
});

export default router;
