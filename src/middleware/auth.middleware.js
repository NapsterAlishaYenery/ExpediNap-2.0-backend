
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            ok: false,
            type: 'NoTokenProvided',
            message: 'Unauthorized: Token not provided'
        });
    }

    const token = authHeader.split(' ')[1];


    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ 
            ok: false,
            type: 'InvalidToken',
            message: 'Invalid Token o TokenExpired' 
        });
    }
};

module.exports = authMiddleware;