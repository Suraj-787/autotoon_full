import express from 'express';
import { sessions } from './generate.js';
import { createComicPDF, getComicPDFPath } from '../utils/pdfMaker.js';
import { getGeneratedImagePaths } from '../utils/imageGen.js';
import fs from 'fs';

const router = express.Router();

interface ExportRequest {
  sessionId?: string;
  dpi?: number;
}

/**
 * POST /api/export
 * Create and return a PDF of the comic
 */
router.post('/', async (req: express.Request<{}, any, ExportRequest>, res: express.Response) => {
  try {
    const { sessionId, dpi = 100 } = req.body;

    let imagePaths: string[] = [];

    // Try to get image paths from session first
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session && session.imagePaths) {
        imagePaths = session.imagePaths;
      }
    }

    // If no image paths from session, get all generated images
    if (imagePaths.length === 0) {
      imagePaths = await getGeneratedImagePaths();
    }

    if (imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images available to create PDF'
      });
    }

    // Create PDF
    const pdfPath = await createComicPDF(imagePaths, dpi);

    if (!pdfPath) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create PDF'
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

export default router;
