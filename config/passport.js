const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user')

passport.use(
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password'
		},
		(username, password, done) => {
			User.findUser(username, password, (user) => {
				if (!user) return done(null, false, { message: 'Invalid username or password.' })

				return done(null, user)
			})
		}
	)
)

passport.serializeUser((user, done) => {
	return done(null, user.id)
})

passport.deserializeUser((id, done) => {
	User.findUserById(id, (user) => {
		if (!user) return done(null, false, { message: 'The user account no longer exists.' })

		return done(null, user)
	})
})

module.exports = passport
