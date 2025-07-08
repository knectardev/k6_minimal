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
  console.log('Received secret:', auth, 'Expected:', process.env.EDIT_SECRET);
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});