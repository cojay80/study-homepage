const express = require('express');
const OpenAI = require('openai');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { estimateCostUsd, getModelRates } = require('../lib/aiPricing');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

function buildSystemPrompt(difficulty) {
    const base = [
        'You are a friendly English conversation partner for a young child.',
        'Speak ONLY in English.',
        'Use short sentences and simple words.',
        'Be encouraging and gentle. If the child makes a mistake, correct briefly and kindly.',
        'Ask ONE question at the end to keep the conversation going.',
        'Keep replies under 45 words unless asked for more.',
    ];

    const level = String(difficulty || '').toLowerCase();

    // Supported: elementary | middle | high
    // Back-compat aliases: easy->elementary, medium->middle, hard->high
    const normalized =
        level === 'elementary' || level === 'easy' ? 'elementary' :
            level === 'middle' || level === 'medium' ? 'middle' :
                level === 'high' || level === 'hard' ? 'high' :
                    'elementary';

    if (normalized === 'elementary') {
        return [
            ...base,
            'Difficulty: ELEMENTARY. Use very basic vocabulary (A1).',
            'Use present tense. Avoid idioms.',
        ].join('\n');
    }

    if (normalized === 'high') {
        return [
            ...base,
            'Difficulty: HIGH. Use richer vocabulary (B1) and slightly longer sentences.',
            'Introduce ONE new word sometimes and explain it in simple English.',
        ].join('\n');
    }

    return [
        ...base,
        'Difficulty: MIDDLE. Use basic vocabulary (A2) with a little variety.',
        'Occasionally ask "Why?" or "How?" questions.',
    ].join('\n');
}

function getGeminiModelName() {
    return String(process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite').trim();
}

function maxOutputTokensForDifficulty(difficulty) {
    const level = String(difficulty || '').toLowerCase();
    const normalized =
        level === 'elementary' || level === 'easy' ? 'elementary' :
            level === 'middle' || level === 'medium' ? 'middle' :
                level === 'high' || level === 'hard' ? 'high' :
                    'elementary';

    // Keep low to reduce cost and avoid long replies.
    if (normalized === 'elementary') return 110;
    if (normalized === 'high') return 170;
    return 140;
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

function safeNumberOrNull(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function localDayString(d = new Date()) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'so', 'because', 'to', 'of', 'in', 'on', 'at', 'for', 'with',
    'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'this', 'that', 'these', 'those',
    'do', 'does', 'did', 'done', 'doing',
    'have', 'has', 'had',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'not', 'no', 'yes',
    'what', 'why', 'how', 'when', 'where', 'who',
    'hello', 'hi', 'thanks', 'thank',
]);

function normalizeWord(w) {
    const s = String(w || '').trim().toLowerCase();
    if (!/^[a-z][a-z']{1,24}$/.test(s)) return null;
    const cleaned = s.replace(/^'+|'+$/g, '');
    if (cleaned.length < 3) return null;
    if (STOPWORDS.has(cleaned)) return null;
    return cleaned;
}

router.get('/status', requireAuth, async (req, res) => {
    try {
        const userId = Number(req.auth.sub);
        const settings = await getUserSettings(userId);
        const turnsUsedToday = await getTurnsUsedToday(userId);
        const allowedTurns = settings.dailyLimitMinutes * settings.turnsPerMinute;
        const remainingTurns = Math.max(0, allowedTurns - turnsUsedToday);
        const remainingMinutes = Math.floor(remainingTurns / settings.turnsPerMinute);

        res.json({
            dailyLimitMinutes: settings.dailyLimitMinutes,
            turnsPerMinute: settings.turnsPerMinute,
            turnsUsedToday,
            remainingMinutes,
        });
    } catch (err) {
        console.error('AI status error:', err);
        res.status(500).json({ error: 'Failed to fetch status.' });
    }
});

router.get('/capabilities', requireAuth, (req, res) => {
    res.json({
        geminiTextEnabled: Boolean(process.env.GEMINI_API_KEY),
        openaiSpeechEnabled: Boolean(process.env.OPENAI_API_KEY),
        wordMeaningsEnabled: Boolean(process.env.GEMINI_API_KEY),
    });
});

// Get Korean meanings for a list of English words (cached per-day; costs 1 small Gemini call for missing words)
router.post('/word-meanings', requireAuth, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });

    const userId = Number(req.auth.sub);
    const day = localDayString();
    const words = Array.isArray(req.body?.words) ? req.body.words : [];

    const requested = Array.from(new Set(words.map(normalizeWord).filter(Boolean))).slice(0, 12);
    if (requested.length === 0) return res.status(400).json({ error: 'words is required.' });

    const placeholders = requested.map(() => '?').join(',');

    try {
        const cached = await new Promise((resolve, reject) => {
            db.all(
                `SELECT word, meaning_kr FROM ai_word_meanings
                 WHERE user_id = ? AND day = ? AND word IN (${placeholders})`,
                [userId, day, ...requested],
                (err, rows) => (err ? reject(err) : resolve(rows || []))
            );
        });

        const map = new Map((cached || []).map((r) => [String(r.word), String(r.meaning_kr)]));
        const missing = requested.filter((w) => !map.has(w));

        if (missing.length > 0) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const modelName = String(process.env.GEMINI_MODEL_MEANINGS || process.env.GEMINI_MODEL || getGeminiModelName()).trim();
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: [
                    'You are a helpful assistant for kids learning English vocabulary.',
                    'Return ONLY plain text lines (no markdown).',
                    'Each line must be: <word>\\t<meaning_kr>',
                    'Rules: meaning_kr must be short (1-8 Korean words). Do not include extra commentary.',
                ].join('\n'),
                generationConfig: { maxOutputTokens: 220, temperature: 0.2 },
            });

            const prompt = `Words:\n${missing.join('\n')}\n\nReturn lines now.`;
            const result = await model.generateContent(prompt);
            const text = (await result.response.text()).trim();

            const inserts = [];
            const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            for (const line of lines) {
                const parts = line.split('\t');
                if (parts.length < 2) continue;
                const w = normalizeWord(parts[0]);
                const m = String(parts.slice(1).join('\t') || '').trim();
                if (!w || !missing.includes(w)) continue;
                if (!m) continue;
                map.set(w, m);
                inserts.push([userId, day, w, m]);
            }

            // Fallback parser: accept "word: meaning" or "word - meaning"
            if (inserts.length === 0) {
                for (const w of missing) {
                    const re = new RegExp(`^\\s*${w}\\s*[:\\-–—]\\s*(.+)$`, 'im');
                    const m = re.exec(text)?.[1]?.trim();
                    if (!m) continue;
                    map.set(w, m);
                    inserts.push([userId, day, w, m]);
                }
            }

            if (inserts.length > 0) {
                await new Promise((resolve) => {
                    db.serialize(() => {
                        for (const row of inserts) {
                            db.run(
                                `INSERT INTO ai_word_meanings (user_id, day, word, meaning_kr)
                                 VALUES (?, ?, ?, ?)
                                 ON CONFLICT(user_id, day, word) DO UPDATE SET meaning_kr = excluded.meaning_kr`,
                                row
                            );
                        }
                        resolve();
                    });
                });
            }

            const usageMeta = result?.response?.usageMetadata || null;
            const promptTokens = safeNumberOrNull(usageMeta?.promptTokenCount);
            const completionTokens = safeNumberOrNull(usageMeta?.candidatesTokenCount);
            const totalTokens = safeNumberOrNull(usageMeta?.totalTokenCount);
            db.run(
                `INSERT INTO ai_usage (user_id, provider, model, prompt_tokens, completion_tokens, total_tokens, input_usd_per_m, output_usd_per_m, estimated_cost_usd)
                 VALUES (?, 'gemini', ?, ?, ?, ?, ?, ?, ?)`,
                (() => {
                    const rates = getModelRates('gemini', modelName);
                    const estimated = estimateCostUsd({ provider: 'gemini', model: modelName, promptTokens, completionTokens });
                    return [userId, modelName, promptTokens, completionTokens, totalTokens, rates?.inputUsdPerM ?? null, rates?.outputUsdPerM ?? null, estimated];
                })()
            );
        }

        const responseItems = requested.map((w) => ({ word: w, meaning_kr: map.get(w) || null }));
        return res.json({ day, items: responseItems });
    } catch (err) {
        console.error('word-meanings error:', err);
        return res.status(500).json({ error: 'Failed to fetch meanings.' });
    }
});

router.post('/english-chat', requireAuth, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });

    try {
        const userId = Number(req.auth.sub);
        const settings = await getUserSettings(userId);
        const turnsUsedToday = await getTurnsUsedToday(userId);
        const allowedTurns = settings.dailyLimitMinutes * settings.turnsPerMinute;
        if (turnsUsedToday >= allowedTurns) {
            return res.status(429).json({ error: 'Daily limit reached.' });
        }

        const difficulty = String(req.body?.difficulty || 'elementary').toLowerCase();
        const history = Array.isArray(req.body?.history) ? req.body.history : [];
        const text = String(req.body?.text || '').trim();

        if (!text) return res.status(400).json({ error: 'text is required.' });
        if (text.length > 600) return res.status(400).json({ error: 'text is too long.' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = getGeminiModelName();
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: buildSystemPrompt(difficulty),
            generationConfig: {
                maxOutputTokens: maxOutputTokensForDifficulty(difficulty),
                temperature: 0.7,
            },
        });

        const geminiHistory = history
            .map((m) => {
                const role = m.role === 'assistant' ? 'model' : 'user';
                const content = typeof m.content === 'string' ? m.content : '';
                return { role, parts: [{ text: content }] };
            })
            .filter((m) => m.parts[0].text.trim().length > 0)
            .slice(-8);

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(text);
        const replyText = (await result.response.text()).trim();

        const nextTurnsUsed = turnsUsedToday + 1;
        const remainingTurns = Math.max(0, allowedTurns - nextTurnsUsed);
        const remainingMinutes = Math.floor(remainingTurns / settings.turnsPerMinute);
        const awardedGold = nextTurnsUsed % settings.turnsPerMinute === 0 ? 1 : 0;

        const usageMeta = result?.response?.usageMetadata || null;
        const promptTokens = safeNumberOrNull(usageMeta?.promptTokenCount);
        const completionTokens = safeNumberOrNull(usageMeta?.candidatesTokenCount);
        const totalTokens = safeNumberOrNull(usageMeta?.totalTokenCount);

        db.run(
            `INSERT INTO ai_messages (user_id, role, text, difficulty) VALUES (?, 'user', ?, ?)`,
            [userId, text, difficulty],
            (err) => {
                if (err) return res.status(500).json({ error: 'Failed to save message.' });

                db.run(
                    `INSERT INTO ai_messages (user_id, role, text, difficulty) VALUES (?, 'assistant', ?, ?)`,
                    [userId, replyText, difficulty],
                    (err2) => {
                        if (err2) return res.status(500).json({ error: 'Failed to save message.' });

                        const finish = () => {
                            db.get('SELECT gold FROM users WHERE id = ?', [userId], (err3, row) => {
                                if (err3 || !row) return res.status(500).json({ error: 'Failed to load gold.' });
                                return res.json({
                                    replyText,
                                    turnsUsedToday: nextTurnsUsed,
                                    dailyLimitMinutes: settings.dailyLimitMinutes,
                                    remainingMinutes,
                                    awardedGold,
                                    gold: Number(row.gold || 0),
                                });
                            });
                        };

                        db.run(
                            `INSERT INTO ai_usage (user_id, provider, model, prompt_tokens, completion_tokens, total_tokens, input_usd_per_m, output_usd_per_m, estimated_cost_usd)
                             VALUES (?, 'gemini', ?, ?, ?, ?, ?, ?, ?)`,
                            (() => {
                                const model = modelName;
                                const rates = getModelRates('gemini', model);
                                const estimated = estimateCostUsd({ provider: 'gemini', model, promptTokens, completionTokens });
                                return [userId, model, promptTokens, completionTokens, totalTokens, rates?.inputUsdPerM ?? null, rates?.outputUsdPerM ?? null, estimated];
                            })()
                        );

                        if (!awardedGold) return finish();
                        db.run('UPDATE users SET gold = gold + ? WHERE id = ?', [awardedGold, userId], (err4) => {
                            if (err4) return res.status(500).json({ error: 'Failed to update gold.' });
                            finish();
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.error('Gemini english-chat error:', err);
        return res.status(500).json({ error: 'Failed to process request.' });
    }
});

router.post('/english-talk', requireAuth, upload.single('audio'), async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not set.' });

    const openai = new OpenAI({ apiKey });

    try {
        const userId = Number(req.auth.sub);
        const settings = await getUserSettings(userId);
        const turnsUsedToday = await getTurnsUsedToday(userId);
        const allowedTurns = settings.dailyLimitMinutes * settings.turnsPerMinute;
        if (turnsUsedToday >= allowedTurns) {
            return res.status(429).json({ error: 'Daily limit reached.' });
        }

        const difficulty = (req.body.difficulty || 'elementary').toLowerCase();
        const history = req.body.history ? JSON.parse(req.body.history) : [];

        let transcriptText = (req.body.text || '').trim();
        if (transcriptText.length > 600) return res.status(400).json({ error: 'text is too long.' });

        if (!transcriptText) {
            if (!req.file) return res.status(400).json({ error: 'Provide either `text` or an `audio` file.' });

            const transcription = await openai.audio.transcriptions.create({
                file: await OpenAI.toFile(req.file.buffer, req.file.originalname || 'audio.webm'),
                model: 'whisper-1',
                language: 'en',
            });

            transcriptText = (transcription.text || '').trim();
        }

        const messages = [
            { role: 'system', content: buildSystemPrompt(difficulty) },
            ...history,
            { role: 'user', content: transcriptText || 'Hello!' },
        ].slice(-20);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
        });

        const replyText = (completion.choices?.[0]?.message?.content || '').trim();

        const nextTurnsUsed = turnsUsedToday + 1;
        const remainingTurns = Math.max(0, allowedTurns - nextTurnsUsed);
        const remainingMinutes = Math.floor(remainingTurns / settings.turnsPerMinute);
        const awardedGold = nextTurnsUsed % settings.turnsPerMinute === 0 ? 1 : 0;

        const promptTokens = safeNumberOrNull(completion?.usage?.prompt_tokens);
        const completionTokens = safeNumberOrNull(completion?.usage?.completion_tokens);
        const totalTokens = safeNumberOrNull(completion?.usage?.total_tokens);

        const speech = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: replyText || 'Hello!',
            format: 'mp3',
        });

        const audioBuffer = Buffer.from(await speech.arrayBuffer());

        db.run(
            `INSERT INTO ai_messages (user_id, role, text, difficulty) VALUES (?, 'user', ?, ?)`,
            [userId, transcriptText, difficulty],
            (err) => {
                if (err) return res.status(500).json({ error: 'Failed to save message.' });

                db.run(
                    `INSERT INTO ai_messages (user_id, role, text, difficulty) VALUES (?, 'assistant', ?, ?)`,
                    [userId, replyText, difficulty],
                    (err2) => {
                        if (err2) return res.status(500).json({ error: 'Failed to save message.' });

                        const finish = () => {
                            db.get('SELECT gold FROM users WHERE id = ?', [userId], (err3, row) => {
                                if (err3 || !row) return res.status(500).json({ error: 'Failed to load gold.' });
                                return res.json({
                                    transcript: transcriptText,
                                    replyText,
                                    replyAudioBase64: audioBuffer.toString('base64'),
                                    replyAudioContentType: 'audio/mpeg',
                                    turnsUsedToday: nextTurnsUsed,
                                    dailyLimitMinutes: settings.dailyLimitMinutes,
                                    remainingMinutes,
                                    awardedGold,
                                    gold: Number(row.gold || 0),
                                });
                            });
                        };

                        db.run(
                            `INSERT INTO ai_usage (user_id, provider, model, prompt_tokens, completion_tokens, total_tokens, input_usd_per_m, output_usd_per_m, estimated_cost_usd)
                             VALUES (?, 'openai', ?, ?, ?, ?, ?, ?, ?)`,
                            (() => {
                                const model = 'gpt-4o-mini';
                                const rates = getModelRates('openai', model);
                                const estimated = estimateCostUsd({ provider: 'openai', model, promptTokens, completionTokens });
                                return [userId, model, promptTokens, completionTokens, totalTokens, rates?.inputUsdPerM ?? null, rates?.outputUsdPerM ?? null, estimated];
                            })()
                        );

                        if (!awardedGold) return finish();
                        db.run('UPDATE users SET gold = gold + ? WHERE id = ?', [awardedGold, userId], (err4) => {
                            if (err4) return res.status(500).json({ error: 'Failed to update gold.' });
                            finish();
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.error('AI english-talk error:', err);
        return res.status(500).json({ error: 'Failed to process request.' });
    }
});

module.exports = router;
