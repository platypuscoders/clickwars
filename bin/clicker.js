var clickerWorker = require('../workers/clicker_worker.js');
var fibrous = require('fibrous');

fibrous.run(function () {
	console.log("Starting clicker worker");
	clickerWorker.sync.start();
	console.log("clicker worker server start returned");
});
