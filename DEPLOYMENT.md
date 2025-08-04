# Static Deployment Guide

This guide covers deploying the Knectar portfolio as a static website without the TTS (Text-to-Speech) functionality.

## What's Included in Static Deployment

✅ **Full website functionality** - All pages, navigation, and features  
✅ **Project galleries and details** - Complete project showcase  
✅ **Responsive design** - Works on all devices  
✅ **Fast loading** - Optimized static files  
❌ **TTS audio** - Audio widget will be hidden automatically  

## Deployment Steps

### 1. Prepare Files for Upload

Upload these files and folders to your web server:
```
├── index.html
├── about.html
├── projects.html
├── project.html
├── tools.html
├── contact.html
├── css/
├── js/
├── assets/
├── project_images/
├── project_tiles/
├── about/
├── data/
├── includes/
└── robots.txt
```

### 2. What NOT to Upload

Do NOT upload these files (they're for local development only):
```
├── server.js
├── package.json
├── package-lock.json
├── .env
├── node_modules/
└── tts_cache/
```

### 3. Server Configuration

Ensure your web server:
- Serves static files correctly
- Has proper MIME types for `.js`, `.css`, `.json` files
- Supports clean URLs (optional but recommended)

### 4. Verify Deployment

After uploading:
1. Check that all pages load correctly
2. Verify project galleries work
3. Test navigation and links
4. Confirm responsive design works on mobile

## TTS Behavior on Static Deployment

When deployed as a static site:
- The TTS widget will automatically hide itself
- No error messages will be shown to users
- The site will function normally without audio features
- Console logs will indicate "Static deployment detected"

## Local Development with TTS

To test TTS functionality locally:
1. Install Node.js dependencies: `npm install`
2. Create `.env` file with your ElevenLabs API key
3. Start the server: `npm start`
4. Access at `http://localhost:8000`

## Troubleshooting

### Common Issues

**404 errors on project pages:**
- Ensure your server supports clean URLs
- Check that `project.html` is accessible

**Missing images:**
- Verify all image folders are uploaded
- Check file paths are correct

**JavaScript errors:**
- Ensure `.js` files have correct MIME type
- Check browser console for specific errors

### Support

For deployment issues, check:
1. Browser console for JavaScript errors
2. Server error logs
3. File permissions and paths 