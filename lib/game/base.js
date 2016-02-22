/**
 * Created by Bart on 9/2/15.
 */

var Click = require('./click');

var filterNulls = function (list, nextOrNull) {
	if (nextOrNull !== null) {
		list.push(nextOrNull);
	}

	return list;
};

var Base = function (x, y, owner) {
	this.x = x;
	this.y = y;
	this.offense = 1;
	this.defense = 2;
	this.resistance = 0.1;
	this.capacity = 20;
	this.soldiers = this.capacity;
	this.upgradesTotal = 0;
	this.owner = owner;
	this.name = "base";
};

var Target = function (cell, defense) {
	this.cell = cell;
	this.defense = defense;
};

var isValidTarget = function(cell, team, clicksByCell) {
	var celId = cell.id;
	if (clicksByCell.hasOwnProperty(celId)) {
		var targetClicks = clicksByCell[celId];

		// any contested cell is a valid target
		if (Object.keys(targetClicks.teams).length > 1) {
			return true;
		}

		// otherwise any cell where we have something good to do is a valid target
		// ... like take control
		var desiredControl = team == 1 ? cell.maxControl : -1 * cell.maxControl;
		if (desiredControl != cell.control) {
			return true;
		}

		// ... or heal a friendly base
		if (cell.base && cell.base.soldiers != cell.base.capacity) {
			return true;
		}
	}
	return false;
};

var calculateNumValidTargets = function(targets, team, clicksByCell) {
	return targets.map(function(target){
		// a valid target is one where an opponent is attacking
		return isValidTarget(target.cell, team, clicksByCell) ? 1 : 0;
	}).reduce(function(a,b){return a+b});
};

var invHertz = 1 / 10;

var makeAttackValueFunc = function(target, targets, team, base) {
	return function(clicksByCell) {
		if (false == isValidTarget(target.cell, team, clicksByCell)) {
			return 0;
		}

		var numValidTargets = calculateNumValidTargets(targets, team, clicksByCell);
		return base.soldiers * base.offense * invHertz / numValidTargets;
	}
};

var makeHealingFunc = function(game, base, targetCell) {
	return function(remainder) {
		var converted = remainder / base.defense;
		targetCell.base.processHeal(converted);
		game.dirtyCells.push(targetCell);
		return [];
	}
};

Base.prototype.processHeal = function(value) {
	var availableHeal = value * this.resistance;
	var healed = Math.min(this.capacity - this.soldiers, availableHeal);
	this.soldiers += healed;
	return (availableHeal - healed) / this.resistance;
};

Base.prototype.processAttack = function(value) {
	var availableKill = value * this.resistance;
	var killed = Math.min(this.soldiers, availableKill);
	this.soldiers -= killed;
	return (availableKill - killed) / this.resistance;
};

Base.prototype.process = function (game) {
	var res = [];
	var maxX = game.board.length;
	var maxY = game.board[0].length;
	var ownerTeam = game.players[this.owner].team;
	var that = this;

	if (this.soldiers === 0) {
		return null;
	} else {
		var cellState = game.board[this.x][this.y];
		var targets = [[-1, 0], [0, -1], [1, 0], [0, 1]].map(function (offsets) {
			var x = that.x + offsets[0];
			var y = that.y + offsets[1];

			if (x < 0 || x >= maxX || y < 0 || y >= maxY) {
				return null;
			}

			var otherCellState = game.board[x][y];
			var defense = (otherCellState.control > 0 && ownerTeam == 1) || (otherCellState.control < 0 && ownerTeam == 0);
			return new Target(otherCellState, defense);
		}).filter(function(thing){return thing !== null});

		var activeClicks =  targets.map(function(target){
			var valueFn = makeAttackValueFunc(target, targets, ownerTeam, that);

			var remainderFunc = null;
			if (target.cell.base) {
				var targetTeam = game.players[target.cell.base.owner].team;
				if (targetTeam == ownerTeam) {
					remainderFunc = makeHealingFunc(game, that, target.cell);
				}
			}
			return new Click(valueFn, target.cell, that.owner, Click.HIGH_PRIORITY, remainderFunc);
		});

		var defenseValue = that.soldiers * that.defense * invHertz;
		var passiveClick = new Click(defenseValue, cellState, that.owner, Click.HIGH_PRIORITY, makeHealingFunc(game, that, cellState));

		return activeClicks.concat([passiveClick]);
	}
};


module.exports = Base;
