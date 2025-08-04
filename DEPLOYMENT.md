# Vercel Deployment Guide with TTS

This guide covers deploying the Knectar portfolio on Vercel with full TTS (Text-to-Speech) functionality.

## What's Included

✅ **Full website functionality** - All pages, navigation, and features  
✅ **Project galleries and details** - Complete project showcase  
✅ **Responsive design** - Works on all devices  
✅ **TTS audio** - ElevenLabs text-to-speech for project descriptions  
✅ **Fast loading** - Optimized static files with serverless functions  

## Deployment Steps

### 1. Prepare Files for Upload

Upload these files and folders to Vercel:
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
├── api/
│   └── tts.js
├── package.json
├── vercel.json
└── robots.txt
```

### 2. Required Files for TTS

Make sure these files are included:
```
├── api/tts.js          # Vercel serverless function
├── package.json        # Dependencies
└── vercel.json         # Vercel configuration
```

### 3. Environment Variables Setup

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Name**: `ELEVEN_API_KEY`
   - **Value**: Your ElevenLabs API key
   - **Environment**: Production, Preview, Development

### 4. Deploy to Vercel

1. **Via Git (Recommended)**:
   ```bash
   git add .
   git commit -m "Add TTS functionality"
   git push origin main
   ```

2. **Via Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Via Vercel Dashboard**:
   - Drag and drop your project folder
   - Configure environment variables
   - Deploy

### 5. Verify Deployment

After deployment:
1. Check that all pages load correctly
2. Verify project galleries work
3. Test TTS functionality on project pages
4. Confirm responsive design works on mobile

## TTS Behavior on Vercel

When deployed on Vercel:
- ✅ TTS widget is visible and functional
- ✅ Audio generates successfully
- ✅ Serverless functions handle API calls
- ✅ Environment variables secure your API key

## Local Development

To test TTS functionality locally:
1. Install dependencies: `npm install`
2. Create `.env` file with your ElevenLabs API key
3. Start the server: `npm start`
4. Access at `http://localhost:8000`

## Troubleshooting

### Common Issues

**TTS not working on Vercel:**
- Check environment variables are set correctly
- Verify `api/tts.js` file is uploaded
- Check Vercel function logs for errors

**404 errors on project pages:**
- Ensure all HTML files are uploaded
- Check Vercel routing configuration

**Missing images:**
- Verify all image folders are uploaded
- Check file paths are correct

### Vercel Function Logs

To debug TTS issues:
1. Go to Vercel dashboard
2. Navigate to "Functions" tab
3. Check logs for `/api/tts` function
4. Look for error messages or API responses

### Support

For deployment issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API key locally first
4. Check browser console for errors 