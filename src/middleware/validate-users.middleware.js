const { Types } = require("mongoose");


const validateUsers = {

    register: (req, res, next) => {
        const { name, lastname, username, email, password, } = req.body;

        if (!name || !lastname || !username || !email || !password) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Missing required fields (nombre, apellido, username, password, email)'
            });
        }
        next();
    },

    id: (req, res, next) => {
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                type: 'InvalidID',
                message: "Invalid ID format"
            });
        }

        next();
    },

    login: (req, res, next) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                ok: false,
                type: 'AuthError',
                message: "Username and password are required"
            });
        }
        next();
    },

    update: (req, res, next) => {
        const update = req.body;
        const camposRecibidos = Object.keys(update);

        const camposProhibidos = ['username', 'email', 'password', 'password_hash', '_id', 'createdAt', 'updatedAt'];

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'EmptyRequest',
                message: "No fields provided for update"
            });
        }

        for (const campo of camposRecibidos) {
            if (camposProhibidos.includes(campo)) {
                return res.status(400).json({
                    ok: false,
                    type: 'ForbiddenField',
                    message: `Field '${campo}' is protected and cannot be updated.`
                });
            }
        }
        next();
    }
}

module.exports = validateUsers;