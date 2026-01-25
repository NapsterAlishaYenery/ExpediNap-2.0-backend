const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', 
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD 
    },
    tls: { 
        rejectUnauthorized: false 
    }
});

const enviarEmail = async ({ to, subject, html, bcc }) => {
    try {
        const mailOptions = {
            from: `"EXPEDINAP" <${process.env.EMAIL_SENDER}>`,
            to,
            subject,
            html,
            bcc
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email enviado con éxito: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error enviando email:", error);
        throw error;
    }
};

module.exports = { enviarEmail };