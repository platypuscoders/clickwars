/**
 * Created by bwyatt on 9/3/15.
 */

var Click = function(value, cell, playerName, priority, procRemainder) {
	this.cell = cell;
	this.playerName = playerName;
	this.priority = priority;
	this.procRemainder = procRemainder || function(){return[]};

	if (typeof(value) === 'function') {
		this.getValue = value;
	} else {
		this.getValue = function(){return value;}
	}
};

var process = function(game, clicks, nextSerial) {
	var pendingClicks = clicks || [];
	while (pendingClicks.length !== 0) {
		var input = pendingClicks;
		pendingClicks = [];

		// group by cell
		var clicksByCell = input.reduce(function(result, click){
			var cellKey = click.cell.id;

			if (result.hasOwnProperty(cellKey) == false) {
				result[cellKey] = { cell: click.cell, clicks: [], teams: {} };
			}

			result[cellKey].clicks.push(click);
			var clickTeam = game.players[click.playerName].team;
			result[cellKey].teams[clickTeam] = true;

			return result;
		}, {});

		// process each cell
		Object.keys(clicksByCell).forEach(function(key){
			var cell = clicksByCell[key].cell;
			var clicks = clicksByCell[key].clicks;

			var expandedClicks = clicks.map(function(click){
				return {
					click: click,
					team: game.players[click.playerName].team,
					value: click.getValue(clicksByCell)
				}
			}).filter(function(clickInfo){
				return clickInfo.value > 0;
			});

			// early out if no clicks survived
			if (expandedClicks.length == 0) {
				return;
			}

			var teamPriorityBuckets = expandedClicks
				.reduce(function(b, clickInfo){
					var buckets = b || [[0,0],[0,0],[0,0]];

					buckets[clickInfo.click.priority][clickInfo.team] += clickInfo.value;
					return buckets;
				}, null);

			var teamTotals = teamPriorityBuckets.reduce(function(a,b){return [a[0]+b[0],a[1]+b[1]];});
			if (teamTotals[0] == teamTotals[1]) {
				return;
			}

			var winningTeam = teamTotals[0] > teamTotals[1] ? 0 : 1;
			var losingTeam = winningTeam === 0 ? 1 : 0;
			var effectiveClicks = teamTotals[winningTeam] - teamTotals[losingTeam];

			var remainingClicks = cell.processClicks(effectiveClicks, winningTeam, game, nextSerial);

			var remainderFactors = teamPriorityBuckets.reverse().map(function(bucket){
				var totalClicks = bucket[winningTeam];
				var rem = Math.min(totalClicks, remainingClicks);
				remainingClicks -= rem;
				return rem / totalClicks;
			}).reverse();

			// do something with the remainders
			var newClicks = expandedClicks.map(function(clickInfo){
				var clickTeam = clickInfo.team;
				if (clickTeam !== winningTeam || remainderFactors[clickInfo.click.priority] < 0.00001) {
					return null;
				}

				var remainder = clickInfo.value * remainderFactors[clickInfo.click.priority];
				return clickInfo.click.procRemainder(remainder);
			}).filter(function(thing){ return thing !== null});

			pendingClicks = pendingClicks.concat.apply(pendingClicks, newClicks);
		});
	}
};

module.exports = Click;
module.exports.Click = Click;
module.exports.process = process;
module.exports.HIGH_PRIORITY = 0;
module.exports.MEDIUM_PRIORITY = 1;
module.exports.LOW_PRIORITY = 2;
module.exports.NUM_PRIORITY_BUCKETS = 3;
module.exports.PLAYER_CLICK_PRIORITY = module.exports.LOW_PRIORITY;