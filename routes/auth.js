const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name, address, phone } = req.body;

        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (user) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            db.run('INSERT INTO users (username, email, password, full_name, address, phone) VALUES (?, ?, ?, ?, ?, ?)',
                [username, email, hashedPassword, full_name, address, phone],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET, { expiresIn: '24h' });
                    res.status(201).json({
                        message: 'User created successfully',
                        token,
                        user: { id: this.lastID, username, email, full_name }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, full_name, address, phone FROM users WHERE id = ?', [req.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.userId = decoded.userId;
        next();
    });
}

module.exports = router;
