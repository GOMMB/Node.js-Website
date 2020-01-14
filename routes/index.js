const routes = require('express').Router()
const mailer = require('../config/mailer')
const fs = require('fs')

const config = JSON.parse(fs.readFileSync(__basedir + '/config/config.json'))

routes.get('/', (req, res) => {
	return res.render('index', {
		active: 'home'
	})
})

routes.get('/about', (req, res) => {
	return res.render('about')
})

routes.get('/contact', (req, res) => {
	return res.render('contact', {
		email: req.isAuthenticated() ? req.user.email : ''
	})
})

routes.post('/contact', (req, res) => {
	mailer.sendMail(config.contact_email, `Contact from ${config.domain}`, req.body.body, req.body.email, req.body.name)

	res.render('contact', { sent: true })
})

module.exports = routes
