// backend/middlewares/role.middleware.js

const { error } = require('../utils/responseFormatter');

// Factory: returns a middleware that checks for one (or more) roles
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, 401, 'Authentication required');
        }
        if (!allowedRoles.includes(req.user.role)) {
            return error(res, 403, 'Insufficient privileges');
        }
        next();
    };
}

// Named shortcuts
const admin = requireRole('admin');
const hr = requireRole('admin', 'hr');

module.exports = { requireRole, admin, hr };