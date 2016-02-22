/**
 * Created by Bart on 9/1/15.
 */
var Player = function() {
    this.team = -1;
    this.gold = 0;
    this.lastUpdated = 0;
    this.clickValue = 10;
    this.drops = 1;
};

module.exports = Player;
