const express = require('express');
const router = express.Router();

const authMiddleware  = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const validateBlog = require('../middleware/validate-blog.middleware');
const validateID = require('../middleware/validate-id.middleware');
const upload = require('../middleware/upload.middleware');

const blogController = require('../controllers/blogs.controller');

// RUTA GET 
router.get('/all', blogController.getAllBlogs);
router.get('/post/:slug', blogController.getBlogBySlug);
router.get('/detail/:id', validateID.id, blogController.getBlogByID);

//RUTA POST
router.post('/create', 
    authMiddleware , 
    isAdminMiddleware, 
    writeLimiter, 
    upload.array('images', 10),
    validateBlog.create, 
    blogController.createBlog);

// RUTA PATCH
router.patch('/update/:id', 
    authMiddleware, 
    isAdminMiddleware, 
    writeLimiter, 
    validateID.id, 
    validateBlog. update, 
    blogController.upDateBlog);

//PATCH CONTEN HTML
router.patch('/update-content/:id',
    authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    upload.array('images', 10), 
    validateID.id,
    validateBlog.updateContent,
    blogController.updateBlogContent
);

//RUTA DELETE
router.delete('/delete/:id', 
    authMiddleware, 
    isAdminMiddleware, 
    writeLimiter, 
    validateID.id, 
    blogController.deleteBlog);


module.exports = router