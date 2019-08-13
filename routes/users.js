const routes = require('express').Router()
const passport = require('../config/passport')
const User = require('../models/user')

function isAuthenticated(req, res, next) {
	if (!req.isAuthenticated()) return res.redirect('/users/login')

	next()
}

function notAuthenticated(req, res, next) {
	if (req.isAuthenticated()) return res.redirect('/users')

	next()
}

routes.get('/', isAuthenticated, (req, res) => {
	req.session.uname = req.user.username
	res.render('users')
})

routes.get('/login', notAuthenticated, (req, res) => {
	res.render('login')
})

routes.get('/register', notAuthenticated, (req, res) => {
	res.render('register')
})

routes.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/users',
		failureRedirect: '/users/login',
		failureFlash: true,
		badRequestMessage: 'Please enter your username/email and password'
	}),
	(req, res) => {
		res.redirect('/users')
	}
)

routes.post('/register', notAuthenticated, (req, res) => {
	req.check('username', 'Username is required.').not().isEmpty()
	req.check('username', "Username can't be more than 35 characters.").isLength({ max: 35 })
	req.check('email', 'Email is invalid.').isEmail()
	req.check('password', 'Password must be at least 8 characters.').isLength({ min: 8 })
	req.check('password', "The passwords don't match.").equals(req.body.cpassword)

	let errors = req.validationErrors()
	if (errors) return res.render('register', { errors: errors })

	let username = req.body.username
	let email = req.body.email
	let password = req.body.password

	User.createUser(username, email, password, (errors, user) => {
		if (errors) return res.render('register', { errors: errors })

		req.login(user, (err) => {
			if (err) throw err
			res.redirect('/users')
		})
	})
})

routes.get('/logout', isAuthenticated, (req, res) => {
	req.logout()
	res.redirect('/')
})

routes.get('/forgot', notAuthenticated, (req, res) => {
	res.render('forgotPassword')
})

routes.post('/forgot', notAuthenticated, (req, res) => {
	req.check('email').isEmail()

	if (req.validationErrors()) return res.render('forgotPassword', { msg: 'Email is invalid.', success: false })

	User.sendForgotPassword(req.body.email, (msg, success) => {
		return res.render('forgotPassword', { msg: msg, success: success })
	})
})

routes.get('/resetPassword', (req, res) => {
	let key = req.query.key
	let id = req.query.id

	res.render('resetPassword', { key: key, id: id })
})

routes.post('/resetPassword', (req, res) => {
	req.check('password', 'Password must be at least 8 characters.').isLength({ min: 8 })
	req.check('password', 'The passwords do not match.').equals(req.body.cpass)

	let key = req.body.key
	let id = req.body.id
	let password = req.body.password

	let errors = req.validationErrors()
	if (errors) return res.render('resetPassword', { errors: errors, key: key, id: id })

	User.resetPassword(password, id, key, (good) => {
		if (!good) return res.send('The reset link has expired. Click <a href="/users/forgot">here</a> to try again.')

		res.redirect('/users/login')
	})
})

module.exports = routes
