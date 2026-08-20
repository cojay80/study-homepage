const path = require('path');
const { createClient } = require('@libsql/client');

// Local dev (no TURSO_* set): talk to the same on-disk SQLite file as before.
// Production (Vercel): TURSO_DATABASE_URL/TURSO_AUTH_TOKEN point at a Turso DB,
// since serverless functions have no persistent local disk.
const localDbPath = path.resolve(__dirname, 'magic_kingdom.db');
const url = process.env.TURSO_DATABASE_URL || `file:${localDbPath}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken, intMode: 'number' });

// Routes in this app call db.serialize(() => { db.run(...); db.run(...) })
// expecting statements to execute in the order issued (sqlite3's default
// serialized-connection behavior). @libsql/client has no such guarantee
// across separate execute() calls, so we chain every call through one queue.
//
// Routes also issue raw 'BEGIN IMMEDIATE TRANSACTION' / 'COMMIT' / 'ROLLBACK'
// as plain SQL text (the sqlite3 pattern). That works on a single persistent
// connection (local file), but @libsql/client's remote (Turso) transport has
// no such implicit connection to hold a transaction open across separate
// execute() calls -- COMMIT would silently apply to nothing. So we detect
// those three statements here and route them through @libsql/client's actual
// Transaction object instead, keeping every call site elsewhere unchanged.
let tail = Promise.resolve();
let activeTx = null;
const EMPTY_RESULT = { rows: [], rowsAffected: 0, lastInsertRowid: undefined };

function enqueue(sql, params) {
    const run = async () => {
        const trimmed = sql.trim();
        if (/^BEGIN\b/i.test(trimmed)) {
            activeTx = await client.transaction(/IMMEDIATE/i.test(trimmed) ? 'write' : 'deferred');
            return EMPTY_RESULT;
        }
        if (/^COMMIT\b/i.test(trimmed)) {
            const tx = activeTx;
            activeTx = null;
            if (tx) await tx.commit();
            return EMPTY_RESULT;
        }
        if (/^ROLLBACK\b/i.test(trimmed)) {
            const tx = activeTx;
            activeTx = null;
            if (tx) {
                try { await tx.rollback(); } catch { /* already closed, fine */ }
            }
            return EMPTY_RESULT;
        }
        return (activeTx || client).execute({ sql, args: params });
    };
    const result = tail.then(run, run);
    tail = result.then(() => undefined, () => undefined);
    return result;
}

function normalizeArgs(params, cb) {
    if (typeof params === 'function') return { params: [], cb: params };
    return { params: params || [], cb };
}

// Adapter that mimics the subset of the sqlite3.Database callback API this
// app uses (get/all/run/serialize/close), backed by @libsql/client.
function reportUnhandled(sql, err) {
    console.error('Unhandled DB error on:', sql.slice(0, 120).replace(/\s+/g, ' '), '\n', err);
}

const db = {
    get(sql, params, cb) {
        const n = normalizeArgs(params, cb);
        enqueue(sql, n.params)
            .then((rs) => (n.cb ? n.cb(null, rs.rows[0]) : undefined))
            .catch((err) => (n.cb ? n.cb(err) : reportUnhandled(sql, err)));
    },
    all(sql, params, cb) {
        const n = normalizeArgs(params, cb);
        enqueue(sql, n.params)
            .then((rs) => (n.cb ? n.cb(null, rs.rows) : undefined))
            .catch((err) => (n.cb ? n.cb(err) : reportUnhandled(sql, err)));
    },
    run(sql, params, cb) {
        const n = normalizeArgs(params, cb);
        enqueue(sql, n.params)
            .then((rs) => {
                if (n.cb) n.cb.call({ lastID: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected }, null);
            })
            .catch((err) => {
                if (n.cb) n.cb.call({}, err);
                else reportUnhandled(sql, err);
            });
    },
    serialize(fn) {
        fn();
    },
    // Async because callers may enqueue writes right before closing (e.g.
    // seed.js); wait for the queue to drain so nothing gets dropped.
    close() {
        return tail.then(
            () => { try { client.close(); } catch { /* ignore */ } },
            () => { try { client.close(); } catch { /* ignore */ } }
        );
    },
};

const initDB = () => {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      parent_pin TEXT,
      gold INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // User Inventory Table (owned items)
        db.run(`CREATE TABLE IF NOT EXISTS user_inventory (
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, item_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // Quizzes Table (Content)
        db.run(`CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL, -- 'korean', 'math', 'english'
      level INTEGER NOT NULL,
      question_data TEXT NOT NULL, -- JSON string
      answer TEXT NOT NULL
    )`);

        // User Progress Table
        db.run(`CREATE TABLE IF NOT EXISTS user_progress (
      user_id INTEGER,
      quiz_id INTEGER,
      is_correct BOOLEAN,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
    )`);

        // User Settings Table
        db.run(`CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      daily_limit_minutes INTEGER DEFAULT 60,
      turns_per_minute INTEGER DEFAULT 10,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // AI Messages Table
        db.run(`CREATE TABLE IF NOT EXISTS ai_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL, -- 'user' | 'assistant'
      text TEXT NOT NULL,
      difficulty TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // AI Usage Table (token accounting per assistant turn)
        db.run(`CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL, -- 'gemini' | 'openai'
      model TEXT,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      total_tokens INTEGER,
      input_usd_per_m REAL,
      output_usd_per_m REAL,
      estimated_cost_usd REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // Lightweight migrations for older DBs
        db.run('ALTER TABLE ai_usage ADD COLUMN input_usd_per_m REAL', (err) => {
            if (err && !String(err.message || '').includes('duplicate column name')) {
                console.error('Migration error (ai_usage.input_usd_per_m):', err.message);
            }
        });
        db.run('ALTER TABLE ai_usage ADD COLUMN output_usd_per_m REAL', (err) => {
            if (err && !String(err.message || '').includes('duplicate column name')) {
                console.error('Migration error (ai_usage.output_usd_per_m):', err.message);
            }
        });
        db.run('ALTER TABLE ai_usage ADD COLUMN estimated_cost_usd REAL', (err) => {
            if (err && !String(err.message || '').includes('duplicate column name')) {
                console.error('Migration error (ai_usage.estimated_cost_usd):', err.message);
            }
        });

        // Word meanings (cached per day)
        db.run(`CREATE TABLE IF NOT EXISTS ai_word_meanings (
      user_id INTEGER NOT NULL,
      day TEXT NOT NULL, -- YYYY-MM-DD
      word TEXT NOT NULL,
      meaning_kr TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, day, word),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // AI Daily Summary (for parent report)
        db.run(`CREATE TABLE IF NOT EXISTS ai_daily_summaries (
      user_id INTEGER NOT NULL,
      day TEXT NOT NULL, -- YYYY-MM-DD
      summary_kr TEXT NOT NULL,
      summary_en TEXT NOT NULL,
      new_words_json TEXT NOT NULL, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, day),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // Daily Bonus Claim Table
        db.run(`CREATE TABLE IF NOT EXISTS daily_bonus_claims (
      user_id INTEGER NOT NULL,
      day TEXT NOT NULL, -- YYYY-MM-DD
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, day),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // `tail` at this point covers exactly the statements enqueued above;
        // log after they've actually settled instead of right after enqueueing.
        // (Individual failures are reported by reportUnhandled(); the queue
        // itself always continues, so this always resolves.)
        tail.then(() => console.log(`Database ready (${process.env.TURSO_DATABASE_URL ? 'Turso' : 'local file'}).`));
    });
};

module.exports = { db, initDB };
