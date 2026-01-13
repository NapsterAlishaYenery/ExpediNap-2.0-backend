const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Users = require('../models/users.model');

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
        const usuarioLogin = await Users.findOne({ username }).select('+password_hash');

        if (!usuarioLogin) {
            return res.status(401).json({
                ok: false,
                type: 'AuthError',
                message: 'Invalid credentials',
            });
        }

        const validatePassword = await bcrypt.compare(password, usuarioLogin.password_hash);

        if (!validatePassword) {
            return res.status(401).json({
                ok: false,
                type: 'AuthError',
                message: 'Invalid credentials',
            });
        }

        const token = jwt.sign({ id: usuarioLogin._id, username: usuarioLogin.username, role: usuarioLogin.role}, process.env.JWT_SECRET, { expiresIn: "1h" });

        const userResponse = usuarioLogin.toObject();
        delete userResponse.password_hash;

        res.status(200).json({
            ok: true,
            data: { token, user: userResponse },
            message: 'Login successful'
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error'
        });
    }
}

exports.update = async (req, res) => {

    const id = req.user.id; //vendria desde el middleware que intercepta el token
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

exports.getUserProfile = async (req, res)=>{
    const id = req.user.id 

    try{

        const userProfile = await Users.findById(id).select('-password_hash');

        if(!userProfile){
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

    }catch(error){

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
        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error while fetching users.',
        });
    }
}
