import type { GeminiClient } from './gemini.js';
import { generateImage } from './gemini.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pMap from 'p-map';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the generated directory exists
const GENERATED_DIR = path.join(__dirname, '..', 'generated');

async function ensureGeneratedDir() {
  try {
    await fs.access(GENERATED_DIR);
  } catch {
    await fs.mkdir(GENERATED_DIR, { recursive: true });
  }
}

/**
 * Clean up old generated images to prevent mixing with new session
 */
async function cleanupOldImages(): Promise<void> {
  try {
    await ensureGeneratedDir();
    const files = await fs.readdir(GENERATED_DIR);
    
    // Filter for image files (scene_*.png)
    const imageFiles = files.filter(file => file.match(/^scene_\d+\.png$/));
    
    if (imageFiles.length > 0) {
      console.log(`🧹 Cleaning up ${imageFiles.length} old image(s): ${imageFiles.join(', ')}`);
      
      // Delete old images
      await Promise.all(
        imageFiles.map(file => fs.unlink(path.join(GENERATED_DIR, file)))
      );
      
      console.log('✅ Old images cleaned up successfully');
    } else {
      console.log('🧹 No old images to clean up');
    }
  } catch (error) {
    console.error('⚠️ Error cleaning up old images:', error);
    // Don't throw error - cleanup failure shouldn't prevent new generation
  }
}

/**
 * Generate a single comic panel image with retry logic
 */
async function generateSingleComicPanel(
  client: GeminiClient,
  idx: number,
  prompt: string
): Promise<string | null> {
  const maxRetries = 2; // Try up to 3 times total (initial + 2 retries)
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Enhanced prompt for comic generation - focus on visual elements only
      const enhancedPrompt = `Create a high-quality comic book panel with NO TEXT OR DIALOGUE: ${prompt}. 
      Style: Square format comic panel, professional comic book art, vibrant colors, 
      clear composition, detailed illustration suitable for printing, 
      comic book style with clean lines and bold colors. 
      IMPORTANT: Do not include any speech bubbles, text, captions, or written words in the image. 
      Focus purely on the visual scene, characters, and environment.`;
      
      if (attempt === 0) {
        console.log(`🎨 Panel ${idx} - Input prompt: "${prompt}"`);
        console.log(`🔧 Panel ${idx} - Enhanced prompt: "${enhancedPrompt}"`);
      } else {
        console.log(`🔄 Panel ${idx} - Retry attempt ${attempt}/${maxRetries}`);
      }
      
      const imageResult = await generateImage(client, enhancedPrompt);
      
      if (imageResult && imageResult.data) {
        // Validate that we received substantial image data
        const imageBuffer = Buffer.from(imageResult.data, 'base64');
        const imageSize = imageBuffer.length;
        
        // Real Gemini images are typically 1MB+, SVG fallbacks are much smaller
        if (imageSize < 100000) { // Less than 100KB suggests a problem
          console.log(`⚠️ Panel ${idx} - Image data too small (${imageSize} bytes), retry attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) continue; // Try again
        }
        
        await ensureGeneratedDir();
        const imagePath = path.join(GENERATED_DIR, `scene_${idx}.png`);
        await fs.writeFile(imagePath, imageBuffer);
        
        console.log(`✅ Generated real image for panel ${idx} (${Math.round(imageSize/1024)}KB)`);
        return imagePath;
      } else {
        console.log(`⚠️ No image data received for panel ${idx}, attempt ${attempt}/${maxRetries}`);
        if (attempt < maxRetries) continue; // Try again
        
        // Final fallback after all retries failed
        console.log(`📝 All retries failed for panel ${idx}, using enhanced placeholder`);
        const imageBuffer = await createEnhancedComicImage(prompt, idx);
        
        await ensureGeneratedDir();
        const imagePath = path.join(GENERATED_DIR, `scene_${idx}.png`);
        await fs.writeFile(imagePath, imageBuffer);
        
        console.log(`🎭 Generated fallback image for panel ${idx}`);
        return imagePath;
      }
    } catch (geminiError: any) {
      const errorMessage = geminiError?.message || 'Unknown error';
      console.log(`⚠️ Gemini image generation failed for panel ${idx}, attempt ${attempt}/${maxRetries}:`);
      console.log(`📊 Error message: ${errorMessage}`);
      
      // Check if this is a rate limiting error and add extra delay
      const isRateLimitError = errorMessage.toLowerCase().includes('rate') || 
                              errorMessage.toLowerCase().includes('quota') ||
                              errorMessage.toLowerCase().includes('limit') ||
                              errorMessage.toLowerCase().includes('throttle');
      
      if (attempt < maxRetries) {
        let retryDelay = Math.min(3000 + (attempt * 2000), 8000); // 3-8 seconds progressive delay
        
        // Add extra delay for rate limit errors
        if (isRateLimitError) {
          retryDelay = Math.min(retryDelay * 2, 15000); // Double delay for rate limits, max 15 seconds
          console.log(`🚦 Rate limit detected, using extended delay: ${retryDelay}ms`);
        }
        
        console.log(`🔄 Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Final fallback after all retries failed
      console.log(`📝 All retries failed for panel ${idx}, using enhanced placeholder`);
      const imageBuffer = await createEnhancedComicImage(prompt, idx);
      
      await ensureGeneratedDir();
      const imagePath = path.join(GENERATED_DIR, `scene_${idx}.png`);
      await fs.writeFile(imagePath, imageBuffer);
      
      console.log(`🎭 Generated fallback image for panel ${idx}`);
      return imagePath;
    }
  }
  
  // This should never be reached, but just in case
  console.error(`❌ Unexpected error generating image for panel ${idx}`);
  return null;
}

/**
 * Create an enhanced comic-style image based on the prompt
 * This creates a more sophisticated comic panel that interprets the prompt
 */
async function createEnhancedComicImage(prompt: string, idx: number): Promise<Buffer> {
  const width = 512;
  const height = 512;
  
  // Analyze prompt to determine scene type and characters
  const sceneAnalysis = analyzePrompt(prompt);
  console.log(`🔍 Panel ${idx} scene analysis:`, sceneAnalysis);
  
  // Create comic-style colored backgrounds based on scene content
  const backgroundColors = getSceneBackgroundColors(sceneAnalysis);
  
  // Create a detailed SVG comic panel
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${backgroundColors.sky};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${backgroundColors.ground};stop-opacity:1" />
        </linearGradient>
        <radialGradient id="sunGradient" cx="80%" cy="20%" r="30%">
          <stop offset="0%" style="stop-color:#FFE066;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#FFE066;stop-opacity:0" />
        </radialGradient>
        <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="${backgroundColors.ground}"/>
          <path d="M2,8 Q4,6 6,8 M0,8 Q2,6 4,8" stroke="#2D5016" stroke-width="1" fill="none"/>
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#skyGradient)"/>
      
      <!-- Sun/Light source if outdoor scene -->
      ${sceneAnalysis.isOutdoor ? '<ellipse cx="410" cy="100" rx="40" ry="40" fill="url(#sunGradient)"/>' : ''}
      
      <!-- Ground/Floor -->
      <rect x="0" y="${height * 0.7}" width="${width}" height="${height * 0.3}" 
            fill="${sceneAnalysis.isOutdoor ? 'url(#grassPattern)' : backgroundColors.ground}"/>
      
      <!-- Character representation -->
      ${generateCharacterSVG(sceneAnalysis, width, height)}
      
      <!-- Objects/Props -->
      ${generateObjectsSVG(sceneAnalysis, width, height)}
      
      <!-- Panel border -->
      <rect x="2" y="2" width="${width-4}" height="${height-4}" 
            fill="none" stroke="#000" stroke-width="4" rx="8"/>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

/**
 * Analyze the prompt to determine scene characteristics
 */
function analyzePrompt(prompt: string): any {
  const lowerPrompt = prompt.toLowerCase();
  
  // Enhanced prompt analysis for better visual generation
  const analysis = {
    isOutdoor: /forest|tree|outdoor|nature|garden|field|sky|sun|mountain|clearing/.test(lowerPrompt),
    hasCharacter: /fox|character|person|animal|luna|hero|brave/.test(lowerPrompt),
    hasObject: /crystal|treasure|book|sword|magic|glowing|gem|stone/.test(lowerPrompt),
    mood: /dark|mysterious|scary|ominous/.test(lowerPrompt) ? 'dark' : 
          /happy|bright|cheerful|vibrant/.test(lowerPrompt) ? 'bright' : 'neutral',
    action: /running|flying|jumping|fighting|approaching|moving|cautiously/.test(lowerPrompt) ? 'dynamic' : 'static',
    timeOfDay: /night|dark|moon|evening/.test(lowerPrompt) ? 'night' : 'day',
    
    // New detailed analysis
    characterType: /fox/.test(lowerPrompt) ? 'fox' : /person|human/.test(lowerPrompt) ? 'human' : 'generic',
    objectType: /crystal/.test(lowerPrompt) ? 'crystal' : /treasure/.test(lowerPrompt) ? 'treasure' : 'generic',
    setting: /forest/.test(lowerPrompt) ? 'forest' : /mountain/.test(lowerPrompt) ? 'mountain' : 'generic',
    characterPose: /cautiously|careful/.test(lowerPrompt) ? 'cautious' : 
                  /approaching/.test(lowerPrompt) ? 'approaching' : 'standing',
    lighting: /glowing|magical|bright/.test(lowerPrompt) ? 'magical' : 'natural',
    foliage: /mushrooms?|ferns?|leaves?|lush/.test(lowerPrompt) ? 'lush' : 'sparse'
  };
  
  return analysis;
}

/**
 * Get background colors based on scene analysis
 */
function getSceneBackgroundColors(analysis: any): any {
  if (analysis.timeOfDay === 'night') {
    return {
      sky: '#1a1a2e',
      ground: '#16213e',
      accent: '#eee'
    };
  }
  
  if (analysis.mood === 'dark') {
    return {
      sky: '#4a4a4a',
      ground: '#2d2d2d',
      accent: '#888'
    };
  }
  
  if (analysis.isOutdoor) {
    return {
      sky: '#87CEEB',
      ground: '#228B22',
      accent: '#FFD700'
    };
  }
  
  return {
    sky: '#F0F8FF',
    ground: '#8B4513',
    accent: '#DAA520'
  };
}

/**
 * Generate character SVG based on scene analysis
 */
function generateCharacterSVG(analysis: any, width: number, height: number): string {
  if (!analysis.hasCharacter) return '';
  
  const charX = width * 0.3;
  const charY = height * 0.6;
  
  // Simple fox character representation
  return `
    <!-- Fox character -->
    <g transform="translate(${charX},${charY})">
      <!-- Body -->
      <ellipse cx="0" cy="0" rx="25" ry="15" fill="#FF6B35" stroke="#333" stroke-width="2"/>
      <!-- Head -->
      <circle cx="0" cy="-25" r="20" fill="#FF6B35" stroke="#333" stroke-width="2"/>
      <!-- Ears -->
      <polygon points="-15,-35 -10,-45 -5,-35" fill="#FF6B35" stroke="#333" stroke-width="1"/>
      <polygon points="5,-35 10,-45 15,-35" fill="#FF6B35" stroke="#333" stroke-width="1"/>
      <!-- Eyes -->
      <circle cx="-8" cy="-28" r="3" fill="#000"/>
      <circle cx="8" cy="-28" r="3" fill="#000"/>
      <circle cx="-7" cy="-29" r="1" fill="#fff"/>
      <circle cx="9" cy="-29" r="1" fill="#fff"/>
      <!-- Nose -->
      <polygon points="0,-20 -2,-18 2,-18" fill="#000"/>
      <!-- Tail -->
      <ellipse cx="-30" cy="5" rx="15" ry="8" fill="#FF6B35" stroke="#333" stroke-width="2"/>
    </g>
  `;
}

/**
 * Generate objects SVG based on scene analysis
 */
function generateObjectsSVG(analysis: any, width: number, height: number): string {
  if (!analysis.hasObject) return '';
  
  const objX = width * 0.7;
  const objY = height * 0.6;
  
  // Magical crystal representation
  return `
    <!-- Magical crystal -->
    <g transform="translate(${objX},${objY})">
      <polygon points="0,-20 -10,0 0,15 10,0" fill="#00FFFF" stroke="#0066CC" stroke-width="2" opacity="0.8"/>
      <polygon points="0,-15 -5,0 0,10 5,0" fill="#FFFFFF" opacity="0.6"/>
      <!-- Glow effect -->
      <circle cx="0" cy="-5" r="25" fill="#00FFFF" opacity="0.2"/>
    </g>
  `;
}

/**
 * Helper function to adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const B = (num >> 8 & 0x00FF) + amt;
  const G = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
    (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + 
    (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
}

/**
 * Generate comic panels in parallel with rate limiting
 */
export async function generateComicPanelsParallel(
  client: GeminiClient,
  panelPrompts: string[]
): Promise<string[]> {
  // Clean up old images first to ensure only current session images are present
  await cleanupOldImages();
  
  console.log(`🎬 Starting generation of ${panelPrompts.length} panels with rate limiting...`);
  
  const tasks = panelPrompts.map((prompt, index) => {
    return async () => {
      // Add delay between each panel to avoid rate limiting
      if (index > 0) {
        const delay = Math.min(2000 + (index * 500), 5000); // 2-5 seconds progressive delay
        console.log(`⏱️ Panel ${index} - Waiting ${delay}ms to avoid rate limits...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return generateSingleComicPanel(client, index, prompt);
    };
  });

  // Use sequential processing (concurrency: 1) to avoid overwhelming the API
  const results = await pMap(tasks, async (task) => await task(), { concurrency: 1 });
  
  // Filter out null results (failed generations)
  const successfulResults = results.filter((path): path is string => path !== null);
  
  console.log(`✅ Successfully generated ${successfulResults.length}/${panelPrompts.length} panels`);
  return successfulResults;
}

/**
 * Get all generated image paths
 */
export async function getGeneratedImagePaths(): Promise<string[]> {
  try {
    await ensureGeneratedDir();
    const files = await fs.readdir(GENERATED_DIR);
    const imageFiles = files
      .filter(file => file.startsWith('scene_') && file.endsWith('.png'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/scene_(\d+)\.png/)?.[1] || '0');
        const bNum = parseInt(b.match(/scene_(\d+)\.png/)?.[1] || '0');
        return aNum - bNum;
      })
      .map(file => path.join(GENERATED_DIR, file));
    
    return imageFiles;
  } catch (error) {
    console.error('Error getting generated image paths:', error);
    return [];
  }
}

/**
 * Clean up generated images
 */
export async function cleanupGeneratedImages(): Promise<void> {
  try {
    const imagePaths = await getGeneratedImagePaths();
    await Promise.all(imagePaths.map(path => fs.unlink(path)));
  } catch (error) {
    console.error('Error cleaning up generated images:', error);
  }
}

// Export the cleanup function for old images too
export { cleanupOldImages };
