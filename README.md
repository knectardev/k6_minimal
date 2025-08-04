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

## Prerequisites

### Required Software
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Python 3.7+** - [Download here](https://python.org/) (for image optimization scripts)

### Required Accounts & API Keys
- **ElevenLabs Account** - [Sign up here](https://elevenlabs.io/) for TTS functionality
- **TinyPNG API Key** - [Get free API key here](https://tinypng.com/developers) for image optimization

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd K6_MINIMAL
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env

# Required for TTS functionality
ELEVEN_API_KEY=your-elevenlabs-api-key

# Optional: Voice ID for TTS (default: "Rachel")
ELEVEN_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Optional: Enable TTS debugging
TTS_DEBUG=true

# Optional: Server port (default: 8000)
PORT=8000

# Optional: Node environment
NODE_ENV=development
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Site
- Open http://localhost:8000
- The site will auto-reload on changes

## Development Workflow

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm run build      # Build project (runs image optimization)
npm run optimize-images    # Optimize project images
npm run test-optimization  # Test image optimization process
npm run deploy     # Build and deploy to production
```

### Local Development
1. **Make changes** to HTML, CSS, or JavaScript files
2. **Test changes** in browser (auto-reload enabled)
3. **Optimize images** when adding new project tiles
4. **Update menu data** via edit.html interface
5. **Commit changes** with descriptive messages

### Code Style Guidelines

#### JavaScript
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

#### HTML
- Use semantic HTML elements
- Include proper ARIA labels for accessibility
- Maintain consistent indentation
- Add alt text to all images

#### CSS
- Use CSS custom properties for theming
- Follow BEM methodology for class naming
- Keep selectors specific but not overly complex
- Use flexbox/grid for layouts

## Content Management

### Menu Structure
The site uses a JSON-driven menu system located in `data/menu.json`. Each menu item can have:
- `label`: Display name
- `icon`: SVG icon filename
- `url`: Link URL
- `submenu`: Array of sub-items
- `categoryDescription`: Category description
- `more`: Boolean to show "more..." link

### CMS System
The site includes a content management system with:
- **Authentication**: Secure login via `edit.html`
- **Real-time editing**: In-place content editing with Quill editor
- **Cache management**: Intelligent caching with version control
- **Data synchronization**: Automatic sync between browser cache and server

### Adding Projects
1. **Add project images** to `project_tiles/` directory
2. **Optimize images** using `npm run optimize-images`
3. **Update menu.json** via edit.html interface

### CMS Troubleshooting

#### Cache Issues
If you experience data synchronization problems:

1. **Clear Browser Cache**
   - Click the 🗑️ button in the edit banner
   - Or manually clear localStorage in browser dev tools

2. **Refresh from Server**
   - Click the 🔄 button in the edit banner
   - This forces a fresh download from the server

3. **Check Data Sources**
   - Browser cache: `menu_json_cache`
   - Edit cache: `menu_json_edits`
   - Server file: `data/menu.json`

#### Common Issues

**"Changes not appearing after save"**
- Clear cache and refresh page
- Check browser console for errors
- Verify server response in Network tab

**"Old data showing instead of new"**
- Use refresh cache button (🔄)
- Check if multiple browser tabs are open
- Clear all caches and reload

**"Edit mode not working"**
- Verify authentication is active
- Check if edit banner is visible
- Ensure you're logged in via `edit.html`

#### Data Flow
1. **Initial Load**: Server → Browser Cache → Page Display
2. **CMS Edit**: Page → Edit Cache → Server Save → Clear Caches
3. **Page Refresh**: Server → Fresh Cache → Updated Display

#### Manual Cache Management
```javascript
// In browser console (when logged in):
// Clear all caches
localStorage.clear();

// Refresh from server
window.menuDataManager.refreshFromServer();

// Check current data source
console.log(window.menuDataManager.getCurrentData());
```
4. **Add project details** including:
   - Project title and description
   - Role and technology used
   - Budget range and design partner
   - Project URL and cover image

### Image Optimization
The project includes automated image optimization:
- **Size threshold**: Only optimizes files > 200KB
- **Quality preservation**: Skips files that would lose > 30% size
- **Supported formats**: PNG, JPG, JPEG, WebP
- **API integration**: Uses TinyPNG API

```bash
# Test optimization first
npm run test-optimization

# Run full optimization
npm run optimize-images
```

## Deployment

### Option 1: Traditional Hosting (Apache/Nginx)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload files to server**
   - Upload all files except `node_modules/`
   - Ensure `server.js` is in the root directory

3. **Install production dependencies**
   ```bash
   npm install --production
   ```

4. **Configure environment variables**
   - Set up environment variables on your hosting platform
   - Ensure `ELEVEN_API_KEY` is configured

5. **Start the server**
   ```bash
   npm start
   ```

### Option 2: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure environment variables**
   - Go to Vercel dashboard
   - Add environment variables in project settings

### Option 3: Netlify Deployment

1. **Create netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = "."
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200
   ```

2. **Deploy via Git**
   - Connect your repository to Netlify
   - Configure environment variables in Netlify dashboard

### Option 4: Railway Deployment

1. **Connect repository**
   - Connect your Git repository to Railway

2. **Configure environment variables**
   - Add environment variables in Railway dashboard

3. **Deploy**
   - Railway will automatically deploy on push to main branch

## SSL/HTTPS Configuration

### Let's Encrypt (Recommended)

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot
   ```

2. **Obtain certificate**
   ```bash
   sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## API Endpoints



### Text-to-Speech
- `POST /api/tts` - Generate TTS audio (requires ELEVEN_API_KEY)

### Health Check
- `GET /api/health` - Server health status

## Security Considerations

- **API keys** are stored in environment variables

- **TTS requests** are proxied to keep API keys server-side
- **Input validation** on all API endpoints
- **Security headers** prevent XSS and clickjacking
- **Request size limits** prevent abuse

## Performance Features

- **Image Optimization**: Automated compression pipeline
- **TTS Caching**: Audio files cached to reduce API calls
- **Static Asset Serving**: Optimized delivery of CSS/JS/images
- **Responsive Images**: Multiple formats and sizes
- **Browser Caching**: Appropriate cache headers

## Monitoring and Maintenance

### Health Checks
- Monitor `/api/health` endpoint
- Set up uptime monitoring (UptimeRobot, Pingdom)

### Logs
- Monitor server logs for errors
- Check TTS cache directory size
- Review API usage and limits

### Updates
1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Restart server**
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env file
   - Kill existing process: `lsof -ti:8000 | xargs kill`

2. **TTS not working**
   - Check ELEVEN_API_KEY is set
   - Verify API key is valid
   - Check network connectivity



4. **Image optimization failing**
   - Check TinyPNG API key
   - Verify Python and requests package installed
   - Check file permissions

### Support
For issues, check:
- Server logs
- Environment variable configuration
- Network connectivity
- File permissions

## Contributing

### Development Setup
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following code style guidelines
4. **Test thoroughly** on multiple browsers and devices
5. **Commit with descriptive messages**: `git commit -m "feat: add new feature"`
6. **Push and create pull request**

### Areas for Contribution
- **Content Management**: Improve menu editing interface
- **Performance**: Optimize image loading, implement lazy loading
- **Accessibility**: Improve keyboard navigation, screen reader support
- **User Experience**: Add loading states, improve error handling
- **SEO**: Add structured data, improve meta tags
- **Testing**: Add unit tests, integration tests

### Code Review Process
1. **Automated checks** must pass
2. **At least one approval** from maintainers
3. **All conversations resolved**
4. **Squash and merge** when approved

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
├── sitemap.xml          # Search engine sitemap
├── robots.txt           # Crawler guidance
└── index.html           # Main homepage
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design
- Progressive enhancement approach

## License

This project is proprietary to Knectar.

## Contact

For questions about this portfolio or technical issues, contact the development team.
 
## TTS (Text-to-Speech) Setup

The portfolio includes ElevenLabs text-to-speech functionality for project descriptions.

### Local Development
1. Create a `.env` file in the root directory with:
   ```
   ELEVEN_API_KEY=your_elevenlabs_api_key_here
   ```
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Access the site at `http://localhost:8000`

### Production Deployment
To enable TTS on your production server:

1. **Deploy the Node.js application** (not just static files):
   - Upload `server.js`, `package.json`, and all dependencies
   - Install dependencies: `npm install --production`
   - Set up environment variables with your ElevenLabs API key
   - Start the server: `npm start`

2. **Alternative: Use a static-only deployment** (TTS will be disabled):
   - Upload only the HTML/CSS/JS files
   - The TTS widget will show "Audio unavailable" but the site will work normally

### Environment Variables
- `ELEVEN_API_KEY`: Your ElevenLabs API key (required for TTS)
- `ELEVEN_VOICE_ID`: Optional voice ID override (default: "Rachel")
- `TTS_DEBUG`: Set to "true" to enable debug logging
 