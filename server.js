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

// Load redirect configuration
let redirectConfig = { redirects: { exact: {}, patterns: {}, wildcards: {} } };
try {
  const redirectPath = path.join(__dirname, 'redirects.json');
  if (fs.existsSync(redirectPath)) {
    redirectConfig = JSON.parse(fs.readFileSync(redirectPath, 'utf8'));
  }
} catch (error) {
  console.warn('Could not load redirects.json:', error.message);
}

// 301 Redirect middleware
app.use((req, res, next) => {
  const requestPath = req.path;
  
  // Check exact matches first
  if (redirectConfig.redirects.exact[requestPath]) {
    return res.redirect(301, redirectConfig.redirects.exact[requestPath]);
  }
  
  // Check pattern matches
  for (const [pattern, destination] of Object.entries(redirectConfig.redirects.patterns)) {
    if (requestPath === pattern) {
      return res.redirect(301, destination);
    }
  }
  
  // Check wildcard patterns
  for (const [pattern, destination] of Object.entries(redirectConfig.redirects.wildcards)) {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(requestPath)) {
        return res.redirect(301, destination);
      }
    }
  }
  
  // Handle trailing slash redirects for HTML files
  if (requestPath.endsWith('/') && requestPath !== '/') {
    const withoutSlash = requestPath.slice(0, -1);
    if (redirectConfig.redirects.exact[withoutSlash]) {
      return res.redirect(301, redirectConfig.redirects.exact[withoutSlash]);
    }
  }
  
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

// Input validation middleware
const validateMenuData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid menu data format');
  }
  
  if (!Array.isArray(data)) {
    throw new Error('Menu data must be an array');
  }
  
  // Enhanced structure validation
  for (const item of data) {
    if (!item.label || typeof item.label !== 'string') {
      throw new Error('Each menu item must have a valid label');
    }
    
    // Validate submenu structure if present
    if (item.submenu && Array.isArray(item.submenu)) {
      for (const subItem of item.submenu) {
        if (!subItem.slug || typeof subItem.slug !== 'string') {
          throw new Error('Each submenu item must have a valid slug');
        }
        
        // Ensure required fields are present for project items
        if (subItem.projectTitle && !subItem.coverImage) {
          console.warn(`Project ${subItem.slug} missing coverImage`);
        }
        
        if (subItem.projectTitle && !subItem.pageSummary) {
          console.warn(`Project ${subItem.slug} missing pageSummary`);
        }
      }
    }
  }
  
  return true;
};

// API endpoint to update menu.json
app.post('/api/update-menu', (req, res) => {
  try {
    const auth = req.headers['x-edit-secret'];
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (auth !== process.env.EDIT_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate input data
    try {
      validateMenuData(req.body);
    } catch (validationError) {
      return res.status(400).json({ 
        error: 'Invalid menu data',
        details: validationError.message 
      });
    }

    const menuPath = path.join(__dirname, 'data', 'menu.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(menuPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Smart backup strategy: only backup if content changed
    let shouldCreateBackup = false;
    let currentContent = '';
    
    if (fs.existsSync(menuPath)) {
      try {
        currentContent = fs.readFileSync(menuPath, 'utf8');
        const newContent = JSON.stringify(req.body, null, 2);
        shouldCreateBackup = currentContent !== newContent;
      } catch (readError) {
        console.warn('Could not read current menu for comparison:', readError);
        shouldCreateBackup = true; // Backup if we can't compare
      }
    } else {
      shouldCreateBackup = true; // Backup if file doesn't exist
    }
    
    if (shouldCreateBackup) {
      try {
        // Clean up old backups (keep only 3 most recent)
        const backupDir = path.dirname(menuPath);
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('menu_backup') && file.endsWith('.json'))
          .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time); // Sort by newest first
        
        // Remove old backups beyond the 3rd one
        if (backupFiles.length >= 3) {
          const filesToDelete = backupFiles.slice(3);
          filesToDelete.forEach(file => {
            try {
              fs.unlinkSync(file.path);
              console.log('Removed old backup:', file.name);
            } catch (deleteError) {
              console.warn('Failed to delete old backup:', file.name, deleteError);
            }
          });
        }
        
        // Create new backup
        const backupPath = path.join(__dirname, 'data', `menu_backup_${Date.now()}.json`);
        if (fs.existsSync(menuPath)) {
          fs.copyFileSync(menuPath, backupPath);
          console.log('Backup created:', path.basename(backupPath));
        }
      } catch (backupError) {
        console.warn('Backup creation failed:', backupError);
      }
    } else {
      console.log('No backup needed - content unchanged');
    }
    
    // Write file with error handling
    try {
      fs.writeFileSync(menuPath, JSON.stringify(req.body, null, 2), 'utf8');
      console.log('Menu updated successfully at', new Date().toISOString());
      res.json({ 
        success: true, 
        timestamp: new Date().toISOString(),
        message: 'Menu updated successfully'
      });
    } catch (writeError) {
      handleError(writeError, 'menu file write', res);
    }
  } catch (err) {
    handleError(err, 'menu update endpoint', res);
  }
});

// API endpoint to get menu.json with cache headers
app.get('/data/menu.json', (req, res) => {
  try {
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    
    if (!fs.existsSync(menuPath)) {
      return res.status(404).json({ error: 'Menu file not found' });
    }
    
    const stats = fs.statSync(menuPath);
    const content = fs.readFileSync(menuPath, 'utf8');
    
    // Set cache headers for better versioning
    res.setHeader('ETag', `"${stats.size}-${stats.mtime.getTime()}"`);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    
    res.setHeader('Content-Type', 'application/json');
    res.send(content);
  } catch (err) {
    handleError(err, 'menu.json serve', res);
  }
});

// Proxy endpoint to keep ElevenLabs API key server-side
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body || {};
    
    // Input validation
    if (!text) {
      return res.status(400).json({ 
        error: 'Missing "text" field',
        timestamp: new Date().toISOString()
      });
    }
    
    if (typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text field must be a string',
        timestamp: new Date().toISOString()
      });
    }
    
    if (text.length > 5000) {
      return res.status(400).json({ 
        error: 'Text too long (max 5000 characters)',
        timestamp: new Date().toISOString()
      });
    }

    const apiKey = process.env.ELEVEN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Server not configured with ELEVEN_API_KEY',
        timestamp: new Date().toISOString()
      });
    }

    const voiceId = process.env.ELEVEN_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default "Rachel"

    // Compute hash of the text for cache key
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    const cacheDir = path.join(__dirname, 'tts_cache');
    const cachePath = path.join(cacheDir, `${hash}.mp3`);

    let audioBuffer;
    if (fs.existsSync(cachePath)) {
      audioBuffer = fs.readFileSync(cachePath);
      if (process.env.TTS_DEBUG) console.log('TTS cache hit:', hash);
    } else {
      if (process.env.TTS_DEBUG) console.log('TTS cache miss:', hash);
      
      // Ensure cache directory exists
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Call ElevenLabs TTS with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.5 }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!upstream.ok) {
          const errText = await upstream.text();
          console.error('ElevenLabs API error:', upstream.status, errText);
          return res.status(500).json({ 
            error: 'TTS service unavailable',
            details: `API returned ${upstream.status}`,
            timestamp: new Date().toISOString()
          });
        }

        audioBuffer = Buffer.from(await upstream.arrayBuffer());
        
        // Save to cache (fire and forget)
        fs.writeFile(cachePath, audioBuffer, (writeError) => {
          if (writeError) {
            console.error('Cache write error:', writeError);
          }
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return res.status(408).json({ 
            error: 'TTS request timeout',
            timestamp: new Date().toISOString()
          });
        }
        throw fetchError;
      }
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(audioBuffer);
  } catch (err) {
    handleError(err, 'TTS proxy', res);
  }
});

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
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`TTS Debug: ${process.env.TTS_DEBUG || 'disabled'}`);
});