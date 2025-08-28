# Vercel Deployment Guide

This guide covers deploying the Knectar portfolio on Vercel.

## What's Included

✅ **Full website functionality** - All pages, navigation, and features  
✅ **Project galleries and details** - Complete project showcase  
✅ **Responsive design** - Works on all devices  
  
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
├── package.json
├── vercel.json
└── robots.txt
```





### 4. Deploy to Vercel

1. **Via Git (Recommended)**:
   ```bash
   git add .
   git commit -m "Deploy portfolio website"
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
3. Test all website functionality
4. Confirm responsive design works on mobile



## Local Development

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Access at `http://localhost:8000`

## Troubleshooting

### Common Issues



**404 errors on project pages:**
- Ensure all HTML files are uploaded
- Check Vercel routing configuration

**Missing images:**
- Verify all image folders are uploaded
- Check file paths are correct



### Support

For deployment issues:
1. Check Vercel function logs
2. Check browser console for errors 