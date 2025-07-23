import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
