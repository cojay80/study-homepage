const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const bcrypt = require('bcryptjs');
const { signUserToken, requireAuth } = require('../middleware/auth');

// Register Endpoint
router.post('/register', (req, res) => {
    const { username, password, parent_pin, invite_code } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const requiredCode = process.env.REGISTRATION_CODE;
    if (requiredCode && invite_code !== requiredCode) {
        return res.status(403).json({ error: 'Invalid invite code.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const parent_pin_hash = parent_pin ? bcrypt.hashSync(String(parent_pin), 10) : null;

    const sql = `INSERT INTO users (username, password_hash, parent_pin) VALUES (?, ?, ?)`;

    db.run(sql, [username, password_hash, parent_pin_hash], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: 'User registered successfully.',
            userId: this.lastID
        });

        // Ensure default settings row exists
        db.run('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)', [this.lastID]);
    });
});

// Login Endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT * FROM users WHERE username = ?`;

    db.get(sql, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const storedHash = String(user.password_hash || '');
        const isBcryptHash = storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$');

        let ok = false;
        if (isBcryptHash) {
            ok = bcrypt.compareSync(password, storedHash);
        } else {
            // Back-compat: older DBs may have stored plain text
            ok = storedHash === password;
            if (ok) {
                const upgradedHash = bcrypt.hashSync(password, 10);
                db.run('UPDATE users SET password_hash = ? WHERE id = ?', [upgradedHash, user.id]);
            }
        }

        if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

        // Ensure default settings row exists
        db.run('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)', [user.id]);

        const token = signUserToken(user);
        res.json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                username: user.username,
                gold: user.gold
            }
        });
    });
});

router.get('/me', requireAuth, (req, res) => {
    const userId = Number(req.auth.sub);
    db.get('SELECT id, username, gold, created_at FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user });
    });
});

module.exports = router;
