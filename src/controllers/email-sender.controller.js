
const { enviarEmail } = require('../services/mail/emailService');
const { buildContactFormTemplate } = require('../templates/emailTemplates');

exports.createEmailSenderContact = async (req, res) => {

    try {

        const contactData = req.body;

        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });

        const htmlAdmin = buildContactFormTemplate(contactData, true);
        await enviarEmail({
            to: process.env.CONTACT_EMAIL_RECEIVER,
            subject: `🚨 NEW CONTACT: ${contactData.fullName} <${contactData.email}> [${timestamp}]`,
            html: htmlAdmin
        });


        const htmlClient = buildContactFormTemplate(contactData, false);
        await enviarEmail({
            to: contactData.email,
            subject: `Inquiry Received - ExpediNap #${timestamp.replace(/:/g, '')}`,
            html: htmlClient
        });


        return res.status(201).json({
            ok: true,
            message: 'Message received successfully',
            data: contactData
        });

    } catch (error) {

        console.error("[CONTACT-ERROR]:", error.message);
        
        res.status(500).json({
            ok: false,
            message: "Internal server error",
            type: "SERVER_ERROR"
        });
    }
};