global.__basedir = __dirname

const express = require('express')
const compression = require('compression')
const session = require('express-session')
const fileStore = require('./config/session-file-store')(session)
const validator = require('express-validator')
const fs = require('fs')
const http = require('http')
const https = require('https')
const sass = require('node-sass')
const flash = require('express-flash-2')
const passport = require('passport')
const path = require('path')
const sharedsession = require('express-socket.io-session')

const routes = require('./routes/index')
const users = require('./routes/users')

let privateKey = fs.readFileSync(__dirname + '/sslcert/server.key', 'utf8')
let certificate = fs.readFileSync(__dirname + '/sslcert/server.crt', 'utf8')
let chain = fs.readFileSync(__dirname + '/sslcert/server.ca', 'utf8')

let app = express()

//https redirect
http
	.createServer((req, res) => {
		res.writeHead(301, {
			Location: 'https://' + req.headers['host'] + req.url
		})
		res.end()
	})
	.listen(80)

let httpsServer = https.createServer(
	{
		key: privateKey,
		cert: certificate,
		ca: chain
	},
	app
)

// express options
app.set('views', __dirname + '/views')
app.set('view engine', 'pug')
app.disable('x-powered-by')

//sass compile
sass.render(
	{
		file: __dirname + '/sass/styles.sass'
	},
	(error, result) => {
		if (!error) {
			fs.writeFile(__dirname + '/public/css/styles.css', result.css, function(err) {
				if (err) throw err
			})
		}
	}
)

// middleware
app.use(compression())
app.use(express.static(__dirname + '/public'))
let sessionInstance = session({
	key: 'session_key',
	secret: '5hi849a49]400f983409]__+_*(ohi',
	store: fileStore,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 7 * 86400 * 1000,
		secure: true
	}
})
const io = require('socket.io')(httpsServer)
io.use(sharedsession(sessionInstance))
require('./config/socketio')(io)

app.use(sessionInstance)
app.use(validator())

// Passport
app.use(passport.initialize())
app.use(passport.session())

// BodyParser
app.use(express.json())
app.use(
	express.urlencoded({
		extended: true
	})
)

// Flash
app.use(flash())
app.use((req, res, next) => {
	res.locals.active = path.basename(req.originalUrl)
	res.locals.logged_in = req.isAuthenticated()
	next()
})

// routes
app.use(routes)
app.use('/users', users)

// 404 page
app.use((req, res, next) => {
	res.status(404).render('404')
	res.end()
})

httpsServer.listen(443, () => console.log('HTTPS Server started'))
