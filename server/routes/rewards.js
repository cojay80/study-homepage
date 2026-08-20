const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

function localDayString(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

router.post('/daily-bonus', requireAuth, (req, res) => {
  const userId = Number(req.auth.sub);
  const day = localDayString();
  const amount = 100;

  db.serialize(() => {
    db.run('BEGIN IMMEDIATE TRANSACTION');

    db.get(
      'SELECT 1 as ok FROM daily_bonus_claims WHERE user_id = ? AND day = ?',
      [userId, day],
      (err, row) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to check daily bonus.' });
        }

        if (row) {
          db.run('ROLLBACK');
          return db.get('SELECT gold FROM users WHERE id = ?', [userId], (err2, user) => {
            if (err2 || !user) return res.status(500).json({ error: 'Failed to load gold.' });
            res.json({ alreadyClaimed: true, gold: Number(user.gold || 0), amount: 0, day });
          });
        }

        db.run(
          'INSERT INTO daily_bonus_claims (user_id, day) VALUES (?, ?)',
          [userId, day],
          (err3) => {
            if (err3) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to claim daily bonus.' });
            }

            db.run('UPDATE users SET gold = gold + ? WHERE id = ?', [amount, userId], (err4) => {
              if (err4) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to add gold.' });
              }

              db.run('COMMIT', (err5) => {
                if (err5) return res.status(500).json({ error: 'Failed to finalize daily bonus.' });
                db.get('SELECT gold FROM users WHERE id = ?', [userId], (err6, user) => {
                  if (err6 || !user) return res.status(500).json({ error: 'Failed to load gold.' });
                  res.json({ alreadyClaimed: false, gold: Number(user.gold || 0), amount, day });
                });
              });
            });
          }
        );
      }
    );
  });
});

module.exports = router;

