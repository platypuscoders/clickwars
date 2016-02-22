define(function (require) {
	const SQUARE_WIDTH = 40;
	const SQUARE_HEIGHT = 40;
	var MAX_X = 0;
	var MAX_Y = 0;
	var battlefield;
	var mouseInField = false;

	var battlesquare = require('./battlesquare');
	var battleview   = require('./battleview');
	var selectedSquare = null;

	var getBattleFieldSquare = function(coords) {
		return battlefield[coords.x][coords.y];
	}

	radio('boardSetup').subscribe(function(data) {

		MAX_X = data.width;
		MAX_Y = data.height;

		$('#battlefield').css('width',  (MAX_X * SQUARE_WIDTH)  + 'px');
		$('#battlefield').css('height', (MAX_Y * SQUARE_HEIGHT) + 'px');
		$('#battleview').css('left', (MAX_X * SQUARE_WIDTH)  + 'px');
		$('#battleview').css('height', (MAX_Y * SQUARE_HEIGHT) + 'px');

		battlefield = new Array();
		var x, y;
		for (x = 0; x < MAX_X; x++) {
			battlefield[x] = new Array();
			for (y = 0; y < MAX_Y; y++) {
				battlefield[x][y] = new battlesquare(x, y, SQUARE_WIDTH, SQUARE_HEIGHT, '#battlefield');
				battlefield[x][y].draw();
			}
		}

		console.log("Loaded battlefield");
	});

	radio('boardUpdate').subscribe(function(data) {
		//console.log("boardUpdate: ");
		//console.log(data);
		var i;
		for (i = 0; i < data.updates.length; i++) {
			var update = data.updates[i];

			var coords = {x: update.x, y: update.y};
			if (isOutOfBounds(coords)) {
				console.log("ERROR: Received out of bounds board update");
				console.log(data);
				return;
			}

			var square = getBattleFieldSquare(coords);
			square.control  = update.control;
			square.base     = update.base;
			square.offense  = update.offense;
			square.defense  = update.defense;
			square.soldiers = update.soldiers;
			square.capacity = update.capacity;
			square.upgradesTotal = update.baseUpgradesTotal;
			square.value    = update.value;

			//console.log(update);

			square.draw();
		}
	});

	var getCoords = function(e, offset) {
		var relativeX = (e.pageX - offset.left);
		var relativeY = (e.pageY - offset.top);

		var xCoord = Math.floor(relativeX / SQUARE_WIDTH);
		var yCoord = Math.floor(relativeY / SQUARE_HEIGHT);
		return {
			x: xCoord,
			y: yCoord
		};
	}

	var isOutOfBounds = function(coords) {
		if (coords.x < 0 || coords.x >= MAX_X) {
			return true;
		}

		if (coords.y < 0 || coords.y >= MAX_Y) {
			return true;
		}

		return false
	}

	$('#battlefield').mousemove(function(e) {
		var coords = getCoords(e, $(this).offset());

		if (isOutOfBounds(coords)) {
			return;
		}

		var square = getBattleFieldSquare(coords);
		$('#header').trigger("header:update", [square]);
	});

	$(document).keyup(function(e) {
		if ($('#playerName').is(":focus")) {
			return;
		}

		if (e.which === 27) {
			radio('buyBase').broadcast(false);
		}
	});

	$(document).keypress(function(e) {
		if ($('#playerName').is(":focus")) {
			return;
		}

		if (e.which === 'b'.charCodeAt(0)) {
			radio('buyBase').broadcast(true);
		}

		if (e.which === 'a'.charCodeAt(0)) {
			radio('purchaseOffense').broadcast(selectedSquare);
		}

		if (e.which === 'd'.charCodeAt(0)) {
			radio('purchaseDefense').broadcast(selectedSquare);
		}

		if (e.which === 'c'.charCodeAt(0)) {
			radio('purchaseCapacity').broadcast(selectedSquare);
		}

		if (e.which === 'C'.charCodeAt(0)) {
			radio('purchaseClickValue').broadcast(selectedSquare);
		}
	});

	$('#battlefield').click(function(e) {
		var coords = getCoords(e, $(this).offset());

		if (selectedSquare != null) {
			selectedSquare.setActive(false);
		}

		selectedSquare = getBattleFieldSquare(coords);
		selectedSquare.setActive(true);

		radio('click').broadcast(coords);
	});

	$('#bsOffenseButton').on('click', function() {
		radio('purchaseOffense').broadcast(selectedSquare);
	});

	$('#bsDefenseButton').on('click', function() {
		radio('purchaseDefense').broadcast(selectedSquare);
	});

	$('#bsCapacityButton').on('click', function() {
		radio('purchaseCapacity').broadcast(selectedSquare);
	});

	$('#playerClickValueButton').on('click', function() {
		radio('purchaseClickValue').broadcast();
	});

	radio('buyBase').subscribe(function(value) {
		if (value === true) {
			$('#battlefield').css('cursor', 'crosshair');
		} else {
			$('#battlefield').css('cursor', 'default');
		}
	});


});
