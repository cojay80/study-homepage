const dotenv = require('dotenv');
dotenv.config({ override: true });

// database.js reads TURSO_DATABASE_URL/TURSO_AUTH_TOKEN at require-time to
// pick its transport, so dotenv must run before this require.
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const { db } = require('./db/database');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production.');
}

app.set('trust proxy', 1);

const allowedOrigins = (() => {
    const raw = String(process.env.CLIENT_ORIGIN || '').trim();
    if (!raw) return null;
    return raw.split(',').map((x) => x.trim()).filter(Boolean);
})();

app.use(cors({
    origin: (origin, cb) => {
        // Allow non-browser tools (curl, server-to-server) with no Origin.
        if (!origin) return cb(null, true);

        // In dev, allow Vite defaults.
        if (process.env.NODE_ENV !== 'production') return cb(null, true);

        if (!allowedOrigins || allowedOrigins.length === 0) return cb(new Error('CORS blocked: CLIENT_ORIGIN not configured.'));
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('CORS blocked: origin not allowed.'));
    },
}));
app.use(express.json({ limit: '200kb' }));
app.use(helmet({ crossOriginResourcePolicy: false }));

const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests. Please slow down.' });
    },
});

const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 40, // 10 turns/min user usage + headroom
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many AI requests. Please take a short break.' });
    },
});

initDB();

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const parentRoutes = require('./routes/parent');
const aiRoutes = require('./routes/ai');
const storeRoutes = require('./routes/store');
const rewardsRoutes = require('./routes/rewards');

app.use((req, res, next) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    req.id = id;
    res.setHeader('x-request-id', id);
    const start = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - start;
        const slowMs = Number(process.env.LOG_SLOW_MS || 1500);
        const isSlow = Number.isFinite(slowMs) && durationMs >= slowMs;
        const isError = res.statusCode >= 400;
        if (!isSlow && !isError) return;

        const msg = {
            requestId: id,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs,
            ip: req.ip,
        };
        console.warn(JSON.stringify(msg));
    });

    next();
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/parent', parentRoutes);
app.use('/api/v1/ai', aiLimiter, aiRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/rewards', rewardsRoutes);

app.get('/api/v1/health', (req, res) => {
    db.get('SELECT 1 as ok', [], (err, row) => {
        if (err) return res.status(500).json({ ok: false, error: 'db_unavailable', requestId: req.id });
        res.json({ ok: true, db: row?.ok === 1, time: new Date().toISOString(), requestId: req.id });
    });
});

app.get('/', (req, res) => {
    res.send('Magic Learning Kingdom API is running!');
});

// Error handler (e.g. CORS blocked)
app.use((err, req, res, next) => {
    if (err?.message?.startsWith?.('CORS blocked')) {
        return res.status(403).json({ error: err.message, requestId: req.id });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error', requestId: req.id });
});

// On Vercel the platform owns the HTTP server and just calls this module as
// a request handler (Express apps are callable as (req, res) => ...), so
// app.listen()/signal handling only make sense for local/traditional hosting.
let server = null;
if (!process.env.VERCEL) {
    server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

    const shutdown = (signal) => {
        console.log(`Received ${signal}. Shutting down...`);
        server.close(async () => {
            try {
                await db.close();
            } catch {
                // ignore
            }
            process.exit(0);
        });
        // Force-exit after timeout
        setTimeout(() => process.exit(1), 10_000).unref?.();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
