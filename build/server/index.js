const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
// Use Azure's writable directory if available, else use local path
const DATA_FILE = process.env.DATA_FILE_PATH ||
  (process.env.WEBSITE_INSTANCE_ID
    ? path.join(process.env.HOME || 'D:/home', 'site', 'wwwroot', 'server', 'data.json')
    : path.join(__dirname, 'data.json'));


app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

// Helper: Read data from file
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { booths: [], customers: [] };
  }
}

// Helper: Write data to file atomically
function writeData(data) {
  const tmpFile = DATA_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

// GET all data
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST (replace) all data
app.post('/api/data', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid data format' });
  }
  try {
    writeData(data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// Serve static files from React build (AFTER API routes)
app.use(express.static(path.join(__dirname, '../build')));

// Fallback to React for any unknown route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
