const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Get All Levels with Status for User
function getLevelsForUser(userId, res) {
    const sql = `
        SELECT 
            q.id, 
            q.level, 
            q.subject,
            CASE 
                WHEN MAX(up.is_correct) = 1 THEN 'cleared'
                WHEN (q.level = 1) OR (
                    SELECT count(*) FROM user_progress up2 
                    JOIN quizzes q2 ON up2.quiz_id = q2.id 
                    WHERE up2.user_id = ? AND q2.subject = q.subject AND q2.level = q.level - 1 AND up2.is_correct = 1
                ) > 0 THEN 'open'
                ELSE 'locked'
            END as status
        FROM quizzes q
        LEFT JOIN user_progress up ON q.id = up.quiz_id AND up.user_id = ?
        GROUP BY q.id
        ORDER BY q.subject, q.level ASC
    `;

    db.all(sql, [userId, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
}

router.get('/levels', requireAuth, (req, res) => {
    const userId = Number(req.auth.sub);
    return getLevelsForUser(userId, res);
});

// Back-compat: Get All Levels with Status for User
router.get('/levels/:userId', requireAuth, (req, res) => {
    const userId = Number(req.params.userId);
    const authedId = Number(req.auth.sub);
    if (userId !== authedId) return res.status(403).json({ error: 'Forbidden' });
    return getLevelsForUser(userId, res);
});

// Submit Quiz Result
router.post('/submit', requireAuth, (req, res) => {
    const userId = Number(req.auth.sub);
    const { isCleared } = req.body;
    const quizId = req.body.quizId ?? req.body.levelId; // Back-compat with older clients

    if (!quizId) {
        return res.status(400).json({ error: 'quizId is required.' });
    }

    db.run(
        `INSERT INTO user_progress (user_id, quiz_id, is_correct) VALUES (?, ?, ?)`,
        [userId, quizId, isCleared ? 1 : 0],
        function (err) {
            if (err) {
                console.error('Progress save error:', err);
                return res.status(500).json({ error: 'Failed to save progress' });
            }

            const reward = isCleared ? 50 : 0;

            const finish = () => {
                db.get('SELECT gold FROM users WHERE id = ?', [userId], (err2, row) => {
                    if (err2 || !row) return res.status(500).json({ error: 'Failed to load gold.' });
                    res.json({
                        success: true,
                        message: isCleared ? 'Level Cleared!' : 'Try Again!',
                        reward,
                        gold: Number(row.gold || 0),
                    });
                });
            };

            if (!reward) return finish();

            db.run('UPDATE users SET gold = gold + ? WHERE id = ?', [reward, userId], (err3) => {
                if (err3) return res.status(500).json({ error: 'Failed to update gold.' });
                finish();
            });
        }
    );
});

// Get Quiz by ID (Primary Key)
// NOTE: Keep this last so it doesn't shadow routes like `/levels/:userId`.
router.get('/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM quizzes WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Quiz not found.' });
        }

        const quiz = {
            ...row,
            question_data: JSON.parse(row.question_data)
        };

        // Remove answer from response for security
        delete quiz.answer;

        res.json(quiz);
    });
});

module.exports = router;
