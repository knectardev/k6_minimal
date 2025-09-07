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

// Export the app for Vercel
module.exports = app;

// Start the server only in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}