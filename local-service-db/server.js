const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Load DB
let db = {};
if (fs.existsSync(DB_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        db = {};
    }
}

// REST API for Firebase-like structure
app.get('/:node.json', (req, res) => {
    const node = req.params.node;
    res.json(db[node] || null);
});

app.put('/:node.json', (req, res) => {
    const node = req.params.node;
    db[node] = req.body;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Local Database Server running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👉 http://YOUR_PC_IP:${PORT} (for other devices on same network)`);
});
