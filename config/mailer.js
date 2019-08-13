const nodemailer = require('nodemailer')
const fs = require('fs')

const config = JSON.parse(fs.readFileSync('../config/config.json'))

let transport = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: config.gmail_username,
		pass: config.gmail_password
	}
})

module.exports.sendMail = (to, subject, body, email = `admin@${config.domain}`, name = config.domain) => {
	transport.sendMail(
		{
			from: `${name}<${email}>`,
			replyTo: email,
			to: to,
			subject: subject,
			text: body
		},
		(err, info) => {
			if (err) throw err
		}
	)
}
