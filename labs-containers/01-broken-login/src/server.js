const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// Read the flag from environment variable or file
const FLAG = process.env.FLAG || fs.readFileSync(path.join(__dirname, '../flag.txt'), 'utf8').trim() || 'nerdCTF{default_flag_broken_login}';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock user database (Vulnerable: no rate limiting, predictable password)
const users = {
    'admin': 'admin123',
    'employee': 'password',
    'test': 'test'
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Simulate some delay to prevent instant brute-forcing crash, but allow rapid guessing
    setTimeout(() => {
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (users[username] && users[username] === password) {
            // Insecure logic: just return the flag if it's admin
            if (username === 'admin') {
                return res.json({ success: true, message: 'Welcome Administrator!', flag: FLAG });
            } else {
                return res.json({ success: true, message: `Welcome ${username}! You don't have access to the secret flag.` });
            }
        }

        return res.status(401).json({ error: 'Invalid credentials' });
    }, 50); // Small artificial delay
});

app.listen(PORT, () => {
    console.log(`Lab 1 - Broken Login running on port ${PORT}`);
});
