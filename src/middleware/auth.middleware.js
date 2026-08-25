const jwt = require("jsonwebtoken");
const User = require("../models/users.model");

const authMiddleware = async (req, res, next) => {

    // Obtener el token desde la cookie
    const token = req.cookies.token;

    // Verificar que exista la cookie
    if (!token) {
        return res.status(401).json({
            ok: false,
            type: 'NoTokenProvided',
            data: null,
            message: 'Unauthorized: Token not provided'
        });
    }

    try {

        // Verificar el JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar el usuario en la base de datos
        const user = await User.findById(decoded.id);

        // Verificar que exista y esté activo
        if (!user || !user.active) {
            return res.status(401).json({
                ok: false,
                type: 'UserStatusError',
                data: null,
                message: 'The user does not exist or is disabled.'
            });
        }

        // Guardar los datos del token para los siguientes middlewares
        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            ok: false,
            type: 'InvalidToken',
            data: null,
            message: 'Invalid token or expired token'
        });

    }

};

module.exports = authMiddleware;