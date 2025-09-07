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

**Simple Git Deployment (Recommended)**:
```bash
git add .
git commit -m "Deploy portfolio website"
git push origin main
```

Vercel will automatically detect the push to main and deploy your changes.

**Alternative: Vercel CLI**:
```bash
npm i -g vercel
vercel --prod
```

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

**Deployment Failures:**
- Check that `vercel.json` has valid JSON syntax
- Ensure all required files are committed to git
- Verify environment variables are set in Vercel dashboard

**404 errors on project pages:**
- Ensure all HTML files are uploaded
- Check Vercel routing configuration in `vercel.json`

**Missing images:**
- Verify all image folders are uploaded
- Check file paths are correct

**Redirects not working:**
- Verify `vercel.json` redirect rules are properly formatted
- Check that redirects are deployed (not just committed locally)
- Test redirects after deployment completes

### Deployment Process

1. **Make changes locally**
2. **Commit to git**: `git add . && git commit -m "Your message"`
3. **Push to main**: `git push origin main`
4. **Vercel auto-deploys** from main branch
5. **Verify deployment** in Vercel dashboard

### Support

For deployment issues:
1. Check Vercel function logs in dashboard
2. Check browser console for errors
3. Verify all files are committed and pushed to main branch 