let outgoing = (msg, time) => {
	return `
        <div class="outgoing_msg">
            <div class="sent_msg">
                <p>${msg}</p>
                <span class="time_date">${time}</span>
            </div>
        </div>
    `
}

let incoming = (uname, msg, time) => {
	return `
        <div class="incoming_msg">
            <div class="incoming_msg_img">
                <h6>${uname}</h6>
            </div>
            <div class="received_msg">
                <div class="received_withd_msg">
                    <p>${msg}</p>
                    <span class="time_date">${time}</span>
                </div>
            </div>
        </div>
    `
}

let addUser = (uname) => {
	$('.online').append(`<li id='${escape(uname)}'>${uname}</li>`)
}

let formatTime = (now) => {
	let hour24 = now.getHours()
	let hour = hour24 > 12 ? hour24 - 12 : hour24 == 0 ? 12 : hour24
	let minutes = now.getMinutes().toString().padStart(2, '0')
	let t = hour24 < 12 ? 'AM' : 'PM'
	return `${hour}:${minutes} ${t}`
}

let socket = io(`${window.location.protocol}//${window.location.hostname}`)

function send() {
	if ($('.write_msg').val().length == 0) return false

	let now = new Date()
	let time = formatTime(now)

	$('.msg_history').append(outgoing($('.write_msg').val(), time))
	socket.emit('message', { msg: $('.write_msg').val(), time: time })
	$('.write_msg').val('')
	$('.msg_history').scrollTop($('.msg_history').prop('scrollHeight'))
}

$('.write_msg').keypress((e) => {
	if (e.which == 13) send()
})

socket.on('message', (data) => {
	$('.msg_history').append(incoming(data.uname, data.msg, data.time))
	$('.msg_history').scrollTop($('.msg_history').prop('scrollHeight'))
})

socket.on('initialList', (data) => {
	data.forEach(addUser)
})

socket.on('personConnected', (data) => {
	addUser(data)
})

socket.on('personDisconnected', (data) => {
	$(`#${escape(data)}`).remove()
})
