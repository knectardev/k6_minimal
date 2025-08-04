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
      // if (process.env.TTS_DEBUG) console.log('TTS cache hit:', hash);
    } else {
      // if (process.env.TTS_DEBUG) console.log('TTS cache miss:', hash);
      
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
    // console.log(`Server running at http://localhost:${PORT}`);
    // console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // console.log(`TTS Debug: ${process.env.TTS_DEBUG || 'disabled'}`);
});