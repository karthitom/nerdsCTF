const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8000;
const FLAG = process.env.FLAG || fs.readFileSync(path.join(__dirname, '../flag.txt'), 'utf8').trim() || 'nerdCTF{host_header_poisoning_pwned}';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Mock DB
const users = {
    'admin': { username: 'admin', email: 'admin@company.local', password: 'super_secret_password', secret: FLAG },
    'employee': { username: 'employee', email: 'employee@company.local', password: 'password', secret: 'No secrets here.' }
};

const resetTokens = {}; // token -> username

// Simulated Mail Server Queue
const mailQueue = [];

// Forgot Password Endpoint
app.post('/api/forgot-password', (req, res) => {
    const { username } = req.body;
    
    if (!username || !users[username]) {
        return res.json({ message: 'If the username exists, a reset link was sent.' });
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    resetTokens[token] = username;

    // VULNERABILITY: Blindly trusting the Host header to generate the URL
    const host = req.headers.host; 
    const resetLink = `http://${host}/api/reset-password?token=${token}`;

    console.log(`[MAIL SERVER] Sending email to ${users[username].email} with link: ${resetLink}`);
    
    // Queue the mail for the automated admin bot to "click"
    if (username === 'admin') {
        mailQueue.push(resetLink);
    }

    return res.json({ message: 'If the username exists, a reset link was sent.' });
});

// Reset Password Endpoint (GET for clicking the link, POST for actual reset)
app.get('/api/reset-password', (req, res) => {
    const { token } = req.query;
    if (resetTokens[token]) {
        res.send(`<h2>Reset Password</h2><p>Valid token. Send a POST request with the new password.</p>`);
    } else {
        res.status(400).send("Invalid or expired token");
    }
});

app.post('/api/reset-password', (req, res) => {
    const { token, new_password } = req.body;
    
    const username = resetTokens[token];
    if (username) {
        users[username].password = new_password;
        delete resetTokens[token];
        return res.json({ success: true, message: 'Password updated' });
    }
    
    return res.status(400).json({ error: 'Invalid token' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        res.cookie('session', username, { httpOnly: true });
        return res.json({ success: true, message: `Welcome ${username}` });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/profile', (req, res) => {
    const username = req.cookies.session;
    if (username && users[username]) {
        return res.json({ username, secret: users[username].secret });
    }
    return res.status(401).json({ error: 'Unauthorized' });
});

// Simulated Admin Bot - Checks mail queue every 10 seconds and "clicks" the links
setInterval(async () => {
    if (mailQueue.length > 0) {
        const link = mailQueue.shift();
        console.log(`[ADMIN BOT] Clicking link: ${link}`);
        try {
            // The bot visits the link (which might be pointing to an attacker's server!)
            await axios.get(link, { timeout: 3000 });
            console.log(`[ADMIN BOT] Visited ${link} successfully.`);
        } catch (err) {
            console.error(`[ADMIN BOT] Failed to visit ${link}: ${err.message}`);
        }
    }
}, 10000);

app.listen(PORT, () => {
    console.log(`Lab 5 - Password Reset Poisoning running on port ${PORT}`);
});
