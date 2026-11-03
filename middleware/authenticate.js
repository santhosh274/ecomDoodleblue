const userService = require('../services/user.services');

module.exports = async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { user } = await userService.getUserFromToken(token);
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
};
