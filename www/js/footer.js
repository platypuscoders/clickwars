define (function (require) {
	const TEAM_RED_ID=0;
	const TEAM_BLUE_ID=1;

	radio('socketConnected').subscribe(function() {
		console.log(localStorage.playerName);
		if (localStorage.playerName != undefined) {
			radio('setPlayerName').broadcast(localStorage.playerName);
		}
	});

	$('#footer').html("<div>Choose Team: <button id='red'>RED</button> <button id='blue'>BLUE</button></div>");


	$('#red').click(function(e) {
		radio('setTeam').broadcast(TEAM_RED_ID);
		localStorage.setItem('playerTeam', TEAM_RED_ID);
	});

	$('#blue').click(function(e) {
		radio('setTeam').broadcast(TEAM_BLUE_ID);
		localStorage.setItem('playerTeam', TEAM_BLUE_ID);
	});


});
