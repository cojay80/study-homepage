const jwt = require('jsonwebtoken');

function getJwtSecret() {
    return process.env.JWT_SECRET || 'dev-secret-change-me';
}

function signUserToken(user) {
    return jwt.sign(
        { sub: String(user.id), username: user.username, role: 'user' },
        getJwtSecret(),
        { expiresIn: '30d' }
    );
}

function signParentToken(user) {
    return jwt.sign(
        { sub: String(user.id), username: user.username, role: 'parent' },
        getJwtSecret(),
        { expiresIn: '12h' }
    );
}

function parseAuthHeader(req) {
    const h = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/.exec(h);
    return m ? m[1] : null;
}

function requireAuth(req, res, next) {
    const token = parseAuthHeader(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const payload = jwt.verify(token, getJwtSecret());
        req.auth = payload;
        return next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

function requireParent(req, res, next) {
    requireAuth(req, res, () => {
        if (req.auth?.role !== 'parent') return res.status(403).json({ error: 'Parent access required' });
        return next();
    });
}

module.exports = {
    signUserToken,
    signParentToken,
    requireAuth,
    requireParent,
};

