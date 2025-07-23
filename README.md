# AutoToon - AI Comic Book Generator

An AI-powered full-stack application that generates comic books from text prompts using Google's Gemini AI and image generation APIs.

## Features

- **Story Generation**: Create compelling comic book stories from simple prompts
- **AI Image Generation**: Generate comic book style panels and scenes
- **PDF Export**: Compile generated content into downloadable PDF comic books
- **Library Management**: Save and manage your created comic books
- **Style Customization**: Choose from different comic book art styles
- **Real-time Processing**: Track generation progress in real-time

## Tech Stack

### Backend
- **Runtime**: Bun
- **Framework**: Express.js with TypeScript
- **AI Integration**: Google Gemini AI
- **Image Processing**: Sharp
- **PDF Generation**: PDF-lib
- **Rate Limiting**: Express Rate Limit

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Hooks
- **HTTP Client**: Axios

## Project Structure

```
/
├── backend/          # Express.js API server
│   ├── routes/       # API route handlers
│   ├── utils/        # Utility functions
│   ├── middleware/   # Express middleware
│   ├── types/        # TypeScript type definitions
│   └── generated/    # Generated comic content (gitignored)
└── frontend/         # Next.js web application
    ├── app/          # Next.js app directory
    ├── components/   # React components
    ├── hooks/        # Custom React hooks
    └── lib/          # Utility libraries
```

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed
- Google Gemini API key
- Image generation API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd autotoon
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   bun install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   bun install
   ```

4. **Environment Setup**
   
   Create `.env` files in both backend and frontend directories:
   
   **Backend (.env)**
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   ```
   
   **Frontend (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   bun run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   bun run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## API Endpoints

- `POST /api/generate` - Generate comic book story from prompt
- `POST /api/images` - Generate images for comic scenes
- `POST /api/export` - Export comic book as PDF
- `GET /api/library` - Get saved comic books
- `GET /api/health` - Health check endpoint

## Features in Detail

### Story Generation
- Input a simple prompt or story idea
- AI generates a structured comic book narrative
- Automatic scene breakdown and panel descriptions

### Image Generation
- Creates comic book style artwork for each scene
- Consistent character representation across panels
- Various art styles and themes available

### Library Management
- Save generated comic books
- Browse previously created content
- Download comics as PDF files

## Development

### Backend Development
- The backend uses Bun as the runtime for improved performance
- TypeScript for type safety
- Express.js for the web framework
- Rate limiting to prevent API abuse

### Frontend Development
- Next.js 14 with App Router
- Tailwind CSS for styling
- Radix UI for accessible components
- Responsive design for mobile and desktop

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: Make sure to keep your API keys secure and never commit them to version control. The `.env` files are gitignored for security.
