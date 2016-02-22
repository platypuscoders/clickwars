
(function () {

	$('#header').html("<div class='left'>Player Name: <span id='playerName'></span></div> \
		<div class='left'>Team: <span id='playerTeam'></span></div> \
		<div >Pos: <span id='playerPosition'></span></div><div></div>");


	$('#header').on("header:update", function(event, square) {
		$('#playerPosition').html("X: " + square.x + " Y: " + square.y + " -> " + square.control + " (" + square.soldiers + "/" + square.capacity + ")");
	});

	radio('setPlayerName').subscribe(function(name) {
		$('#playerName').html(name);
	});
})();
