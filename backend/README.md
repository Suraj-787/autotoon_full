# Auto-Toon Backend

A Node.js/Bun + Express backend for generating comic books using Google's Gemini AI. Fully compatible with Next.js React frontend.

## ✨ Features

- **Story Processing**: Split stories into manageable scenes
- **Style Guide Generation**: Create consistent visual styles using AI
- **Visual-Only Image Generation**: Generate comic panels focused purely on visual storytelling without embedded text
- **Parallel Prompt Generation**: Generate detailed visual prompts for each comic panel
- **Text-Free Comic Panels**: AI-generated images optimized for clean visual content
- **PDF Export**: Combine all panels into a downloadable comic book PDF
- **Library Management**: Save, organize, and manage generated comics
- **Settings Management**: Configurable app preferences and comic styles
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive request validation
- **Session Management**: Stateful comic generation process

## 🚀 Setup

1. **Install Dependencies**:
   ```bash
   bun install
   ```

2. **Environment Configuration**:
   Create a `.env` file with:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

3. **Run the Server**:
   ```bash
   bun run dev
   # or
   bun run server.ts
   ```

The server will start on `http://localhost:3001`

## 📚 API Endpoints

### Core Generation Endpoints

#### **POST `/api/generate`**
Initialize the comic generation process.

**Request Body**:
```json
{
  "story": "Once upon a time, in a magical forest...",
  "style": "manga"
}
```

**Response**:
```json
{
  "sessionId": "session_1641234567890_abc123",
  "scenes": ["Scene 1 text...", "Scene 2 text..."],
  "styleGuide": "Detailed style guide...",
  "success": true
}
```

#### **POST `/api/scenes`**
Split a story into scenes.

**Request Body**:
```json
{
  "story": "Your story text here...",
  "maxWordsPerScene": 35
}
```

#### **POST `/api/style-guide`**
Generate a style guide for consistent comic generation.

**Request Body**:
```json
{
  "story": "Your story text...",
  "style": "cartoon"
}
```

#### **POST `/api/prompts`**
Generate detailed visual-only image prompts for each scene.

**Note**: Prompts are optimized for pure visual content generation without any text, dialogue, or speech elements.

**Request Body**:
```json
{
  "scenes": ["Scene 1...", "Scene 2..."],
  "styleGuide": "Style guide text...",
  "style": "anime",
  "sessionId": "optional_session_id"
}
```

#### **POST `/api/images`**
Generate comic panel images from visual prompts (text-free).

**Note**: Generated images focus purely on visual storytelling without embedded text or dialogue.

**Request Body**:
```json
{
  "prompts": ["Visual prompt 1...", "Visual prompt 2..."],
  "sessionId": "optional_session_id"
}
```

**Response**:
```json
{
  "images": ["/images/scene_0.png", "/images/scene_1.png"],
  "success": true
}
```

#### **GET/POST `/api/export`**
Download the generated comic as a PDF.

### Library Management

#### **GET `/api/library`**
Get all saved comics.

**Response**:
```json
{
  "comics": [
    {
      "id": "uuid",
      "title": "My Comic",
      "story": "Story text...",
      "style": "manga",
      "createdAt": "2025-07-08T17:09:05.295Z",
      "thumbnail": "/images/scene_0.png"
    }
  ],
  "success": true
}
```

#### **POST `/api/library`**
Save a comic to the library.

**Request Body**:
```json
{
  "title": "My Amazing Comic",
  "story": "Story text...",
  "style": "manga",
  "scenes": ["Scene 1...", "Scene 2..."],
  "styleGuide": "Style guide...",
  "prompts": ["Prompt 1...", "Prompt 2..."],
  "images": ["/images/scene_0.png", "/images/scene_1.png"]
}
```

#### **GET `/api/library/:id`**
Get a specific comic from the library.

#### **PUT `/api/library/:id`**
Update a comic in the library.

#### **DELETE `/api/library/:id`**
Delete a comic from the library.

### Settings Management

#### **GET `/api/settings`**
Get current application settings.

**Response**:
```json
{
  "settings": {
    "defaultStyle": "manga",
    "highResMode": false,
    "maxConcurrency": 4,
    "defaultWordsPerScene": 35,
    "autoSave": true,
    "darkMode": false,
    "language": "en",
    "exportQuality": "high",
    "notifications": true
  },
  "success": true
}
```

#### **POST `/api/settings`**
Update application settings.

#### **POST `/api/settings/reset`**
Reset settings to defaults.

#### **GET `/api/settings/styles`**
Get available comic styles.

**Response**:
```json
{
  "styles": [
    {
      "id": "manga",
      "name": "Manga",
      "description": "Japanese comic style with detailed line art"
    },
    {
      "id": "cartoon",
      "name": "Cartoon", 
      "description": "Colorful, fun cartoon style"
    }
  ],
  "success": true
}
```

### System Endpoints

#### **GET `/health`**
Basic health check.

#### **GET `/api/status`**
Comprehensive API status with endpoint documentation.

## 📁 File Structure

```
backend/
├── server.ts                 # Main Express server
├── routes/
│   ├── generate.ts           # Story processing and initialization  
│   ├── scenes.ts             # Story splitting
│   ├── style-guide.ts        # Style guide generation
│   ├── prompts.ts            # Prompt generation
│   ├── images.ts             # Image generation
│   ├── export.ts             # PDF export
│   ├── library.ts            # Library management
│   └── settings.ts           # Settings management
├── utils/
│   ├── gemini.ts             # Gemini AI client wrapper
│   ├── sceneSplitter.ts      # Story splitting logic
│   ├── promptBuilder.ts      # Prompt generation logic
│   ├── imageGen.ts           # Image generation logic
│   └── pdfMaker.ts           # PDF creation logic
├── middleware/
│   ├── validation.ts         # Request validation
│   └── rateLimiter.ts        # Rate limiting
├── types/
│   └── api.ts                # TypeScript API definitions
├── generated/                # Generated images and PDFs
├── library/                  # Saved comics data
├── settings/                 # Application settings
├── package.json
├── .env
└── README.md
```

## 🔒 Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Generation**: 10 requests per minute
- **Images**: 5 requests per 5 minutes
- **Library**: 30 requests per minute

### Input Validation
All endpoints have comprehensive validation for:
- Required fields
- Data types
- String lengths
- Number ranges
- Array sizes
- Custom validation rules

### CORS Configuration
Configured for Next.js frontend integration:
- `http://localhost:3000` (Next.js default)
- `http://localhost:3001` (Backend)
- Credentials support
- Secure headers

## 🎨 Comic Styles Available

1. **Manga** - Japanese comic style with detailed line art
2. **Cartoon** - Colorful, fun cartoon style
3. **Superhero** - Dynamic superhero comic style
4. **Realistic** - Photorealistic style
5. **Watercolor** - Soft watercolor painting style
6. **Film Noir** - Black and white dramatic style
7. **Pixel Art** - Retro pixel art style
8. **Fantasy** - Magical fantasy style

## 🔄 Session Management

The backend maintains session state for comic generation:
- **In-memory storage** for development
- **Session-based workflow** for multi-step generation
- **Auto-cleanup** of old sessions
- **Session persistence** across API calls

## 📱 Frontend Integration

Perfect for React/Next.js frontends:
- **RESTful API design**
- **JSON responses**
- **Static file serving** for images
- **CORS enabled**
- **TypeScript types** available

### Frontend Environment Setup
Add to your Next.js `.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 🛠 Technologies Used

- **Bun**: JavaScript runtime and package manager
- **Express**: Web framework
- **Google Generative AI**: Text and image generation
- **Sharp**: Image processing
- **PDF-lib**: PDF creation
- **p-map**: Parallel processing utility
- **express-rate-limit**: API rate limiting
- **UUID**: Unique identifier generation

## 🔧 Development Notes

- Images currently use enhanced placeholder generation
- Replace placeholder generation with actual Gemini image API calls
- Consider Redis for session management in production
- Add authentication middleware for production deployment
- Implement proper logging and monitoring
- Add database integration for persistent storage

## 🚀 Production Deployment

For production deployment:

1. **Environment Variables**:
   ```
   GEMINI_API_KEY=your_production_key
   NODE_ENV=production
   PORT=3001
   ```

2. **Process Management**:
   ```bash
   # Using PM2
   bun add -g pm2
   pm2 start server.ts --name autotoon-backend
   ```

3. **Reverse Proxy** (Nginx):
   ```nginx
   location /api {
       proxy_pass http://localhost:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```nstall dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
