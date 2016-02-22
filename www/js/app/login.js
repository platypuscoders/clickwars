define (function (require) {
	if (localStorage.displayName != undefined) {
		radio('displayGame').broadcast();
	} else {
		radio('displayLogin').broadcast();
	}

	$('#LoginButton').click(function(e) {
		window.location.replace("/?displayName=" + encodeURI($('#LoginName').val()));
	});
});
