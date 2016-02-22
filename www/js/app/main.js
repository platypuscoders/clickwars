define(function (require) {


	require('header');

	var getUrlVars = function() {
	    var vars = [], hash;
	    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	    for(var i = 0; i < hashes.length; i++)
	    {
	        hash = hashes[i].split('=');
	        vars.push(hash[0]);
	        vars[hash[0]] = hash[1];
	    }
	    return vars;
	};

	var urlVars = getUrlVars();

	if (!!urlVars.displayName) {
		localStorage.setItem('displayName', urlVars.displayName);
		window.location.replace("/");
	}

	radio('displayLogin').subscribe(function() {
		console.log("DISPLAY LOGIN");

		$('#game').css('display', 'none');
		$('#login').css('display', 'block');

	});

	radio('displayGame').subscribe(function() {
		radio('setPlayerName').broadcast(localStorage.displayName);

		$('#game').css('display', 'block');
		$('#login').css('display', 'none');

	});

	radio('notAuthenticated').subscribe(function () {
		radio('displayLogin').broadcast();
	});

	// This needs to be loaded before login so that the battle socket is loaded
	var battlefield = requirejs(['app/battlefield', 'app/battlesocket', 'app/chat', 'footer']);

	// This has to be last, as it can send a radio message, and we need to have the listeners set up first
	var login = requirejs(['app/login']);

});
