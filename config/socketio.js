let online = []

module.exports = (io) => {
	io.on('connection', (socket) => {
		let uname = socket.handshake.session.uname

		online.push(uname)

		socket.emit('initialList', online)

		socket.broadcast.emit('personConnected', uname)

		socket.on('disconnect', () => {
			online.splice(online.indexOf(uname), 1)
			socket.broadcast.emit('personDisconnected', uname)
		})

		socket.on('message', (data) => {
			data.uname = uname
			socket.broadcast.emit('message', data)
		})
	})
}
