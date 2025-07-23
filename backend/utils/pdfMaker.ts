import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a comic PDF from image paths
 */
export async function createComicPDF(imagePaths: string[], dpi: number = 100, filename?: string): Promise<string | null> {
  try {
    if (!imagePaths || imagePaths.length === 0) {
      throw new Error('No images provided for PDF creation');
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add each image as a page
    for (const imagePath of imagePaths) {
      try {
        const imageBytes = await fs.readFile(imagePath);
        let image;

        // Determine image type and embed accordingly
        if (imagePath.toLowerCase().endsWith('.png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          console.warn(`Unsupported image format for ${imagePath}, skipping...`);
          continue;
        }

        // Get image dimensions
        const { width, height } = image;

        // Create a page with the same aspect ratio as the image
        const page = pdfDoc.addPage([width, height]);

        // Draw the image to fill the entire page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });
      } catch (error) {
        console.error(`Error processing image ${imagePath}:`, error);
        // Continue with other images even if one fails
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Use provided filename or default to comic_book.pdf
    const pdfFilename = filename || 'comic_book.pdf';
    const outputPath = path.join(__dirname, '..', 'generated', pdfFilename);
    await fs.writeFile(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    console.error('Error creating PDF:', error);
    return null;
  }
}

/**
 * Get the comic PDF path if it exists
 */
export async function getComicPDFPath(): Promise<string | null> {
  const pdfPath = path.join(__dirname, '..', 'generated', 'comic_book.pdf');
  
  try {
    await fs.access(pdfPath);
    return pdfPath;
  } catch {
    return null;
  }
}

/**
 * Clean up the generated PDF
 */
export async function cleanupComicPDF(): Promise<void> {
  const pdfPath = await getComicPDFPath();
  if (pdfPath) {
    try {
      await fs.unlink(pdfPath);
    } catch (error) {
      console.error('Error cleaning up PDF:', error);
    }
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Create a comic PDF from image URLs
 */
export async function createComicPDFFromUrls(imageUrls: string[], dpi: number = 100, filename?: string): Promise<Buffer | null> {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('No image URLs provided for PDF creation');
    }

    console.log(`📄 Creating PDF from ${imageUrls.length} image URLs...`);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Download and add each image as a page
    for (const [index, imageUrl] of imageUrls.entries()) {
      try {
        console.log(`📷 Downloading image ${index + 1}/${imageUrls.length}: ${imageUrl}`);
        const imageBytes = await downloadImage(imageUrl);
        let image;

        // Determine image type and embed accordingly
        if (imageUrl.toLowerCase().includes('.png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg')) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          console.warn(`Unsupported image format for ${imageUrl}, skipping...`);
          continue;
        }

        // Get image dimensions
        const { width, height } = image;

        // Create a page with the same aspect ratio as the image
        const page = pdfDoc.addPage([width, height]);

        // Draw the image to fill the entire page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });
        
        console.log(`✅ Added image ${index + 1} to PDF`);
      } catch (error) {
        console.error(`Error processing image ${imageUrl}:`, error);
        // Continue with other images even if one fails
      }
    }

    // Save the PDF and return as buffer
    const pdfBytes = await pdfDoc.save();
    console.log(`✅ PDF created successfully with ${pdfDoc.getPageCount()} pages`);
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error creating PDF from URLs:', error);
    return null;
  }
}
