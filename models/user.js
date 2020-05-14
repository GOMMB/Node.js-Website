const con = require(__basedir + '/config/database')
const bcrypt = require('bcrypt')
const mailer = require(__basedir + '/config/mailer')
const fs = require('fs')

const config = JSON.parse(fs.readFileSync(__basedir + '/config/config.json'))

function generateString(len) {
	let text = ''
	let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~`!@#$%^&*()-_+=|\\{}[]:;\'",.<>/?'

	for (let i = 0; i < len; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}

	return text
}

module.exports.createUser = (username, email, password, callback) => {
	let errors = []

	con.all(
		'SELECT * from `users` WHERE `email` = ? OR `username` = ?',
		[
			email,
			username
		],
		(err, result) => {
			if (err) throw err

			for (let i = 0; i < result.length; i++) {
				if (email == result[i].email) errors.push({ msg: 'That email is already linked with an account.' })

				if (username == result[i].username) errors.push({ msg: 'That username is taken.' })
			}
			if (errors.length) return callback(errors, false)

			bcrypt.hash(password, 10, (err, hash) => {
				con.run(
					'INSERT INTO users (`username`, `email`, `password`) VALUES (?, ?, ?)',
					[
						username,
						email,
						hash
					],
					function(err) {
						if (err) throw err

						callback(undefined, { id: this.lastID, username: username, email: email })
					}
				)
			})
		}
	)
}

module.exports.findUser = (username, password, callback) => {
	con.get(
		'SELECT * from `users` WHERE `email` = ? OR `username` = ?',
		[
			username,
			username
		],
		(err, result) => {
			if (err) throw err

			if (!result) return callback(false)

			bcrypt.compare(password, result.password, (err, res) => {
				if (!res) return callback(false)

				callback({ id: result.id, email: result.email, username: result.username })
			})
		}
	)
}

module.exports.findUserById = (id, callback) => {
	con.get(
		'SELECT * from `users` WHERE `id` = ?',
		[
			id
		],
		(err, result) => {
			if (err) throw err

			if (!result) return callback(false)

			let user = { id: result.id, email: result.email, username: result.username }

			callback(user)
		}
	)
}

module.exports.getAllUsers = (callback) => {
	con.all('SELECT `username`, `email` FROM `users`', (err, result) => {
		if (err) throw err

		callback(result)
	})
}

module.exports.sendForgotPassword = (email, callback) => {
	con.get(
		'SELECT `id` FROM `users` WHERE `email` = ?',
		[
			email
		],
		(err, result) => {
			if (err) throw err

			if (!result) return callback('This email is not associated with an account.', false)

			let key = generateString(50)

			mailer.sendMail(
				email,
				'Reset Password',
				`${config.url}/users/resetPassword?key=${encodeURIComponent(key)}&id=${result.id}`
			)

			bcrypt.hash(key, 10, (err, hash) => {
				con.run(
					"REPLACE INTO `forgotPassword` VALUES (?, ?, datetime('now', '+10 minutes'))",
					[
						result.id,
						hash
					],
					(err) => {
						if (err) throw err
					}
				)
			})

			return callback('Email sent.', true)
		}
	)
}

function removeForgotPassword(id) {
	con.run(
		'DELETE FROM `forgotPassword` WHERE `id` = ?',
		[
			id
		],
		(err) => {
			if (err) throw err
		}
	)
}

module.exports.resetPassword = (password, id, key, callback) => {
	con.get(
		'SELECT `key`, `expire` from `forgotPassword` WHERE `id` = ?',
		[
			id
		],
		(err, result) => {
			if (err) throw err

			if (!result) return callback(false)

			if (Date.now() > Date.parse(result.expire)) {
				removeForgotPassword(id)
				return callback(false)
			}

			bcrypt.compare(key, result.key, (err, res) => {
				if (!res) return callback(false)

				removeForgotPassword(id)

				bcrypt.hash(password, 10, (err, hash) => {
					con.run(
						'UPDATE `users` SET `password` = ? WHERE `id` = ?',
						[
							hash,
							id
						],
						(err) => {
							if (err) throw err
						}
					)
				})

				callback(true)
			})
		}
	)
}
