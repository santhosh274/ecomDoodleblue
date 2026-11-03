const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

class TokenService {
    generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    verifyToken(token) {
        return jwt.verify(token, JWT_SECRET);
    }
}

module.exports = new TokenService();
