require('dotenv').config();
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Middleware to parse JSON bodies with size limit
app.use(express.json({ limit: '1mb' }));

// Social media crawler detection and Open Graph middleware
app.use('/project.html', async (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const itemSlug = req.query.item;
  
  // Check if this is a social media crawler
  const crawlerPatterns = [
    /facebookexternalhit/i,
    /linkedinbot/i,
    /twitterbot/i,
    /slackbot/i,
    /discordbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /skypeuri/i,
    /facebot/i,
    /ia_archiver/i,
  ];
  
  const isCrawler = crawlerPatterns.some(pattern => pattern.test(userAgent));
  
  // If it's a crawler and we have a project item, serve pre-rendered HTML
  if (isCrawler && itemSlug) {
    try {
      // Read menu data
      const menuData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/menu.json'), 'utf8'));
      
      // Find project data by slug
      function findBySlug(arr, targetSlug, parentLabel = null) {
        for (const entry of arr) {
          if (entry.slug && entry.slug === targetSlug) {
            return { item: entry, parentLabel };
          }
          if (entry.submenu) {
            const result = findBySlug(entry.submenu, targetSlug, entry.label);
            if (result) return result;
          }
        }
        return null;
      }
      
      const result = findBySlug(menuData, itemSlug);
      
      if (result) {
        const { item: projectData, parentLabel } = result;
        
        // Generate meta data
        const projectTitle = projectData.projectTitle || projectData.label || 'Project';
        const categoryPrefix = parentLabel ? `${parentLabel} - ` : '';
        const fullTitle = `${categoryPrefix}${projectTitle} | Knectar Portfolio`;
        
        // Create description from pageSummary
        let description = '';
        if (projectData.pageSummary) {
          let text = projectData.pageSummary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          if (text.length > 160) {
            text = text.substring(0, 160);
            const lastSpace = text.lastIndexOf(' ');
            if (lastSpace > 130) {
              text = text.substring(0, lastSpace);
            }
            text += '...';
          }
          description = text;
        }
        
        if (!description && projectData.role && projectData.technology) {
          description = `${projectData.role} project using ${projectData.technology}. View detailed case study and project information.`;
        } else if (!description) {
          description = `View detailed project information and case study for ${projectTitle} from Knectar's portfolio.`;
        }
        
        // Determine best image
        const baseUrl = req.protocol + '://' + req.get('host');
        let ogImage = `${baseUrl}/assets/logo.svg`;
        
        if (projectData.detailImages && projectData.detailImages.length > 0) {
          const firstDetailImage = projectData.detailImages[0];
          if (!firstDetailImage.match(/\.(mp4|webm|ogg)$/i)) {
            ogImage = `${baseUrl}/${firstDetailImage}`;
          }
        } else if (projectData.coverImage && !projectData.coverImage.match(/\.(mp4|webm|ogg)$/i)) {
          ogImage = `${baseUrl}/${projectData.coverImage}`;
        }
        
        const currentUrl = `${baseUrl}${req.originalUrl}`;
        
        // Read the original HTML file
        let html = fs.readFileSync(path.join(__dirname, 'project.html'), 'utf8');
        
        // Replace meta tags in the HTML
        html = html
          .replace(
            /<title>.*?<\/title>/i,
            `<title>${fullTitle}</title>`
          )
          .replace(
            /<meta name="description" content="[^"]*"/i,
            `<meta name="description" content="${description.replace(/"/g, '&quot;')}"`
          )
          .replace(
            /<meta property="og:title" content="[^"]*"/i,
            `<meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}"`
          )
          .replace(
            /<meta property="og:description" content="[^"]*"/i,
            `<meta property="og:description" content="${description.replace(/"/g, '&quot;')}"`
          )
          .replace(
            /<meta property="og:image" content="[^"]*"/i,
            `<meta property="og:image" content="${ogImage}"`
          )
          .replace(
            /<meta property="og:url" content="[^"]*"/i,
            `<meta property="og:url" content="${currentUrl}"`
          )
          .replace(
            /<meta property="twitter:title" content="[^"]*"/i,
            `<meta property="twitter:title" content="${fullTitle.replace(/"/g, '&quot;')}"`
          )
          .replace(
            /<meta property="twitter:description" content="[^"]*"/i,
            `<meta property="twitter:description" content="${description.replace(/"/g, '&quot;')}"`
          )
          .replace(
            /<meta property="twitter:image" content="[^"]*"/i,
            `<meta property="twitter:image" content="${ogImage}"`
          )
          .replace(
            /<link rel="canonical" href="[^"]*"/i,
            `<link rel="canonical" href="${currentUrl}"`
          );
        
        // Add debug comment for crawlers
        html = html.replace(
          '<head>',
          `<head>\n<!-- Pre-rendered for ${userAgent.substring(0, 50)} at ${new Date().toISOString()} -->`
        );
        
        console.log(`Serving pre-rendered content for crawler: ${userAgent.substring(0, 50)} - Project: ${projectTitle}`);
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return res.send(html);
      }
    } catch (error) {
      console.error('Error in crawler middleware:', error);
    }
  }
  
  // For non-crawlers or if no project found, continue to static file serving
  next();
});

// Serve static files (your site)
app.use(express.static(__dirname));

// Error handling middleware
const handleError = (error, context, res) => {
  console.error(`Error in ${context}:`, error);
  
  // Don't expose internal errors to client
  const clientMessage = 'An error occurred while processing your request';
  
  if (res) {
    res.status(500).json({ 
      error: clientMessage,
      timestamp: new Date().toISOString()
    });
  }
};




// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  handleError(err, 'global error handler', res);
});

// Start the server
app.listen(PORT, () => {
    // console.log(`Server running at http://localhost:${PORT}`);
    // console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
});