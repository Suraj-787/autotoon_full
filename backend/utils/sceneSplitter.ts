/**
 * Split a story into scenes with a maximum word count per scene
 */
export function splitStoryIntoScenes(story: string, maxWordsPerScene: number = 35): string[] {
  const sentences = story.trim().split('. ');
  const scenes: string[] = [];
  let currentScene = '';

  for (let sentence of sentences) {
    // Ensure sentence ends with a period
    if (!sentence.endsWith('.')) {
      sentence += '.';
    }

    const potentialScene = currentScene + sentence + ' ';
    const wordCount = potentialScene.split(' ').filter(word => word.length > 0).length;

    if (wordCount < maxWordsPerScene) {
      currentScene = potentialScene;
    } else {
      if (currentScene.trim()) {
        scenes.push(currentScene.trim());
      }
      currentScene = sentence + ' ';
    }
  }

  // Add the last scene if it exists
  if (currentScene.trim()) {
    scenes.push(currentScene.trim());
  }

  return scenes;
}
