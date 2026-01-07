const express = require('express');
const router = express.Router();

const authMiddleware  = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const validateBlog = require('../middleware/validate-blog.middleware');

const blogController = require('../controllers/blogs.controller');

// RUTA GET 
router.get('/all', blogController.getAllBlogs);
router.get('/post/:slug', blogController.getBlogBySlug);
router.get('/detail/:id', validateBlog.id, blogController.getBlogByID);

//RUTA POST
router.post('/create', authMiddleware , isAdminMiddleware, writeLimiter, validateBlog.create, blogController.createBlog);

// RUTA PATCH
router.patch('/update/:id', authMiddleware , isAdminMiddleware, writeLimiter, validateBlog.id, validateBlog.upDate, blogController.upDateBlog);

//RUTA DELETE
router.delete('/delete/:id', authMiddleware , isAdminMiddleware, writeLimiter, validateBlog.id, blogController.deleteBlog);


module.exports = router