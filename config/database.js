const sqlite = require('sqlite3')

let con = new sqlite.Database(__basedir + '/database/users.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
	if (err) throw err
})

module.exports = con
