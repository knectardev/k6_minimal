require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (your site)
app.use(express.static(__dirname));

// API endpoint to update menu.json
app.post('/api/update-menu', (req, res) => {
  const auth = req.headers['x-edit-secret'];
  if (auth !== process.env.EDIT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const menuPath = path.join(__dirname, 'data', 'menu.json');
  try {
    fs.writeFileSync(menuPath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write file', details: err.message });
  }
});

// Proxy endpoint to keep ElevenLabs API key server-side
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Missing "text" field' });
    }

    const apiKey = process.env.ELEVEN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server not configured with ELEVEN_API_KEY' });
    }

    const voiceId = process.env.ELEVEN_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default "Rachel"

    // Call ElevenLabs TTS
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
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(500).json({ error: 'ElevenLabs request failed', details: errText });
    }

    const audioBuffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});