// emailService.js

const nodemailer = require('nodemailer');

async function sendEmailWithAttachment(toEmail, subject, text, filename, contentBase64) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'partiklal99@gmail.com',
            pass: 'Dave@1708',
        },
    });

    const mailOptions = {
        from: 'partiklal99@gmail.com',
        to: toEmail,
        subject: subject,
        text: text,
        attachments: [
            {
                filename: filename,
                content: contentBase64,
                encoding: 'base64',
            },
        ],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true; // Email sent successfully
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send email');
    }
}

module.exports = { sendEmailWithAttachment };
