# VidForge - Autonomous YouTube Content Creation Platform

VidForge is a comprehensive, node-based AI content creation platform that automates the entire YouTube content creation workflow from research to publishing.

## Features

### 🔬 Research & Analysis
- **Trend Research**: Analyze YouTube trends and keywords
- **Content Research**: Deep web research and data collection
- **AI Analysis**: Advanced content analysis and optimization
- **Research & Revise**: AI-powered content revision and improvement

### 🎬 Content Creation
- **Script Generator**: Generate optimized video scripts
- **Voice Generator**: ElevenLabs text-to-speech integration
- **Character Animator**: Hedra Character 3 animation
- **Video Generator**: Automated video content creation

### 🎨 Visual & Audio Processing
- **Image Generator**: AI-powered image creation
- **ComfyUI Workflow**: Connect to ComfyUI workflows
- **Visual Effects**: Advanced video effects processing
- **Audio Processor**: Audio editing and enhancement
- **Music Generator**: AI background music creation

### ⚙️ Processing & Enhancement
- **Media Processor**: Process and optimize media files
- **Batch Processor**: Process multiple files simultaneously
- **Quality Enhancer**: Upscale and enhance media quality

### 📤 Export & Publishing
- **Export & Publisher**: Export and publish to platforms
- **Cloud Storage**: Save to cloud storage services
- **Analytics Tracker**: Track performance and analytics

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vidforge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev:full
   ```

   This will start both the frontend (Vite) and backend (Express) servers concurrently.

## API Keys Required

### Essential APIs
- **OpenAI API Key**: Required for AI-powered content generation, script writing, and analysis
- **ElevenLabs API Key**: Required for text-to-speech voice generation

### Optional APIs
- **YouTube API Key**: For real trend data (falls back to mock data if not provided)
- **Hedra API Key**: For character animation (Character 3)
- **ComfyUI Server URL**: For connecting to ComfyUI workflows (default: http://localhost:8188)

## Getting API Keys

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### ElevenLabs
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Create an account or sign in
3. Go to Profile Settings
4. Copy your API key (starts with `sk_`)

### YouTube Data API
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key (starts with `AIza`)

### Hedra
1. Visit [Hedra](https://hedra.com/)
2. Create an account and get API access
3. Copy your API key (starts with `hdr_`)

## Usage

1. **Configure API Keys**: Click the Settings button and enter your API keys
2. **Build Workflow**: Drag nodes from the sidebar to the canvas
3. **Configure Nodes**: Click on nodes to configure their properties
4. **Connect Nodes**: Create connections between nodes (coming soon)
5. **Run Workflow**: Click "Start Workflow" to execute the pipeline

## Node Types

### Research Nodes
- **Trend Research**: Analyze YouTube trends for keywords
- **Content Research**: Comprehensive topic research
- **Research & Revise**: AI-powered content revision

### Content Nodes
- **Script Generator**: Generate video scripts
- **AI Analysis**: Analyze and optimize content

### Audio Nodes
- **Voice Generator**: Convert text to speech
- **Audio Processor**: Edit and enhance audio
- **Music Generator**: Create background music

### Video Nodes
- **Character Animator**: Animate characters with Hedra
- **Video Generator**: Create video content
- **Visual Effects**: Apply video effects

### Visual Nodes
- **Image Generator**: Create AI images
- **ComfyUI Workflow**: Run ComfyUI workflows

### Processing Nodes
- **Media Processor**: Process media files
- **Batch Processor**: Batch process files
- **Quality Enhancer**: Enhance media quality

### Output Nodes
- **Export & Publisher**: Publish to platforms
- **Cloud Storage**: Save to cloud storage
- **Analytics Tracker**: Track performance

## Architecture

### Frontend (React + TypeScript)
- Modern React application with TypeScript
- Drag-and-drop node-based interface
- Real-time WebSocket updates
- Responsive design with Tailwind CSS

### Backend (Node.js + Express)
- RESTful API with Express.js
- WebSocket support for real-time updates
- File upload and processing
- API integration with multiple services

### Key Technologies
- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, WebSocket, Multer
- **APIs**: OpenAI, ElevenLabs, YouTube Data API, Hedra
- **Build Tools**: Vite, ESLint, PostCSS

## Development

### Project Structure
```
vidforge/
├── src/                 # Frontend React application
├── server/              # Backend Express server
│   ├── index.js        # Main server file
│   ├── utils/          # Utility functions
│   ├── middleware/     # Express middleware
│   └── config/         # Configuration files
├── public/             # Static assets
└── uploads/            # File uploads directory
```

### Available Scripts
- `npm run dev`: Start frontend development server
- `npm run server`: Start backend server
- `npm run dev:full`: Start both frontend and backend
- `npm run build`: Build for production
- `npm run preview`: Preview production build

### Adding New Nodes
1. Add node type to `nodeTypes` array in `App.tsx`
2. Implement node execution logic in `server/index.js`
3. Add node-specific properties in `renderNodeSpecificProperties`
4. Test the node functionality

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Set the following environment variables in production:
- `NODE_ENV=production`
- `PORT=3001`
- All API keys from `.env.example`

### Docker Support (Coming Soon)
Docker configuration will be added for easy deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

## Roadmap

- [ ] Node connection system
- [ ] Workflow templates
- [ ] User authentication
- [ ] Database integration
- [ ] Docker deployment
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] Collaborative editing