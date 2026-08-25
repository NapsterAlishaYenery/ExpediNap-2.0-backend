// src/middlewares/isAdmin.middleware.js
const isAdminMiddleware = (req, res, next) => {
    // ✅ Verificar que req.user existe
    if (!req.user) {
        return res.status(401).json({
            ok: false,
            type: 'UnauthorizedError',
            data: null,
            message: 'Authentication required'
        });
    }

    // ✅ Verificar rol (super_admin también tiene acceso)
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
            ok: false,
            type: 'ForbiddenError',
            data: null,
            message: 'Access denied: Administrators only'
        });
    }

    next();
};

module.exports = isAdminMiddleware;