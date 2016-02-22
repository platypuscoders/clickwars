/**
 * Created by Bart on 9/1/15.
 */
var Client = function(socket) {
    this.socket = socket;
    this.lastUpdated = -1;
    this.playerName = null;
    var that = this;
};

Client.prototype.error = function(message) {
    this.socket.emit('errorMessage', message);
};

module.exports = Client;