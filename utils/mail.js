
const nodemailer = require('nodemailer')

function sendEmail(userId, userName, reason, storyId, storyBody) {
    
    let msg = `Request to take down post\nstoryId: ${storyId}\nRequest by user : ${userName}\nuserId : ${userId}\nContents of story : ${storyBody}\nReason for taking down : ${reason}`

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });

    let mailOptions = {
        from: 'kedarsant.ks@gmail.com',
        to: 'kedarsant.ks@gmail.com',
        subject: 'Request to Report post',
        text: msg
    };

    return transporter.sendMail(mailOptions)
}

module.exports = sendEmail