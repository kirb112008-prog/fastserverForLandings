const nodemailer = require('nodemailer')
const dns = require('dns').promises

const SMTP_HOST = 'smtp.gmail.com'
const DEMO_URL = 'https://159-194-249-131.sslip.io/c/litera/'
const MAIL_SUBJECT = 'Демо-платформа от САММ-И'
const MAIL_TEXT = 'Спасибо за регистрацию! Даем вам доступ к открытому Демо: ' + DEMO_URL

const MAIL_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Демо-платформа от САММ-И</title>
</head>
<body style="margin:0;padding:0;background-color:#062036;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#062036;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border-radius:12px;">
                    <tr>
                        <td style="padding:40px 32px;font-family:Arial,Helvetica,sans-serif;color:#062036;">
                            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#062036;">Демо-платформа от САММ-И</h1>
                            <p style="margin:0 0 28px;font-size:16px;line-height:1.5;color:#062036;">Спасибо за регистрацию! Даем вам доступ к открытому Демо.</p>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" bgcolor="#062036" style="border-radius:8px;">
                                        <a href="${DEMO_URL}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px;background-color:#062036;">Открыть Демо</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

class MailService {
    transporter = null

    async getTransporter() {
        if (!this.transporter) {
            const { address } = await dns.lookup(SMTP_HOST, { family: 4 })
            this.transporter = nodemailer.createTransport({
                host: address,
                port: 465,
                secure: true,
                tls: { servername: SMTP_HOST },
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD,
                },
            })
        }
        return this.transporter
    }

    async sendMail(to, subject, text, html) {
        const transporter = await this.getTransporter()
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to,
            subject,
            text,
            html,
        })
    }

    async sendWelcomeMail(to) {
        await this.sendMail(to, MAIL_SUBJECT, MAIL_TEXT, MAIL_HTML)
    }
}

module.exports = MailService
