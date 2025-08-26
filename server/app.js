const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

// Serve admin files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Serve root index.html for redirects
app.use(express.static(path.join(__dirname, '../'), { index: 'index.html' }));

// Default route to public folder
app.get('/', (req, res) => {
    res.redirect('/public/');
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SAHABA_FILE = path.join(__dirname, '../data/sahaba.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
        const user = users.find(u => u.username === req.body.username);
        
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ username: user.username }, JWT_SECRET);
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all Sahaba
app.get('/api/sahaba', authenticateToken, async (req, res) => {
    try {
        const data = await fs.readFile(SAHABA_FILE, 'utf8');
        res.json(JSON.parse(data).sahaba);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load data' });
    }
});

// Public endpoint to get all Sahaba (no authentication required)
app.get('/api/sahaba/public', async (req, res) => {
    try {
        const data = await fs.readFile(SAHABA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        console.log('Fetched Sahaba data:', parsedData);
        res.json(parsedData.sahaba);
    } catch (error) {
        console.error('Error loading Sahaba:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

// Add new Sahabi
app.post('/api/sahaba', authenticateToken, async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(SAHABA_FILE, 'utf8'));
        const newSahabi = {
            id: data.sahaba.length + 1,
            ...req.body,
            slug: generateSlug(req.body.name)
        };
        
        data.sahaba.push(newSahabi);
        await fs.writeFile(SAHABA_FILE, JSON.stringify(data, null, 2));
        
        // Add logging
        console.log('New Sahabi saved:', newSahabi);
        console.log('Current data:', data);
        
        res.json(newSahabi);
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Update Sahabi
app.put('/api/sahaba/:id', authenticateToken, async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(SAHABA_FILE, 'utf8'));
        const index = data.sahaba.findIndex(s => s.id === parseInt(req.params.id));
        
        if (index !== -1) {
            data.sahaba[index] = { ...data.sahaba[index], ...req.body };
            await fs.writeFile(SAHABA_FILE, JSON.stringify(data, null, 2));
            res.json(data.sahaba[index]);
        } else {
            res.status(404).json({ error: 'Sahabi not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update data' });
    }
});

// Delete Sahabi
app.delete('/api/sahaba/:id', authenticateToken, async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(SAHABA_FILE, 'utf8'));
        data.sahaba = data.sahaba.filter(s => s.id !== parseInt(req.params.id));
        await fs.writeFile(SAHABA_FILE, JSON.stringify(data, null, 2));
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

function generateSlug(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

// 404 handler for missing pages
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Page Not Found - Tarajim for Kids</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #FFF9E9; color: #234638; }
                h1 { color: #2C5F2D; }
                a { color: #2C5F2D; text-decoration: none; font-weight: bold; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <h1>Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p><a href="/public/">Return to Home</a></p>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Main site: http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin/login.html`);
});
