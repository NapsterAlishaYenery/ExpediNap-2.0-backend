const isAdminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') { 

      return res.status(403).json({ 
        ok: false,
        type: 'Forbidden',
        message: 'Access denied: Administrators only' 
    });
    }
    next();
  };
  
  module.exports = isAdminMiddleware;