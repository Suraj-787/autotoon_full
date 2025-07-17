# Frontend Integration Guide

## Quick Setup for Next.js Frontend

### 1. Environment Variables
Create `.env.local` in your Next.js project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### 2. API Client Integration
Copy the `api-client.ts` file from the backend folder to your frontend `lib/api.ts`:

```bash
cp backend/api-client.ts frontend/lib/api.ts
```

### 3. Usage in React Components

```typescript
import { generateComic, getComicStyles, saveComic, getLibrary } from '@/lib/api';

// In your React component
const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  
  const handleGenerateComic = async (story: string, style: string) => {
    setLoading(true);
    try {
      const result = await generateComic({ story, style });
      console.log('Generated:', result);
      // result.sessionId, result.scenes, result.styleGuide
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your UI components */}
    </div>
  );
};
```

### 4. Available API Functions

```typescript
// Core Generation
await generateComic({ story: "...", style: "manga" });
await getScenes({ story: "...", maxWordsPerScene: 35 });
await generateStyleGuide("story", "style");
await generatePrompts({ scenes: [...], styleGuide: "...", style: "..." });
await generateImages({ prompts: [...] });

// Library Management
await getLibrary();
await saveComic({ title: "...", story: "...", style: "...", scenes: [...] });
await deleteComic("comic-id");

// Settings
await getSettings();
await updateSettings({ darkMode: true, defaultStyle: "manga" });
await getComicStyles();

// Export
await exportComic("session-id"); // Returns PDF Blob
```

### 5. Error Handling

All API functions return promises and throw errors that you should catch:

```typescript
try {
  const result = await generateComic({ story, style });
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);
  // Show user-friendly error message
}
```

### 6. TypeScript Support

The API client includes full TypeScript definitions:

```typescript
import type { 
  LibraryItem, 
  AppSettings, 
  ComicStyle,
  GenerateRequest,
  GenerateResponse 
} from '@/lib/api';
```

### 7. Image URLs

Convert relative image paths to full URLs:

```typescript
import { api } from '@/lib/api';

const fullImageURL = api.getImageURL('/images/scene_0.png');
// Returns: http://localhost:3001/images/scene_0.png
```

### 8. PDF Download

```typescript
import { api } from '@/lib/api';

const downloadPDF = async (sessionId?: string) => {
  try {
    await api.downloadPDF(sessionId, 'my-comic.pdf');
    // PDF will be automatically downloaded
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

## 🎨 Visual-Only Comic Generation

**Important**: This backend is optimized for generating **visual-only comic panels** without embedded text, dialogue, or speech bubbles. The AI focuses purely on visual storytelling elements:

- ✅ **Visual Elements**: Characters, environments, objects, lighting, composition
- ❌ **Text Elements**: No speech bubbles, dialogue, captions, or sound effects

This approach provides:
- Cleaner, more focused image generation
- Better consistency across panels
- Flexibility for adding text overlays later in post-processing
- Higher quality visual storytelling

## Backend Status Check

Before starting your frontend, ensure the backend is running:

```bash
# In backend directory
bun run server.ts

# Test endpoint
curl http://localhost:3001/api/status
```

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure:
- Backend is running on port 3001
- Frontend is running on port 3000  
- `NEXT_PUBLIC_API_BASE_URL` is set correctly

### Rate Limiting
The backend has rate limiting enabled:
- General API: 100 requests per 15 minutes
- Generation: 10 requests per minute
- Images: 5 requests per 5 minutes

### Network Errors
Check that both frontend and backend are running and accessible.
