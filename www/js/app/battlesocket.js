define(function (require) {
	var url = window.location.href;
	var parts = url.split('/');
	var baseUrl = parts[0] + '//' + parts[2];

	var bearerToken = null;
	var socket = null;

	radio('setPlayerName').subscribe(function(playerName) {
		socket = io(baseUrl, { query: $.param({route: '/1/clickerwars/game'}), forceNew: true});;


		socket.on('connect', function() {
			console.log("socket connected: ");
			radio('socketConnected').broadcast();
		});

		socket.on('boardSetup', function(data) {
			radio('boardSetup').broadcast(data);
		});

		socket.on('notAuthenticated', function() {
			radio('notAuthenticated').broadcast();
		});

		socket.on('boardUpdate', function(data) {
			radio('boardUpdate').broadcast(data);
		});

		socket.on('errorMessage', function(data){
			alert(data);
		});

		socket.on('playerUpdate', function(data) {
			radio('goldUpdate').broadcast(data.gold);
			radio('clickValueUpdate').broadcast(data.clickValue);
		});

		socket.on('purchaseResponse', function(data){
			console.log(data);
		});

		var buying = false;
		var buyId = 0;
		radio('buyBase').subscribe(function(isBuying){
			buying = isBuying;
		});

		radio('purchaseOffense').subscribe(function(battleSquare) {
			socket.emit('purchase', {x: battleSquare.x, y: battleSquare.y, id: buyId++, type: "baseOffense"});
		});

		radio('purchaseDefense').subscribe(function(battleSquare) {
			socket.emit('purchase', {x: battleSquare.x, y: battleSquare.y, id: buyId++, type: "baseDefense"});
		});

		radio('purchaseCapacity').subscribe(function(battleSquare) {
			socket.emit('purchase', {x: battleSquare.x, y: battleSquare.y, id: buyId++, type: "baseCapacity"});
		});

		radio('purchaseClickValue').subscribe(function(battleSquare) {
			socket.emit('purchase', {x: 0, y: 0, id: buyId++, type: "playerClickValue"});
		});

		radio('click').subscribe(function(coords) {
			if (buying) {
				socket.emit('purchase', {x: coords.x, y: coords.y, id: buyId++, type: "base"});
				radio('buyBase').broadcast(false);
			} else {
				socket.emit('click', {x: coords.x, y: coords.y})
			}
		});

		radio('setTeam').subscribe(function(teamNumber) {
			console.log("socket set player team: ", teamNumber);
			socket.emit('setTeam', teamNumber);
		});

		socket.emit('setPlayerName', playerName);
	});
});
