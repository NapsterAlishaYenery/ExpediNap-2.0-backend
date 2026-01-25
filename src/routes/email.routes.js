const express = require('express');
const router = express.Router();

const validateEmailSender = require('../middleware/validate-email-sender.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');

const emailSenderController = require('../controllers/email-sender.controller');

//RUTA CREATE
router.post('/send', [writeLimiter, validateEmailSender.emailSend],emailSenderController.createEmailSenderContact);

module.exports = router;