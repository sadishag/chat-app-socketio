var express = require('express'),
	app = express(),
	//new version of express no create server
	server = require('http').createServer(app),
	//socket
	io = require('socket.io').listen(server);

server.listen(process.env.PORT || 3000, function(){
  console.log('listening on', server.address().port);
});

app.use(express.static(__dirname + '/public'));

//routes
app.get('/', function(req,res){
	res.sendFile(__dirname + '/public/index.html');
});

//users connected
usernames = {};

io.on('connection', function(socket){

	//new user logs in
	socket.on('new user', function(name){
		//bind to socket of user
		socket.username = name;
		socket.room = "global";
		//add to array
		usernames[socket.username]=socket;
		io.emit('usernames', Object.keys(usernames));
		io.emit('new user', name);
	});

	//new chat message sent
	socket.on('chat message', function(msg){
		//console.log('message: ' + msg + " username: " + socket.username);
		var splitmsg = msg.split(" ");
		console.log("The split message " + splitmsg);
		var keyword = splitmsg[0];

		console.log(keyword);
		if(keyword === "/whisper"){
			//username you want to send to
			var userSend = splitmsg[1];

			console.log(usernames[userSend]);
			console.log(socket.id);
			var newMsg = "";
			//message you want to send
			for(i = 2; i<splitmsg.length;i++){
				newMsg += splitmsg[i] + " ";
			}

			console.log(newMsg);
			//send to specific user
			usernames[userSend].emit('secret message', {message: newMsg, username: socket.username});
			socket.emit('secret message', {message: newMsg, username: socket.username});
		}
		else if(keyword === "/kick"){
			var kickUser = splitmsg[1];
			socket.emit('kick user', kickUser);
		}
		else if(keyword === "/create"){
			socket.room = splitmsg[1];
			console.log(socket.room);
		}else if(keyword === "/leave"){
			socket.room = "global";
		}
		else{
			//send to everyone
			 io.emit('checkRoom', {message: msg, username: socket.username, room: socket.room});
		}

	});

	//user disconnect
	socket.on('disconnect', function(){
		//update usernames
		delete usernames[socket.username];

		io.emit('usernames', Object.keys(usernames));
		io.emit('disconnect user', socket.username);

		//no username
		if(!socket.username){
			return;
		}
	});

	socket.on('kick', function(kickUser){
		console.log(usernames[kickUser].username);
		usernames[kickUser].disconnect();
	});

	socket.on('same room', function(msg){
		if(msg.room === socket.room){
			socket.emit('chat message', msg);
		}
	});
});

