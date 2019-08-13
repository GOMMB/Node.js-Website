module.exports = (io) => {
	io.on('connection', (socket) => {
		let uname = socket.handshake.session.uname

		socket.on('message', (data) => {
			data.uname = uname
			socket.broadcast.emit('message', data)
		})
	})
}
