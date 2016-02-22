var crud = require('../lib/crud');
var fibrous  = require('fibrous');
var express = require('express');
var socketIo = require('socket.io');

var version_key = process.env.VIRTUAL_KEY || "1";

var Game = require('../lib/game/game');
var Client = require('../lib/game/client');

var theGame = new Game();

var handleGameSocket = function(socket) {
	fibrous.run(function() {
		var client = new Client(socket);
		theGame.addClient(client);
	});
};

var globalChatSockets = [];

var handleChatSocket = function(socket) {
	globalChatSockets.push(socket);
	socket.on('message', function(data) {
		globalChatSockets.forEach(function(s){
			if (s !== socket) {
				s.emit('message', data);
			}
		});
	});

	socket.on('disconnect', function(){
		var idx = globalChatSockets.indexOf(socket);
		if (idx >= 0) {
			globalChatSockets.splice(idx, 1);
		}
	});
};

exports.start = fibrous(function(){
  var app = express();
  var server = require('http').Server(app);
  var io = socketIo(server);

  app.set('port', process.env.PORT || 8080);
  server.listen(app.get('port'));

  app.use(fibrous.middleware);

  app.use('/', express.static('./www'));

  io.use(function(socket, next){
    console.log('looking for route on websocket');
    if (!socket.handshake.query.route) {
      console.log('not found');
      next(new Error('No route'));
    } else {
      console.log('found ' + socket.handshake.query.route );
      next();
    }
  });

  io.on('connection', function(socket){
    var route = socket.handshake.query.route;
    if (route === '/1/clickerwars/global/chat') {
      handleChatSocket(socket)
    } else if (route === '/1/clickerwars/game') {
      handleGameSocket(socket)
    } else {
      socket.emit('error', 'No such route!');
      socket.disconnect();
    }
  });

 });
