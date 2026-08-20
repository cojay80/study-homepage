const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAuth, requireParent, signParentToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { estimateCostUsd, isPricingConfigured } = require('../lib/aiPricing');

function parseMonthOrDefault(input) {
    const raw = String(input || '').trim();
    const m = raw.match(/^(\d{4})-(\d{2})$/);
    if (m) return raw;
    return new Date().toISOString().slice(0, 7);
}

function getUserSettings(userId) {
    return new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)', [userId], (err) => {
            if (err) return reject(err);
            db.get(
                'SELECT daily_limit_minutes, turns_per_minute FROM user_settings WHERE user_id = ?',
                [userId],
                (err2, row) => {
                    if (err2) return reject(err2);
                    resolve({
                        dailyLimitMinutes: row?.daily_limit_minutes ?? 60,
                        turnsPerMinute: row?.turns_per_minute ?? 10,
                    });
                }
            );
        });
    });
}

function getTurnsUsedToday(userId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT COUNT(*) as turns
             FROM ai_messages
             WHERE user_id = ?
               AND role = 'assistant'
               AND date(created_at) = date('now')`,
            [userId],
            (err, row) => {
                if (err) return reject(err);
                resolve(Number(row?.turns || 0));
            }
        );
    });
}

// Parent PIN verification -> parent JWT
router.post('/verify-pin', requireAuth, (req, res) => {
    const userId = Number(req.auth.sub);
    const pin = String(req.body?.pin || '').trim();
    if (!pin) return res.status(400).json({ error: 'pin is required.' });

    db.get('SELECT id, username, parent_pin FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const saved = String(user.parent_pin || '').trim();
        if (!saved) return res.status(400).json({ error: 'Parent PIN is not set for this account.' });
        const isBcryptHash = saved.startsWith('$2a$') || saved.startsWith('$2b$') || saved.startsWith('$2y$');
        let ok = false;
        if (isBcryptHash) {
            ok = bcrypt.compareSync(pin, saved);
        } else {
            // Back-compat: older DBs may have stored plain text
            ok = saved === pin;
            if (ok) {
                const upgraded = bcrypt.hashSync(pin, 10);
                db.run('UPDATE users SET parent_pin = ? WHERE id = ?', [upgraded, user.id]);
            }
        }
        if (!ok) return res.status(401).json({ error: 'Invalid PIN.' });

        const token = signParentToken(user);
        res.json({ token });
    });
});

// Set Parent PIN (if not set yet). Requires account password.
router.post('/set-pin', requireAuth, (req, res) => {
    const userId = Number(req.auth.sub);
    const password = String(req.body?.password || '');
    const newPin = String(req.body?.newPin || '').trim();

    if (!password) return res.status(400).json({ error: 'password is required.' });
    if (!newPin) return res.status(400).json({ error: 'newPin is required.' });
    if (newPin.length < 4 || newPin.length > 12) return res.status(400).json({ error: 'newPin must be 4..12 characters.' });

    db.get('SELECT id, username, password_hash, parent_pin FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const currentPin = String(user.parent_pin || '').trim();
        if (currentPin) return res.status(400).json({ error: 'Parent PIN is already set.' });

        const storedHash = String(user.password_hash || '');
        const ok = bcrypt.compareSync(password, storedHash);
        if (!ok) return res.status(401).json({ error: 'Invalid password.' });

        const hashed = bcrypt.hashSync(newPin, 10);
        db.run('UPDATE users SET parent_pin = ? WHERE id = ?', [hashed, userId], (err2) => {
            if (err2) return res.status(500).json({ error: 'Failed to set PIN.' });
            res.json({ success: true });
        });
    });
});

// Change Parent PIN (parent-only). Requires old PIN.
router.put('/change-pin', requireParent, (req, res) => {
    const userId = Number(req.auth.sub);
    const oldPin = String(req.body?.oldPin || '').trim();
    const newPin = String(req.body?.newPin || '').trim();

    if (!oldPin) return res.status(400).json({ error: 'oldPin is required.' });
    if (!newPin) return res.status(400).json({ error: 'newPin is required.' });
    if (newPin.length < 4 || newPin.length > 12) return res.status(400).json({ error: 'newPin must be 4..12 characters.' });

    db.get('SELECT parent_pin FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        const saved = String(user?.parent_pin || '').trim();
        if (!saved) return res.status(400).json({ error: 'Parent PIN is not set.' });

        const isBcryptHash = saved.startsWith('$2a$') || saved.startsWith('$2b$') || saved.startsWith('$2y$');
        const ok = isBcryptHash ? bcrypt.compareSync(oldPin, saved) : saved === oldPin;
        if (!ok) return res.status(401).json({ error: 'Invalid PIN.' });

        const hashed = bcrypt.hashSync(newPin, 10);
        db.run('UPDATE users SET parent_pin = ? WHERE id = ?', [hashed, userId], (err2) => {
            if (err2) return res.status(500).json({ error: 'Failed to change PIN.' });
            res.json({ success: true });
        });
    });
});

// Get settings (parent-only)
router.get('/settings', requireParent, async (req, res) => {
    try {
        const userId = Number(req.auth.sub);
        const settings = await getUserSettings(userId);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
});

// Update settings (parent-only)
router.put('/settings', requireParent, (req, res) => {
    const userId = Number(req.auth.sub);
    const dailyLimitMinutes = Number(req.body?.dailyLimitMinutes);
    if (!Number.isFinite(dailyLimitMinutes)) return res.status(400).json({ error: 'dailyLimitMinutes is required.' });
    if (dailyLimitMinutes < 10 || dailyLimitMinutes > 240) return res.status(400).json({ error: 'dailyLimitMinutes must be 10..240.' });

    db.run(
        `INSERT INTO user_settings (user_id, daily_limit_minutes, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET daily_limit_minutes = excluded.daily_limit_minutes, updated_at = CURRENT_TIMESTAMP`,
        [userId, dailyLimitMinutes],
        (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update settings.' });
            res.json({ success: true, dailyLimitMinutes });
        }
    );
});

// Parent report (quizzes)
router.get('/report', requireParent, (req, res) => {
    const userId = Number(req.auth.sub);

    const sqlStats = `
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count
        FROM user_progress 
        WHERE user_id = ?
    `;

    const sqlRecent = `
        SELECT 
          up.timestamp, 
          up.is_correct, 
          q.subject, 
          q.level 
        FROM user_progress up
        JOIN quizzes q ON up.quiz_id = q.id
        WHERE up.user_id = ?
        ORDER BY up.timestamp DESC
        LIMIT 10
    `;

    db.get(sqlStats, [userId], (err, stats) => {
        if (err) return res.status(500).json({ error: err.message });
        const totalAttempts = Number(stats?.total_attempts || 0);
        const correctCount = Number(stats?.correct_count || 0);
        const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

        db.all(sqlRecent, [userId], (err2, recent) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({
                overview: {
                    totalAttempts,
                    correctCount,
                    accuracy,
                    learningTime: totalAttempts * 2,
                },
                recentActivity: recent || [],
            });
        });
    });
});

// Parent AI report (english talk)
router.get('/ai-report', requireParent, async (req, res) => {
    try {
        const userId = Number(req.auth.sub);
        const settings = await getUserSettings(userId);
        const turnsUsedToday = await getTurnsUsedToday(userId);
        const allowedTurns = settings.dailyLimitMinutes * settings.turnsPerMinute;
        const remainingTurns = Math.max(0, allowedTurns - turnsUsedToday);
        const remainingMinutes = Math.floor(remainingTurns / settings.turnsPerMinute);

        db.get(
            `SELECT
                COALESCE(SUM(prompt_tokens), 0) as promptTokens,
                COALESCE(SUM(completion_tokens), 0) as completionTokens,
                COALESCE(SUM(total_tokens), 0) as totalTokens
             FROM ai_usage
             WHERE user_id = ?
               AND date(created_at) = date('now')`,
            [userId],
            (err0, usageRow) => {
                if (err0) return res.status(500).json({ error: 'Failed to fetch AI usage.' });

                db.all(
                    `SELECT provider, model,
                            COALESCE(SUM(prompt_tokens), 0) as promptTokens,
                            COALESCE(SUM(completion_tokens), 0) as completionTokens
                     FROM ai_usage
                     WHERE user_id = ?
                       AND date(created_at) = date('now')
                     GROUP BY provider, model`,
                    [userId],
                    (errCover, coverRows) => {
                        if (errCover) return res.status(500).json({ error: 'Failed to fetch AI usage.' });

                        const configured = isPricingConfigured();
                        let costTodayUsd = 0;
                        let totalModels = 0;
                        let modelsWithRates = 0;
                        for (const r of coverRows || []) {
                            totalModels += 1;
                            const cost = configured ? estimateCostUsd({
                                provider: r.provider,
                                model: r.model,
                                promptTokens: Number(r.promptTokens || 0),
                                completionTokens: Number(r.completionTokens || 0),
                            }) : null;
                            if (typeof cost === 'number') {
                                modelsWithRates += 1;
                                costTodayUsd += cost;
                            }
                        }

                db.all(
                    `SELECT role, text, difficulty, created_at
                     FROM ai_messages
                     WHERE user_id = ?
                     ORDER BY created_at DESC
                     LIMIT 20`,
                    [userId],
                    (err, rows) => {
                        if (err) return res.status(500).json({ error: 'Failed to fetch AI messages.' });
                        res.json({
                            usage: {
                                dailyLimitMinutes: settings.dailyLimitMinutes,
                                turnsPerMinute: settings.turnsPerMinute,
                                turnsUsedToday,
                                remainingMinutes,
                                pricingConfigured: configured,
                                tokensToday: {
                                    promptTokens: Number(usageRow?.promptTokens || 0),
                                    completionTokens: Number(usageRow?.completionTokens || 0),
                                    totalTokens: Number(usageRow?.totalTokens || 0),
                                },
                                costTodayUsd: configured ? costTodayUsd : null,
                                pricingCoverageToday: { totalModels, modelsWithRates },
                            },
                            recentMessages: (rows || []).reverse(),
                        });
                    }
                );
                    }
                );
            }
        );
    } catch (err) {
        console.error('Parent ai-report error:', err);
        res.status(500).json({ error: 'Failed to fetch AI report.' });
    }
});

// Monthly AI usage/cost report
router.get('/ai-cost', requireParent, (req, res) => {
    const userId = Number(req.auth.sub);
    const month = parseMonthOrDefault(req.query?.month);
    const configured = isPricingConfigured();

    db.all(
        `SELECT provider, model,
                COALESCE(SUM(prompt_tokens), 0) as promptTokens,
                COALESCE(SUM(completion_tokens), 0) as completionTokens,
                COALESCE(SUM(total_tokens), 0) as totalTokens,
                COALESCE(SUM(estimated_cost_usd), 0) as estimatedCostUsd
         FROM ai_usage
         WHERE user_id = ?
           AND strftime('%Y-%m', created_at) = ?
         GROUP BY provider, model
         ORDER BY provider ASC, model ASC`,
        [userId, month],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch monthly usage.' });

            const byModel = (rows || []).map((r) => ({
                provider: r.provider,
                model: r.model,
                promptTokens: Number(r.promptTokens || 0),
                completionTokens: Number(r.completionTokens || 0),
                totalTokens: Number(r.totalTokens || 0),
                estimatedCostUsd: configured ? estimateCostUsd({
                    provider: r.provider,
                    model: r.model,
                    promptTokens: Number(r.promptTokens || 0),
                    completionTokens: Number(r.completionTokens || 0),
                }) : null,
            }));

            const totals = byModel.reduce((acc, r) => {
                acc.promptTokens += r.promptTokens;
                acc.completionTokens += r.completionTokens;
                acc.totalTokens += r.totalTokens;
                if (configured && typeof r.estimatedCostUsd === 'number') acc.estimatedCostUsd += r.estimatedCostUsd;
                return acc;
            }, { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 });

            const pricingCoverage = byModel.reduce((acc, r) => {
                acc.totalModels += 1;
                if (typeof r.estimatedCostUsd === 'number') acc.modelsWithRates += 1;
                return acc;
            }, { totalModels: 0, modelsWithRates: 0 });

            db.all(
                `SELECT date(created_at) as day, provider, model,
                        COALESCE(SUM(prompt_tokens), 0) as promptTokens,
                        COALESCE(SUM(completion_tokens), 0) as completionTokens,
                        COALESCE(SUM(total_tokens), 0) as totalTokens
                 FROM ai_usage
                 WHERE user_id = ?
                   AND strftime('%Y-%m', created_at) = ?
                 GROUP BY date(created_at), provider, model
                 ORDER BY day ASC, provider ASC, model ASC`,
                [userId, month],
                (err2, dailyRows) => {
                    if (err2) return res.status(500).json({ error: 'Failed to fetch daily usage.' });

                    const dayMap = new Map();
                    for (const d of dailyRows || []) {
                        const day = String(d.day || '');
                        if (!day) continue;
                        const prev = dayMap.get(day) || { day, promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };
                        const pTok = Number(d.promptTokens || 0);
                        const cTok = Number(d.completionTokens || 0);
                        const tTok = Number(d.totalTokens || 0);
                        const cost = configured ? estimateCostUsd({
                            provider: d.provider,
                            model: d.model,
                            promptTokens: pTok,
                            completionTokens: cTok,
                        }) : null;
                        prev.promptTokens += pTok;
                        prev.completionTokens += cTok;
                        prev.totalTokens += tTok;
                        if (typeof cost === 'number') prev.estimatedCostUsd += cost;
                        dayMap.set(day, prev);
                    }

                    const daily = Array.from(dayMap.values()).map((d) => ({
                        day: d.day,
                        promptTokens: d.promptTokens,
                        completionTokens: d.completionTokens,
                        totalTokens: d.totalTokens,
                        estimatedCostUsd: configured ? d.estimatedCostUsd : null,
                    }));

                    res.json({
                        month,
                        pricingConfigured: configured,
                        pricingCoverage,
                        totals: {
                            ...totals,
                            estimatedCostUsd: configured ? totals.estimatedCostUsd : null,
                        },
                        byModel,
                        daily,
                    });
                }
            );
        }
    );
});

router.post('/ai-summary', requireParent, (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });

    const userId = Number(req.auth.sub);
    const day = String(req.body?.day || '').trim() || new Date().toISOString().slice(0, 10);

    db.get(
        'SELECT summary_kr, summary_en, new_words_json, created_at FROM ai_daily_summaries WHERE user_id = ? AND day = ?',
        [userId, day],
        async (err, cached) => {
            if (err) return res.status(500).json({ error: 'Failed to read cache.' });
            if (cached && req.body?.force !== true) {
                return res.json({
                    day,
                    cached: true,
                    summary_kr: cached.summary_kr,
                    summary_en: cached.summary_en,
                    newWords: JSON.parse(cached.new_words_json),
                    created_at: cached.created_at,
                });
            }

            db.all(
                `SELECT role, text, difficulty, created_at
                 FROM ai_messages
                 WHERE user_id = ?
                   AND date(created_at) = date(?)
                 ORDER BY created_at ASC
                 LIMIT 80`,
                [userId, day],
                async (err2, rows) => {
                    if (err2) return res.status(500).json({ error: 'Failed to fetch messages.' });
                    const msgs = rows || [];
                    if (msgs.length === 0) return res.status(400).json({ error: 'No AI messages for that day.' });

                    try {
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const model = genAI.getGenerativeModel({
                            model: 'gemini-1.5-flash',
                            systemInstruction: [
                                'You are a helpful assistant for parents reviewing a child\'s English conversation practice.',
                                'Return ONLY valid JSON. Do not wrap in markdown.',
                                'JSON schema:',
                                '{ "summary_kr": string, "summary_en": string, "new_words": [ { "word": string, "meaning_kr": string, "example_en": string } ] }',
                                'Constraints:',
                                '- summary_kr: 2-4 short lines in Korean.',
                                '- summary_en: 2-4 short lines in easy English.',
                                '- new_words: 5 items, simple words suitable for kids, derived from the conversation.',
                            ].join('\n'),
                        });

                        const transcript = msgs.map(m => `${m.role === 'assistant' ? 'AI' : 'CHILD'}: ${m.text}`).join('\n');
                        const prompt = `Conversation (${day}):\n${transcript}\n\nGenerate the JSON now.`;
                        const result = await model.generateContent(prompt);
                        const text = (await result.response.text()).trim();

                        let parsed;
                        try {
                            parsed = JSON.parse(text);
                        } catch {
                            return res.status(500).json({ error: 'Failed to parse summary JSON.' });
                        }

                        const summaryKr = String(parsed?.summary_kr || '').trim();
                        const summaryEn = String(parsed?.summary_en || '').trim();
                        const newWords = Array.isArray(parsed?.new_words) ? parsed.new_words : [];
                        if (!summaryKr || !summaryEn || newWords.length === 0) {
                            return res.status(500).json({ error: 'Summary JSON missing fields.' });
                        }

                        const newWordsJson = JSON.stringify(newWords.slice(0, 8));
                        db.run(
                            `INSERT INTO ai_daily_summaries (user_id, day, summary_kr, summary_en, new_words_json)
                             VALUES (?, ?, ?, ?, ?)
                             ON CONFLICT(user_id, day) DO UPDATE SET summary_kr = excluded.summary_kr, summary_en = excluded.summary_en, new_words_json = excluded.new_words_json, created_at = CURRENT_TIMESTAMP`,
                            [userId, day, summaryKr, summaryEn, newWordsJson],
                            (err3) => {
                                if (err3) return res.status(500).json({ error: 'Failed to save summary.' });
                                res.json({ day, cached: false, summary_kr: summaryKr, summary_en: summaryEn, newWords: JSON.parse(newWordsJson) });
                            }
                        );
                    } catch (e) {
                        console.error('ai-summary error:', e);
                        res.status(500).json({ error: 'Failed to generate summary.' });
                    }
                }
            );
        }
    );
});

module.exports = router;
