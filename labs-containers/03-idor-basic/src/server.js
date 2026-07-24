const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;
const FLAG = process.env.FLAG || fs.readFileSync(path.join(__dirname, '../flag.txt'), 'utf8').trim() || 'nerdCTF{idor_level_1_complete}';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database with numeric IDs
const users = {
    1: { id: 1, name: 'System Administrator', role: 'admin', secret: FLAG },
    2: { id: 2, name: 'Guest User', role: 'guest', secret: 'No secrets for guests.' },
    3: { id: 3, name: 'John Doe', role: 'employee', secret: 'My dog is cute.' }
};

// Simulate login for guest user to give them a valid session
app.post('/api/login', (req, res) => {
    // Automatically log them in as user ID 2 for the challenge
    res.cookie('session_id', 'user_2_token', { httpOnly: true });
    res.json({ success: true, message: 'Logged in as Guest User', userId: 2 });
});

// VULNERABLE ENDPOINT: Insecure Direct Object Reference
app.get('/api/users/:id', (req, res) => {
    // Check if they are logged in at all
    if (!req.cookies.session_id) {
        return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }

    const userId = parseInt(req.params.id);

    // VULNERABILITY: We check authentication, but NOT authorization!
    // We do NOT verify if req.cookies.session_id matches the requested userId.
    const userProfile = users[userId];

    if (userProfile) {
        return res.json(userProfile);
    } else {
        return res.status(404).json({ error: 'User not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Lab 3 - IDOR Basic running on port ${PORT}`);
});
