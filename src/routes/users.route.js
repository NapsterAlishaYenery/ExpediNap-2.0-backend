const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware')
const writeLimiter = require('../middleware/rateLimiter.middleware')
const validateUsers = require('../middleware/validate-users.middleware')


const usersController = require('../controllers/user.controller');

//RUTAS GET
router.get('/all', authMiddleware, isAdminMiddleware, usersController.getAllUsers);
router.get('/profile', authMiddleware, usersController.getUserProfile);

//RUTAS POST
router.post('/register', writeLimiter, validateUsers.register, usersController.register);
router.post('/login', writeLimiter, validateUsers.login, usersController.login);

//RUTA PATCH
router.patch('/update', authMiddleware, writeLimiter, validateUsers.update,  usersController.update);

module.exports = router