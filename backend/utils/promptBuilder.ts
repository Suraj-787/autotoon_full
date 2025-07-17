import type { GeminiClient } from './gemini.js';
import { generateText } from './gemini.js';
import pMap from 'p-map';

/**
 * Generate a style guide using Gemini based on the story and user-selected style
 */
export async function generateStyleGuide(
  client: GeminiClient,
  story: string,
  userStyle: string
): Promise<string> {
  const prompt = [
    'Create a detailed visual style guide for consistent comic panel generation.',
    'Focus ONLY on visual elements - do NOT include any text, dialogue, or speech elements.',
    'Include:',
    '1. Character visual designs (appearance, clothing, distinctive features)',
    '2. Environment and setting details (backgrounds, locations)',
    '3. Key objects and props (visual characteristics)',
    '4. Color palette recommendations (specific colors and tones)',
    '5. Art style description (line work, shading, overall aesthetic)',
    '6. Lighting and atmosphere guidelines',
    '7. Character consistency notes (how characters should look across panels)',
    'IMPORTANT: This guide is for generating visual-only comic panels without any text or dialogue.',
    `User selected style: ${userStyle}`,
    `Story: ${story}`
  ];

  try {
    return await generateText(client, prompt);
  } catch (error) {
    console.error('Error generating style guide:', error);
    return '';
  }
}

/**
 * Generate a single panel prompt
 */
async function generateSinglePanelPrompt(
  client: GeminiClient,
  idx: number,
  scene: string,
  styleGuide: string,
  prevScene: string | null,
  userStyle: string
): Promise<string> {
  const prompt = [
    `Generate a detailed visual comic panel description in the style: ${userStyle}`,
    'CRITICAL: This is for IMAGE GENERATION ONLY - absolutely NO text, dialogue, speech bubbles, sound effects, captions, or written words of any kind.',
    'Strictly follow the provided visual style guide and maintain visual continuity across panels.',
    'Focus exclusively on VISUAL elements:',
    '- Character poses, facial expressions, and body language',
    '- Environment and background details',
    '- Objects, props, and scene elements',
    '- Lighting, colors, and atmosphere',
    '- Camera angle and composition',
    '- Artistic style and mood',
    '- Panel should be designed for a square image format',
    'DO NOT include:',
    '- Any speech bubbles, text balloons, or dialogue',
    '- Sound effects (onomatopoeia) or text overlays',
    '- Captions, titles, or written descriptions within the image',
    '- Any readable text or symbols',
    `Style Guide: ${styleGuide}`,
    `Current Panel (${idx + 1}): ${scene}`,
    `Previous Panel Summary: ${prevScene || 'None'}`,
    'Output: A purely visual description for image generation - describe what should be SEEN, not read'
  ];

  try {
    return await generateText(client, prompt);
  } catch (error) {
    console.error(`Error generating prompt for panel ${idx}:`, error);
    return '';
  }
}

/**
 * Generate panel prompts in parallel
 */
export async function generatePanelPromptsParallel(
  client: GeminiClient,
  scenes: string[],
  styleGuide: string,
  userStyle: string
): Promise<string[]> {
  const tasks = scenes.map((scene, index) => {
    const idx = index + 1;
    const prevScene = index > 0 ? scenes[index - 1] || null : null;
    
    return async () => generateSinglePanelPrompt(
      client,
      idx,
      scene,
      styleGuide,
      prevScene,
      userStyle
    );
  });

  // Use pMap to limit concurrency to 5 parallel requests
  return await pMap(tasks, async (task) => await task(), { concurrency: 5 });
}
