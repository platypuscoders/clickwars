/**
 * Created by bwyatt on 9/1/15.
 */
define(function (require) {
	$(document).ready(function(){

		var appendMessage = function(message) {
			var chatElem = $('#chatlog');
			var onBottom = chatElem.scrollTop() + chatElem.innerHeight() >= chatElem[0].scrollHeight;

			$('#chatlog ul').append($('<li>').append(
				$('<span>').addClass('chatTime').text(new Date(message.timestamp).toLocaleString()),
				$('<span>').addClass('chatName').text(message.name),
				$('<span>').addClass('chatText').text(message.text)
			));

			if  (onBottom) {
				chatElem.scrollTop(Math.max(0, chatElem[0].scrollHeight - chatElem.innerHeight()));
			}
		};

		var url = window.location.href;
		var parts = url.split('/');
		var baseUrl = parts[0] + '//' + parts[2];
		var socket = io(baseUrl, { query: $.param({route: '/1/clickerwars/global/chat', }), forceNew: true});
		socket.on('message', function(message){
			appendMessage(message);
		});

		var name = 'Anonymous';
		radio('setPlayerName').subscribe(function(data) {
			name = data;
		});

		$('#chat').append(
			$('<div>').attr('id', 'chatlog').append(
				$('<ul>')
			),
			$('<form>').append(
				$('<input>').attr('id', 'msg'),
				$('<button>').text('Send').on('click', function() {
					var text = $.trim($('#msg').val());
					if (text.length > 0) {
						var message = {
							text: text,
							timestamp: new Date().getTime(),
							name: name
						};
						socket.emit('message',message);
						$('#msg').val('');
						appendMessage(message);
					}
				})
			).on('submit', function(e){
				e.preventDefault();
			})
		);
	});
});
