import express from 'express';
import { sessions } from './generate.js';
import { createComicPDFFromUrls } from '../utils/pdfMaker.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { initGeminiClient, generateComicTitle } from '../utils/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

interface ExportRequest {
  sessionId?: string;
  dpi?: number;
}

/**
 * POST /api/export
 * Export comic as PDF
 */
router.post('/', async (req: express.Request<{}, any, ExportRequest>, res: express.Response) => {
  try {
    const { sessionId, dpi = 100 } = req.body;

    let sessionData: any = null;
    let imageUrls: string[] = [];

    // Get session data
    if (sessionId) {
      sessionData = sessions.get(sessionId);
      if (sessionData && sessionData.relativeImagePaths) {
        // Convert relative paths to full URLs
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        imageUrls = sessionData.relativeImagePaths.map((relativePath: string) => 
          `${baseUrl}${relativePath}`
        );
        console.log(`📷 Found ${imageUrls.length} image URLs in session:`, imageUrls);
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images available to create PDF. Please generate some images first.'
      });
    }

    // Generate unique title
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
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        comicTitle = `Comic-${timestamp}`;
      }
    }

    // Create safe filename
    const safeTitle = comicTitle.replace(/[^a-zA-Z0-9\-\s]/g, '').replace(/\s+/g, '-');
    const uniqueId = uuidv4().slice(0, 8);
    const pdfFilename = `${safeTitle}-${uniqueId}.pdf`;

    // Create PDF from URLs (this will download images and create PDF)
    console.log(`📄 Creating PDF from ${imageUrls.length} image URLs...`);
    const pdfBuffer = await createComicPDFFromUrls(imageUrls, dpi, pdfFilename);

    if (!pdfBuffer) {
      console.error('❌ PDF creation failed');
      return res.status(500).json({
        success: false,
        message: 'Failed to create PDF from images'
      });
    }

    console.log(`✅ PDF created successfully: ${pdfFilename}`);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error in export endpoint:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
