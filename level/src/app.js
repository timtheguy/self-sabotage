'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;

const app = express();

// Configurations
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// CSP middleware 
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', `script-src 'self'; object-src 'none'; base-uri 'none';`);
    next();
});

// Simple HTML escaper to prevent stored XSS
function escapeHtml(text) {
    return text
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Sanitizer for our bio
function sanitizeBio(bio) {
    return bio.replace(/on\w+\s*=\s*['"][^'"]*['"]/gi, '');
}

// In-memory profile (no DB)
let profile = { username: 'testuser', bio: 'Welcome to my profile!' };

// Profile GET/POST
app.get('/profile', (req, res) => {
    const safeUsername = escapeHtml(profile.username);
    const safeBio = escapeHtml(profile.bio);

    res.status(200).send(`
        <html>
        <head><title>Profile Editor</title></head>
        <body style="font-family: sans-serif; background-color: #f0f2f5;">
            <h1>Profile Editor</h1>
            <p>Your changes will be reflected in the preview below.</p>
            <hr>
            <form method="POST" action="/profile">
                <b>Username:</b> <input name="username" value="${safeUsername}" /><br />
                <b>Bio:</b> <textarea name="bio" rows="4" cols="50">${safeBio}</textarea><br />
                <button type="submit">Save Profile</button>
            </form>
            <hr>
            <h2>Profile Preview</h2>
            <p><b>Viewing profile for:</b> <strong id="username-preview" style="color: #0056b3;">⏳ Loading...</strong></p> 
            <div id="bio-preview" style="border: 1px solid #ccc; padding: 10px; background-color: #fff;">${sanitizeBio(profile.bio)}</div>
            
            <script>
                // This script updates the username preview.
                (function() {
                    const username = "${safeUsername}";
                    const previewEl = document.getElementById('username-preview');
                    if (previewEl) {
                        previewEl.textContent = username;
                    }
                })();
            </script>
        </body>
        </html>
    `);
});

app.post('/profile', (req, res) => {
    profile.username = req.body.username || '';
    profile.bio = req.body.bio || '';
    res.redirect('/profile');
});

// JSONP endpoint
app.get('/api/get_user_info', (req, res) => {
    const callback = req.query.callback || '';
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(`${callback}(${JSON.stringify(profile)});`);
});

// Routes
app.get('/status', (req, res) => { res.status(200).end(); });
app.head('/status', (req, res) => { res.status(200).end(); });
app.get('/', (req, res) => { res.redirect('/profile'); });

// Minimal server setup
if (!module.parent) {
    app.listen(PORT, err => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log('Server is listening on port: '.concat(PORT));
    });
}
process.on('SIGINT', function() {
    process.exit();
});

module.exports = { app };