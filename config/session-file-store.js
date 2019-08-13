const fileStore = require('session-file-store')

module.exports = (session) => {
	fileStoreSession = fileStore(session)
	return new fileStoreSession({
		path: './sessions'
	})
}
