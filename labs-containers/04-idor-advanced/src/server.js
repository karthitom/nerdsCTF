const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8000;
const FLAG = process.env.FLAG || fs.readFileSync(path.join(__dirname, '../flag.txt'), 'utf8').trim() || 'nerdCTF{advanced_idor_master_4812}';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory SQLite Database
const db = new sqlite3.Database(':memory:');

const adminUuid = uuidv4();
const guestUuid = uuidv4();

db.serialize(() => {
    db.run("CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, password TEXT, role TEXT, secret TEXT)");
    
    const stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
    stmt.run(adminUuid, 'admin', 'super_complex_unguessable_password', 'admin', FLAG);
    stmt.run(guestUuid, 'guest', 'guest', 'guest', 'You need admin access to see the flag.');
    stmt.finalize();
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.cookie('session_id', row.id, { httpOnly: true });
        res.json({ success: true, message: `Logged in as ${row.username}` });
    });
});

// Public Directory Endpoint (Information Disclosure - leaks UUIDs)
app.get('/api/directory', (req, res) => {
    db.all("SELECT id, username, role FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Profile Endpoint
app.get('/api/profile', (req, res) => {
    const userId = req.cookies.session_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    db.get("SELECT username, role, secret FROM users WHERE id = ?", [userId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'User not found' });
        res.json(row);
    });
});

// VULNERABLE ENDPOINT: Update Password
app.put('/api/users/:id/password', (req, res) => {
    const sessionUserId = req.cookies.session_id;
    if (!sessionUserId) return res.status(401).json({ error: 'Unauthorized' });

    const targetUserId = req.params.id;
    const newPassword = req.body.password;

    if (!newPassword) return res.status(400).json({ error: 'Password is required' });

    // VULNERABILITY: IDOR on UPDATE
    // The server checks if the user is logged in, but fails to verify if 
    // the targetUserId matches the sessionUserId.
    // It assumes UUIDs are unguessable, but they are leaked in /api/directory!

    db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, targetUserId], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        
        res.json({ success: true, message: 'Password updated successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Lab 4 - IDOR Advanced running on port ${PORT}`);
});
