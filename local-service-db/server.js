const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error("Database Error:", err.message);
    else console.log("✅ SQLite Database Connected.");
});

// Create tables if not exist (Generic store table for key-value pair simulation)
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)");
});

// APIs mimicking Firebase REST structure
app.get('/:node.json', (req, res) => {
    const node = req.params.node;
    db.get("SELECT value FROM store WHERE key = ?", [node], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row ? JSON.parse(row.value) : null);
    });
});

app.put('/:node.json', (req, res) => {
    const node = req.params.node;
    const value = JSON.stringify(req.body);
    db.run("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", [node, value], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'ok' });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 SQLite Local Server Running!
    ---------------------------------
    LOCAL:  http://localhost:${PORT}
    NETWORK: http://YOUR_PC_IP:${PORT}
    
    1. Find your IP: Run 'ipconfig' in CMD.
    2. Put the Network URL in App Settings.
    `);
});
