const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;
const FLAG = process.env.FLAG || fs.readFileSync(path.join(__dirname, '../flag.txt'), 'utf8').trim() || 'nerdCTF{user_enum_success_10293}';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database
const users = ['johndoe', 'janedoe', 'system_admin_09', 'testuser', 'guest'];

// Vulnerable Forgot Password Endpoint
app.post('/api/forgot-password', (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // VULNERABILITY: Information disclosure
    // Responses differ based on user existence, allowing enumeration
    if (users.includes(username)) {
        // Simulate email sending delay
        setTimeout(() => {
            return res.json({ message: 'Password reset link sent to registered email address.' });
        }, 100);
    } else {
        // Instant response revealing user does not exist
        return res.status(404).json({ error: 'Username does not exist in our system.' });
    }
});

// Secondary insecure endpoint to get the flag if the admin is found
app.get('/api/profile/:username', (req, res) => {
    const { username } = req.params;
    
    if (username === 'system_admin_09') {
        // In a real app, this would require auth. Here it's intentionally unprotected.
        return res.json({
            username: 'system_admin_09',
            role: 'Administrator',
            bio: 'System admin account.',
            secret_flag: FLAG
        });
    }
    
    if (users.includes(username)) {
        return res.json({
            username,
            role: 'User',
            bio: 'Standard user account.'
        });
    }

    return res.status(404).json({ error: 'Profile not found' });
});

app.listen(PORT, () => {
    console.log(`Lab 2 - Username Enumeration running on port ${PORT}`);
});
