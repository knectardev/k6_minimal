# Knectar Portfolio

A modern, responsive portfolio website showcasing web development and design projects.

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js with Express.js
- **APIs**: ElevenLabs TTS, TinyPNG
- **Deployment**: Static hosting with server-side components
- **Content Management**: JSON-based with API endpoints

## Features

- **Interactive Design**: Dynamic lines animation and modern UI
- **Project Showcase**: Comprehensive portfolio with categorized projects
- **Responsive Layout**: Mobile-first design approach
- **Performance Optimized**: Optimized images and assets
- **Content Management**: Server-side menu editing system
- **TTS Integration**: ElevenLabs text-to-speech with caching
- **Dynamic Navigation**: JSON-driven menu system

## Development Workflow

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see Environment Configuration)
4. Start development server: `npm start` (runs server.js)
5. Open `http://localhost:8000` in a web browser

### Content Updates

- **Menu Management**: Use `edit.html` interface for menu updates
- **Image Optimization**: Run optimization scripts as needed
- **Content Versioning**: Git-based content tracking

### Required Python Packages

```bash
pip install requests
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Required for menu editing authentication
EDIT_SECRET=your-secure-secret-here

# Required for TTS functionality
ELEVEN_API_KEY=your-elevenlabs-api-key

# Optional: Voice ID for TTS (default: "Rachel")
ELEVEN_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Optional: Enable TTS debugging
TTS_DEBUG=true
```

## Image Optimization

This project includes automated image optimization using the TinyPNG API to reduce file sizes while preserving quality.

### Optimization Process

The project uses a conservative approach to image optimization:

- **Size Threshold**: Only optimizes files larger than 200KB
- **Quality Preservation**: Skips files that would lose more than 30% of their size (to preserve quality)
- **Supported Formats**: PNG, JPG, JPEG, WebP
- **API Integration**: Uses TinyPNG API for professional-grade optimization

### Optimization Scripts

Several scripts are available for image optimization:

- `scripts/optimize_conservative.py` - Main conservative optimization script
- `scripts/test_conservative.py` - Test script for conservative approach
- `scripts/test_smaller_file.py` - Test script for smaller files
- `scripts/debug_optimization.py` - Debug script for API troubleshooting

### Usage

To optimize project tile images:

```bash
# Test the optimization process first
python scripts/test_conservative.py

# Run the full conservative optimization
python scripts/optimize_conservative.py
```

### Findings

During testing, we discovered that TinyPNG's default optimization is quite aggressive:
- Files often see 60-75% size reduction
- This level of compression may affect image quality
- Conservative approach preserves quality by limiting reductions to 30%

### API Configuration

The optimization uses TinyPNG API with the following settings:
- API Key: Configured in scripts
- Rate Limiting: 0.5 second delays between requests
- Timeout: 30 seconds per request
- Error Handling: Comprehensive error checking and reporting

## Project Structure

```
K6_MINIMAL/
├── assets/              # Site assets and icons
├── css/                 # Stylesheets
├── data/                # JSON data files
├── js/                  # JavaScript files
├── project_tiles/       # Project thumbnail images (optimized)
├── scripts/             # Image optimization scripts
├── server.js            # Express.js server
├── package.json         # Node.js dependencies
└── index.html           # Main homepage
```

## API Endpoints

### Menu Management
- `POST /api/update-menu` - Update menu.json (requires EDIT_SECRET)

### Text-to-Speech
- `POST /api/tts` - Generate TTS audio (requires ELEVEN_API_KEY)

## Security Considerations

- API keys are stored in environment variables
- Menu updates require authentication via EDIT_SECRET
- TTS requests are proxied to keep API keys server-side
- Input validation on all API endpoints

## Performance Features

- **Image Optimization**: Automated compression pipeline
- **TTS Caching**: Audio files cached to reduce API calls
- **Static Asset Serving**: Optimized delivery of CSS/JS/images
- **Responsive Images**: Multiple formats and sizes

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design
- Progressive enhancement approach

## License

This project is proprietary to Knectar.

## Contact

For questions about this portfolio or optimization process, contact the development team.
 