const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Users = require('../models/users.model');

const PasswordResetCode = require('../models/password-reset-code.model');
const { buildPasswordResetTemplateCode } = require('../templates/emailTemplates');
const { enviarEmail } = require('../services/mail/emailService');

exports.register = async (req, res) => {
    const {
        name,
        lastname,
        username,
        email,
        password,
        phone,
        age,
        role,
        active,
        direction,
    } = req.body;


    try {
        const salt = await bcrypt.genSalt(10);
        const passEncrypt = await bcrypt.hash(password, salt);

        const newUser = await Users.create({
            name,
            lastname,
            username,
            email,
            password_hash: passEncrypt,
            phone,
            age,
            role,
            active,
            direction,
        });

        const userResponse = newUser.toObject();
        delete userResponse.password_hash;

        res.status(201).json({
            ok: true,
            data: userResponse,
            message: 'User registered successfully'
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: 'Email or Username already exists',
            });
        }

        if (error.name === 'ValidationError') {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: firstError,

            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error',

        });
    }
}

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Buscar usuario por username o email
        const usuarioLogin = await Users.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        }).select('+password_hash');

        if (!usuarioLogin) {
            return res.status(401).json({
                ok: false,
                type: 'AuthError',
                message: 'Invalid credentials',
            });
        }

        // 2. Validar contraseña
        const validatePassword = await bcrypt.compare(password, usuarioLogin.password_hash);

        if (!validatePassword) {
            return res.status(401).json({
                ok: false,
                type: 'AuthError',
                message: 'Invalid credentials',
            });
        }

        // 3. Generar JWT
        const token = jwt.sign(
            {
                id: usuarioLogin._id,
                username: usuarioLogin.username,
                role: usuarioLogin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" } // Token válido por 7 días
        );

        // 4. Configurar cookie HttpOnly
        res.cookie('token', token, {
            httpOnly: true,        // ⚠️ No accesible desde JavaScript (seguro)
            secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
            sameSite: 'lax',       // Protege contra CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
        });

        // 5. Respuesta sin token en el body (más seguro)
        const userResponse = usuarioLogin.toObject();
        delete userResponse.password_hash;

        res.status(200).json({
            ok: true,
            data: {
                user: userResponse,
                // ⚠️ NO incluyas el token en el body
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('--- LOGIN ERROR ---', error);
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error'
        });
    }
};

exports.update = async (req, res) => {

    const id = req.user.id;
    const updates = req.body;

    try {

        const updateUser = await Users.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }).select("-password_hash");

        if (!updateUser) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'User not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: updateUser,
            message: 'User updated successfully'
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: firstError
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error'
        });

    }

}

exports.getUserProfile = async (req, res) => {
    const id = req.user.id

    try {

        const userProfile = await Users.findById(id).select('-password_hash');

        if (!userProfile) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'User not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: userProfile,
            message: 'Profile retrieved successfully'
        })

    } catch (error) {

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error'
        });
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const { username, email, role, name } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        let query = {};

        if (username) {
            query.username = { $regex: username, $options: 'i' };
        }

        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }

        if (name) {
            query.$or = [
                { name: { $regex: name, $options: 'i' } },
                { lastname: { $regex: name, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role.toLowerCase();
        }

        const skip = (page - 1) * limit;

        const [users, totalItems] = await Promise.all([
            Users.find(query)
                .select('-password_hash')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Users.countDocuments(query)
        ]);

        if (!users) {
            return res.status(404).json({
                ok: false,
                message: "No users found.",
                type: "NOT_FOUND"
            });
        }

        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            ok: true,
            data: users,
            message: totalItems > 0 ? 'Users retrieved successfully.' : 'No users found.',
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error while fetching users.',
        });
    }
}

//Solicitar codigo de reestablecer Password
exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Verificar si el usuario existe
        const user = await Users.findOne({ email });

        if (!user) {
            // Por seguridad, a veces es mejor decir que se envió el correo 
            // aunque no exista el usuario, pero en entornos admin es mejor ser directo.
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'No account found with that email address.'
            });
        }

        // 2. Generar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Guardar en la DB (Si ya existía uno para este email, lo borramos primero para evitar conflictos)
        await PasswordResetCode.deleteMany({ email });
        await PasswordResetCode.create({ email, code });

        // 4. Enviar el Email usando tu template profesional
        const htmlTemplate = buildPasswordResetTemplateCode(code, email);

        await enviarEmail({
            to: email,
            subject: "Password Reset Verification Code - ExpediNap",
            html: htmlTemplate
        });

        res.status(200).json({
            ok: true,
            message: 'Verification code sent to your email.'
        });

    } catch (error) {

        console.error("Reset Request Error:", error);

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error while requesting reset.'
        });
    }
};
//Reestablecer Password con codigo 
exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        // 1. Validar que el código exista y sea válido
        const resetRecord = await PasswordResetCode.findOne({ email, code });

        if (!resetRecord) {
            return res.status(400).json({
                ok: false,
                type: 'InvalidCode',
                message: 'The code is invalid or has expired.'
            });
        }

        // 2. Buscar al usuario
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'User no longer exists.'
            });
        }

        // 3. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const newPassEncrypt = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar usuario y borrar el código usado
        user.password_hash = newPassEncrypt;
        await user.save();
        await PasswordResetCode.deleteOne({ _id: resetRecord._id });

        res.status(200).json({
            ok: true,
            message: 'Password updated successfully. You can now login.'
        });

    } catch (error) {
        console.error("ERROR EN RESET:", error);
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error during password reset.'
        });
    }
};


/**
 * Logout - Elimina la cookie del token
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
    try {
        // ✅ Eliminar la cookie 'token'
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/' // Asegura que se elimine en todo el dominio
        });

        res.status(200).json({
            ok: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('--- LOGOUT ERROR ---', error);
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error during logout'
        });
    }
};