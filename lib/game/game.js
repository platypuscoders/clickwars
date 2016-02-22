/**
 * Created by Bart on 9/1/15.
 */

var Cell = require('./cell');
var Player = require('./player');
var Base = require('./base');
var Click = require('./click');

var Purchasable = function(cost, procFn) {
    this.process = procFn || function() {
        throw "Purchasable has no proc"
    }

    this.cost = cost || function() {
        throw "Cost has no proc"
    };
}


var boardWidth               = 20;
var boardHeight              = 15;
var maxControl               = 100;
var baseIncreasingMultiplier = 1.1;
var clickIncreasingMultiplier = 1.1;
var startingClickValue       = 10;


var flatten = function(list, next) {
    return list.concat(next);
};

var filterNulls = function(list, nextOrNull) {
    if (nextOrNull !== null ) {
        list.push(nextOrNull);
    }

    return list;
};

var callMethodOf = function(that, method) {
	return function() {
		return that[method].apply(that, arguments);
	};
};

var fixedPrice = function(cost) {
   return function(playerState, cellState) {
      return cost;
   };
};

var clickUpgradePrice = function(cost) {
   return function(playerState, cellState) {
      return Math.ceil(cost * Math.pow(clickIncreasingMultiplier, playerState.clickValue - startingClickValue));
   }
}

var increasingBasePrice = function(cost) {
   return function(playerState, cellState) {
      if (cellState.base === null) {
         throw new Error("Trying to purchase base upgrade for base that no longer exists");
      }
      return Math.ceil(cost * Math.pow(baseIncreasingMultiplier, cellState.base.upgradesTotal));
   };
};

var Stats = function(team) {
    this.team = team;
    this.gold = 0;
};

Stats.prototype.generateUpdate = function() {
    return { gold: this.gold };
};

var Game = function() {
    this.board = [];
    for (var x = 0; x < boardWidth; x++) {
        var column = [];
        for (var y = 0; y < boardHeight; y++) {
            column.push(new Cell(x, y, maxControl));
        }
        this.board.push(column);
    }
    this.serial = 0;

    this.clients = [];
    this.players = {};
    this.bases = [];
    this.pendingClicks = [];
    this.pendingPurchases = [];
    this.dirtyCells = [];
    this.maxControl = maxControl;
    this.stats = [new Stats(0), new Stats(1)];

    this.store = {
         "base" : new Purchasable(fixedPrice(1000), callMethodOf(this, 'purchaseBase')),
         "baseOffense" : new Purchasable(increasingBasePrice(100), callMethodOf(this, 'purchaseBaseOffense')),
         "baseDefense" : new Purchasable(increasingBasePrice(75), callMethodOf(this, 'purchaseBaseDefense')),
         "baseCapacity" : new Purchasable(increasingBasePrice(50), callMethodOf(this, 'purchaseBaseCapacity')),
         "playerClickValue" : new Purchasable(clickUpgradePrice(5000), callMethodOf(this, 'purchasePlayerClickValue'))
    };

    this.interval = setInterval(function(game){
        game.processTick();
    }, 100, this);
};

Game.prototype.addClient = function(client) {
    this.clients.push(client);
    var that = this;
    client.socket.on('disconnect', function() {
        that.removeClient(client);
    });

    client.socket.on('setPlayerName', function(playerName){
        client.playerName = playerName;
        that.maybeCreatePlayer(playerName);
        that.updateClient(client);
    });


    client.socket.on('click', function(data){
        if (client.playerName !== null) {
            if (that.players[client.playerName].team === -1) {
                client.error('You not on a team, but you are trying to submit clicks!');
            } else {
                that.processClick(client.playerName, data);
            }
        } else {
            client.error('You are not logged in, but you are trying to submit clicks!');
        }
    });

    client.socket.on('setTeam', function(data){
        if (client.playerName !== null) {
            that.setTeam(client.playerName, data);
        } else {
            client.error('You are not logged in, but you are trying to set your team!');
        }
    });

    client.socket.on('purchase', function(data) {
        console.log('got purchase message');
        if (client.playerName !== null) {
            if (that.players[client.playerName].team === -1) {
                client.error('You not on a team, but you are trying to buy stuff!');
            } else {
                console.log('processing purchase');
                that.processPurchase(client.playerName, data);
            }
        } else {
            client.error('You are not logged in, but you are trying to buy stuff!');
        }
    });

    this.sendBoardDefinition(client);
    this.updateClient(client);
};

Game.prototype.removeClient = function(client) {
    var deadPlayerIndex = this.clients.indexOf(client);
    if (deadPlayerIndex !== -1) {
        this.clients.splice(deadPlayerIndex, 1);
    }
};

Game.prototype.updateClient = function(client, boardUpdates, purchaseResponses) {
    if (this.serial > client.lastUpdated) {
        // full update if none are provided
        boardUpdates = boardUpdates || this.board.map(function (column, x) {
            return column.map(function (cell, y) {
                if (cell.lastUpdated > client.lastUpdated) {
                    return cell.generateUpdate();
                } else {
                    return null;
                }
            }).reduce(filterNulls, []);
        }).reduce(flatten, []);

        var statsUpdates = this.stats.map(function(stat){
            return stat.generateUpdate();
        });

        var update = {
            serial: this.serial,
            updates: boardUpdates,
            stats: statsUpdates
        };

        client.socket.emit('boardUpdate', update);
    }

    if (client.playerName !== null && this.players.hasOwnProperty(client.playerName)) {
        var player = this.players[client.playerName];
        if (player.lastUpdated > client.lastUpdated) {
            var playerUpdate = {
                gold: player.gold,
                clickValue: player.clickValue
            };

            client.socket.emit('playerUpdate', playerUpdate);
        }
    }

    if (purchaseResponses) {
        purchaseResponses.forEach(function(purchaseResponse){
            client.socket.emit('purchaseResponse', purchaseResponse);
        });
    }

    client.lastUpdated = this.serial;
};

Game.prototype.updateClients = function(boardUpdates, playerPurchaseResponses) {
    var that = this;
    this.clients.forEach(function(client){
        var purchaseResponses = null;
        if (client.playerName && playerPurchaseResponses.hasOwnProperty(client.playerName)) {
            purchaseResponses = playerPurchaseResponses[client.playerName];
        }
        that.updateClient(client, boardUpdates, purchaseResponses)
    });
};

Game.prototype.sendBoardDefinition = function(client) {
    client.socket.emit('boardSetup', { width: boardWidth, height: boardHeight })
};

Game.prototype.maybeCreatePlayer = function(playerName) {
    if (this.players.hasOwnProperty(playerName) == false) {
        this.players[playerName] = new Player();
    }
};

Game.prototype.setTeam = function(playerName, team) {
    if (this.players.hasOwnProperty(playerName)) {
        this.players[playerName].team = team;
    }
};

var isAlignedWith = function(cell, team, desiredControl) {
    var controlDir = team == 1 ? 1 : -1;
    return cell.control * controlDir >= desiredControl;
};

Game.prototype.processClick = function(playerName, clickData) {
    if (false == validateClick(clickData)) {
        return;
    }

    var that = this;
    var clickTeam = this.players[playerName].team;
    var cell = this.board[clickData.x][clickData.y];
    if (false == isAlignedWith(cell, clickTeam, 1)) {
        // if this is not our cell, we need a neighbor
        var alignedNeighbors = [[-1, 0], [0, -1], [1, 0], [0, 1]].map(function (offsets) {
            var x = clickData.x + offsets[0];
            var y = clickData.y + offsets[1];

            if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
                return null;
            }

            return isAlignedWith(that.board[x][y], clickTeam, 1);
        }).reduce(function(a,b){return a+b});
        if (alignedNeighbors == 0) {
            // can't click here unless we have a drop and the cell true neutral
            if (this.players[playerName].drops == 0 || cell.control != 0) {
                return;
            }

            this.players[playerName].drops -= 1;
        }
    }


    var value = this.players[playerName].clickValue;
    this.pendingClicks.push(new Click(value, cell, playerName, Click.PLAYER_CLICK_PRIORITY, function(rem){
        if (cell.base) {
            var targetTeam = that.players[cell.base.owner].team;
            if (targetTeam == clickTeam) {
                // attempt to heal base before mining
                var orig = rem;
                rem = cell.base.processHeal(rem);
                if (orig != rem) {
                    that.dirtyCells.push(cell);
                }
            }
        }

        that.awardGold(playerName, Math.max(1,Math.round(rem)) * cell.value);
        return [];
    }));
};

Game.prototype.awardGold = function(playerName, amount) {
    var player = this.players[playerName];
    player.gold += amount;
    player.lastUpdated = this.serial + 1;
    this.stats[player.team].gold += amount;
};

Game.prototype.processPurchase = function(playerName, purchaseData) {
    this.pendingPurchases.push({
        playerName: playerName,
        data: purchaseData
    });
};

Game.prototype.purchaseBase = function(playerName, purchaseData) {
    var cellState = this.board[purchaseData.x][purchaseData.y];
    if (cellState.base != null) {
        throw new Error("board space (" + purchaseData.x + "," + purchaseData.y + ") is not empty!" );
    }

    var playerState = this.players[playerName];
    if ((cellState.control < maxControl && playerState.team == 1) || (cellState.control > -maxControl && playerState.team == 0)) {
        throw new Error("Team does not control (" + purchaseData.x + "," + purchaseData.y + ")");
    }

    var base = new Base(purchaseData.x, purchaseData.y, playerName);
    var cellState = this.board[purchaseData.x][purchaseData.y];
    cellState.base = base;
    this.bases.push(base);
    this.dirtyCells.push(cellState);
    return "New Base Created ( " + purchaseData.x + "," + purchaseData.y + ")";
};

Game.prototype.purchaseBaseOffense = function(playerName, purchaseData) {
   var cellState = this.board[purchaseData.x][purchaseData.y];
   if (cellState.base == null) {
       throw new Error("board space (" + purchaseData.x + "," + purchaseData.y + ") does not have a base!" );
   }

   var playerState = this.players[playerName];
   if ((cellState.control < maxControl && playerState.team == 1) || (cellState.control > -maxControl && playerState.team == 0)) {
       throw new Error("Team does not control (" + purchaseData.x + "," + purchaseData.y + ")");
   }

   cellState.base.offense += 1;
   cellState.base.upgradesTotal += 1;
   this.dirtyCells.push(cellState);
   return "Base offense upgraded to " + cellState.base.offense + " (" + purchaseData.x + "," + purchaseData.y + ")";
};

Game.prototype.purchaseBaseDefense = function(playerName, purchaseData) {
   var cellState = this.board[purchaseData.x][purchaseData.y];
   if (cellState.base == null) {
       throw new Error("board space (" + purchaseData.x + "," + purchaseData.y + ") does not have a base!" );
   }

   var playerState = this.players[playerName];
   if ((cellState.control < maxControl && playerState.team == 1) || (cellState.control > -maxControl && playerState.team == 0)) {
       throw new Error("Team does not control (" + purchaseData.x + "," + purchaseData.y + ")");
   }

   cellState.base.defense += 1;
   cellState.base.upgradesTotal += 1;
   this.dirtyCells.push(cellState);
   return "Base defense upgraded to " + cellState.base.defense + " (" + purchaseData.x + "," + purchaseData.y + ")";
};

Game.prototype.purchaseBaseCapacity = function(playerName, purchaseData) {
   var cellState = this.board[purchaseData.x][purchaseData.y];
   if (cellState.base == null) {
       throw new Error("board space (" + purchaseData.x + "," + purchaseData.y + ") does not have a base!" );
   }

   var playerState = this.players[playerName];
   if ((cellState.control < maxControl && playerState.team == 1) || (cellState.control > -maxControl && playerState.team == 0)) {
       throw new Error("Team does not control (" + purchaseData.x + "," + purchaseData.y + ")");
   }

   cellState.base.capacity += 10;
   cellState.base.upgradesTotal += 1;
   this.dirtyCells.push(cellState);
   return "Base capacity upgraded to " + cellState.base.capacity + " (" + purchaseData.x + "," + purchaseData.y + ")";
};

Game.prototype.purchasePlayerClickValue = function(playerName, purchaseData) {
   var playerState = this.players[playerName];
   playerState.clickValue += 1;

   playerState.lastUpdated = this.serial + 1;
   return "Player click value upgraded to " + playerState.clickValue;
};


var validateClick = function(click) {
    if (typeof click === 'undefined' || click === null) {
        return false;
    }

    if (click.hasOwnProperty('x') == false || click.hasOwnProperty('y') == false) {
        return false;
    }

    if (click.x < 0 || click.x >= boardWidth) {
        return false;
    }

    if (click.y < 0 || click.y >= boardHeight) {
        return false;
    }

    return true;
};

var validatePurchase = function(purchase) {
    if (typeof purchase === 'undefined' || purchase === null) {
        return false;
    }

    if (purchase.hasOwnProperty('playerName') == false) {
        return false;
    }

    if (purchase.hasOwnProperty('data') == false) {
        return false;
    }

    if (purchase.data.hasOwnProperty('x') == false || purchase.data.hasOwnProperty('y') == false) {
        return false;
    }

    if (purchase.data.x < 0 || purchase.data.x >= boardWidth) {
        return false;
    }

    if (purchase.data.y < 0 || purchase.data.y >= boardHeight) {
        return false;
    }

    return true;
}

Game.prototype.processTick = function() {
    var that = this;
    var input = this.pendingClicks;
    var purchases = this.pendingPurchases;
    this.pendingClicks = [];
    this.pendingPurchases = [];
    var nextSerial = this.serial + 1;

    // process clicks
    Click.process(this, input, nextSerial);

    // process purchases
    var playerPurchaseResponses = purchases.map(function(purchase){
        console.log("processing purchase " + JSON.stringify(purchase));
        var id = purchase.data.id;

        function res(key, value) {
            var retval = {playerName: purchase.playerName, response: {id: id}};
            retval.response[key] = value;
            return retval;
        }

        function err(msg) {
            return res("error",msg);
        }

        if (false == validatePurchase(purchase)) {
            return err("Invalid Purchase");
        }

        if (that.store.hasOwnProperty(purchase.data.type) == false) {
            return err("unknown purchasable " + purchase.data.type );
        }

        var purchasable = that.store[purchase.data.type];
        var playerState = that.players[purchase.playerName];



        try {
            console.log('calling process');
            var cellState = that.board[purchase.data.x][purchase.data.y];
            var cost = purchasable.cost(playerState, cellState);

            if (playerState.gold < cost ) {
               return err("insufficient funds, require " + cost);
            }

            var receipt = purchasable.process(purchase.playerName, purchase.data);
            playerState.gold -= cost;
            playerState.lastUpdated = nextSerial;
            return res("receipt", receipt);
        } catch (e) {
            console.log(e.stack || e.message || e);
            return err(e.stack || e.message || e);
        }
    })
    .reduce(filterNulls,[])
    .reduce(function(playerResponses, response){
        playerResponses[response.playerName] = playerResponses[response.playerName] || [];
        playerResponses[response.playerName].push(response.response);
        return playerResponses;
    }, {});

    // process bases
    var baseClicks = this.bases.map(function(base){
        var clicks = base.process(that);
        if (clicks == null) {
            // base is dead
            that.board[base.x][base.y].base = null;
        }

        return clicks;
    }).reduce(filterNulls,[]);
    this.pendingClicks = [].concat.apply(this.pendingClicks, baseClicks);

    // remove dead bases
    this.bases = this.bases.filter(function(base){
        if (that.board[base.x][base.y].base != base) {
            return false;
        }

        return true;
    });

    var dirtyKeys = {};
    var boardUpdates = this.dirtyCells.filter(function(cell){
        var cellKey = cell.id;
        if (dirtyKeys.hasOwnProperty(cellKey)) {
            return false;
        } else {
            dirtyKeys[cellKey] = true;
            return true;
        }
    }).map(function(cell){
        return cell.generateUpdate();
    });

    this.dirtyCells=[];
    this.serial = nextSerial;
    this.updateClients(boardUpdates, playerPurchaseResponses);
};

module.exports = Game;
