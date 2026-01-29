const nodemailer = require("nodemailer");


/**
 * Configuración del transporte de correo.
 * Se recomienda usar SMTP de Hostinger (puerto 465) para producción.
 */
const transporter = nodemailer.createTransport({
    //service: 'gmail', solo si es para gmail
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: Number(process.env.EMAIL_PORT) || 465,
    // El puerto 465 requiere secure: true. El 587 requiere false.
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Función genérica para el envío de correos electrónicos.
 */
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

        // Mantener este log es útil para rastrear envíos sin saturar la consola
        console.log(`[EMAIL-SERVICE] Sent to: ${to} | ID: ${info.messageId}`);

        return info;

    } catch (error) {

        // Log detallado de error indispensable para producción
        console.error("[EMAIL-SERVICE] Error sending email:", error.message);
        
        throw error;
    }
};

module.exports = { enviarEmail };