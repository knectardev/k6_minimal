require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Embeds are framed by blog-post.html on this origin. Everything else stays unframeable.
  res.setHeader('X-Frame-Options', req.path.startsWith('/embeds/') ? 'SAMEORIGIN' : 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Middleware to parse JSON bodies with size limit
app.use(express.json({ limit: '1mb' }));

// Recover relative projects.html links from pretty project URLs
app.get('/project/:slug/projects.html', (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  res.redirect(302, '/projects.html' + (qs ? '?' + qs : ''));
});

// Pretty URL routes for local development (e.g., /project/<slug>/)
app.get('/project/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'project.html'));
});
app.get('/project/:slug/', (req, res) => {
  res.sendFile(path.join(__dirname, 'project.html'));
});

// Pretty routes for project category listing: /projects/<slug>/
app.get('/projects/:cat', (req, res) => {
  res.sendFile(path.join(__dirname, 'projects.html'));
});
app.get('/projects/:cat/', (req, res) => {
  res.sendFile(path.join(__dirname, 'projects.html'));
});

// Pretty routes for blog: /blog/ (list) and /blog/<slug>/ (post)
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog.html'));
});
app.get('/blog/', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog.html'));
});
app.get('/blog/:slug', (req, res) => {
  const generated = path.join(__dirname, 'blog', req.params.slug, 'index.html');
  if (fs.existsSync(generated)) {
    return res.sendFile(generated);
  }
  res.sendFile(path.join(__dirname, 'blog-post.html'));
});
app.get('/blog/:slug/', (req, res) => {
  const generated = path.join(__dirname, 'blog', req.params.slug, 'index.html');
  if (fs.existsSync(generated)) {
    return res.sendFile(generated);
  }
  res.sendFile(path.join(__dirname, 'blog-post.html'));
});

// Pretty routes for about and services pages
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});
app.get('/about/', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});
app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
});
app.get('/services/', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
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

// Export the app for Vercel
module.exports = app;

// Start the server only in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}