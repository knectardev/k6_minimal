// Vercel serverless function for TTS
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

      const audioBuffer = await upstream.arrayBuffer();
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(Buffer.from(audioBuffer));
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
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      timestamp: new Date().toISOString()
    });
  }
}; 