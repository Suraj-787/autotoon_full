import express from 'express';
import { sessions } from './generate.js';
import { createComicPDF, getComicPDFPath } from '../utils/pdfMaker.js';
import { getGeneratedImagePaths } from '../utils/imageGen.js';
import { initGeminiClient, generateComicTitle } from '../utils/gemini.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Library storage paths
const LIBRARY_DIR = path.join(__dirname, '..', 'library');
const LIBRARY_INDEX_FILE = path.join(LIBRARY_DIR, 'index.json');
const LIBRARY_PDFS_DIR = path.join(LIBRARY_DIR, 'pdfs');

// Ensure library directories exist
async function ensureLibraryDirs() {
  try {
    await fs.promises.access(LIBRARY_DIR);
  } catch {
    await fs.promises.mkdir(LIBRARY_DIR, { recursive: true });
  }
  
  try {
    await fs.promises.access(LIBRARY_PDFS_DIR);
  } catch {
    await fs.promises.mkdir(LIBRARY_PDFS_DIR, { recursive: true });
  }
}

// Get library index
async function getLibraryIndex(): Promise<any[]> {
  try {
    await ensureLibraryDirs();
    const data = await fs.promises.readFile(LIBRARY_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save library index
async function saveLibraryIndex(index: any[]): Promise<void> {
  await ensureLibraryDirs();
  await fs.promises.writeFile(LIBRARY_INDEX_FILE, JSON.stringify(index, null, 2));
}

// Add comic to library
async function addToLibrary(comic: any): Promise<void> {
  const library = await getLibraryIndex();
  library.unshift(comic); // Add to beginning of array (most recent first)
  await saveLibraryIndex(library);
}

interface ExportRequest {
  sessionId?: string;
  dpi?: number;
}

/**
 * POST /api/export
 * Create and return a PDF of the comic, and save it to the library
 */
router.post('/', async (req: express.Request<{}, any, ExportRequest>, res: express.Response) => {
  try {
    const { sessionId, dpi = 100 } = req.body;

    let imagePaths: string[] = [];
    let sessionData: any = null;

    // Try to get image paths from session first
    if (sessionId) {
      sessionData = sessions.get(sessionId);
      if (sessionData && sessionData.imagePaths) {
        imagePaths = sessionData.imagePaths;
        console.log(`📁 Found ${imagePaths.length} image paths in session:`, imagePaths);
        
        // Verify that the image files actually exist
        const existingPaths: string[] = [];
        for (const imagePath of imagePaths) {
          try {
            await fs.promises.access(imagePath);
            existingPaths.push(imagePath);
          } catch (error) {
            console.warn(`⚠️ Image file not found: ${imagePath}`);
          }
        }
        imagePaths = existingPaths;
        console.log(`✅ Verified ${imagePaths.length} existing image files`);
      }
    }

    // If no image paths from session or files don't exist, get all generated images
    if (imagePaths.length === 0) {
      console.log('🔍 No valid session images, checking generated directory...');
      imagePaths = await getGeneratedImagePaths();
      console.log(`📁 Found ${imagePaths.length} images in generated directory`);
    }

    if (imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images available to create PDF. Please generate some images first.'
      });
    }

    // Generate unique title first
    let comicTitle = 'Untitled Comic';
    if (sessionData) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && sessionData.story && sessionData.style) {
          const client = initGeminiClient(apiKey);
          comicTitle = await generateComicTitle(client, sessionData.story, sessionData.style);
          console.log(`🎨 Generated comic title: "${comicTitle}"`);
        }
      } catch (error) {
        console.error('Error generating title:', error);
        // Fallback to timestamp-based title
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        comicTitle = `Comic-${timestamp}`;
      }
    }

    // Create safe filename for PDF creation
    const safeTitle = comicTitle.replace(/[^a-zA-Z0-9\-\s]/g, '').replace(/\s+/g, '-');
    const uniqueId = uuidv4().slice(0, 8);
    const pdfFilename = `${safeTitle}-${uniqueId}.pdf`;

    // Create PDF with dynamic filename
    console.log(`📄 Creating PDF with ${imagePaths.length} images...`);
    const pdfPath = await createComicPDF(imagePaths, dpi, pdfFilename);

    if (!pdfPath) {
      console.error('❌ PDF creation failed - createComicPDF returned null/undefined');
      return res.status(500).json({
        success: false,
        message: 'Failed to create PDF - PDF generation returned no output'
      });
    }

    // Verify PDF file exists
    try {
      await fs.promises.access(pdfPath);
      console.log(`✅ PDF created successfully: ${pdfPath}`);
    } catch (error) {
      console.error('❌ PDF file does not exist after creation:', error);
      return res.status(500).json({
        success: false,
        message: 'PDF was created but file is not accessible'
      });
    }

    // Copy PDF to library directory
    const libraryPdfPath = path.join(LIBRARY_PDFS_DIR, pdfFilename);
    await fs.promises.copyFile(pdfPath, libraryPdfPath);

    // Generate thumbnail from first image
    let thumbnail = '';
    if (imagePaths.length > 0 && imagePaths[0]) {
      const firstImagePath = imagePaths[0];
      const imageName = path.basename(firstImagePath);
      thumbnail = `/images/${imageName}`;
    }

    // Create library entry
    const libraryEntry = {
      id: uuidv4(),
      title: comicTitle,
      story: sessionData?.story || 'Unknown story',
      style: sessionData?.style || 'unknown',
      scenes: sessionData?.scenes || [],
      styleGuide: sessionData?.styleGuide || '',
      prompts: sessionData?.prompts || [],
      images: sessionData?.relativeImagePaths || [],
      pdfPath: `/library/pdfs/${pdfFilename}`,
      pdfFilename: pdfFilename,
      thumbnail: thumbnail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionId: sessionId
    };

    // Add to library
    await addToLibrary(libraryEntry);

    console.log(`📚 Comic "${comicTitle}" saved to library with PDF: ${pdfFilename}`);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      res.end();
    });

    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error streaming PDF file'
      });
    });
  } catch (error) {
    console.error('Error in export endpoint:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/export
 * Get the existing PDF if available
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const pdfPath = await getComicPDFPath();

    if (!pdfPath) {
      return res.status(404).json({
        success: false,
        message: 'No PDF available. Generate images first.'
      });
    }

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="comic_book.pdf"');
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      res.end();
    });

    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error streaming PDF file'
      });
    });
  } catch (error) {
    console.error('Error in export GET endpoint:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/export/info
 * Get information about the available PDF
 */
router.get('/info', async (req: express.Request, res: express.Response) => {
  try {
    const pdfPath = await getComicPDFPath();
    
    if (!pdfPath) {
      return res.json({
        available: false,
        message: 'No PDF available'
      });
    }

    const stats = fs.statSync(pdfPath);
    
    res.json({
      available: true,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    });
  } catch (error) {
    console.error('Error getting PDF info:', error);
    res.status(500).json({
      available: false,
      message: 'Error getting PDF information'
    });
  }
});

/**
 * GET /api/export/:pdfId
 * Download a specific PDF from the library
 */
router.get('/:pdfId', async (req: express.Request, res: express.Response) => {
  try {
    const { pdfId } = req.params;
    
    // Get library to find the PDF
    const library = await getLibraryIndex();
    const comic = library.find(item => item.id === pdfId || item.pdfFilename === pdfId);
    
    if (!comic || !comic.pdfFilename) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    const pdfPath = path.join(LIBRARY_PDFS_DIR, comic.pdfFilename);
    
    // Check if file exists
    try {
      await fs.promises.access(pdfPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found on disk'
      });
    }

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${comic.pdfFilename}"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error streaming PDF file'
      });
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
