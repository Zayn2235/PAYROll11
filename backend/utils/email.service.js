const nodemailer = require('nodemailer');

let transporter;
if (process.env.NODE_ENV === 'development') {
    // In dev, just log the “email” JSON instead of sending
    transporter = nodemailer.createTransport({ jsonTransport: true });
    console.log('ℹ️  Using JSON transport for emails (dev mode)');
} else {
    // In production you can swap this for a real SMTP config
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    transporter.verify()
        .then(() => console.log('✅ SMTP server is ready'))
        .catch(err => console.error('❌ SMTP conn error:', err));
}

exports.sendMail = (to, subject, html) =>
    transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });