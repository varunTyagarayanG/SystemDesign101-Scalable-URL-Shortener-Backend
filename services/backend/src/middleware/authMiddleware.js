// services/backend/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Bearer token missing' });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: payload.userId, email: payload.email };
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = authenticateJWT;
