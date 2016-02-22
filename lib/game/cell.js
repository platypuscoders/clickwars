/**
 * Created by Bart on 9/1/15.
 */
var Cell = function(x, y, maxControl) {
    this.x = x;
    this.y = y;
    this.control = 0;
    this.value = 10;
    this.base = null;
    this.offense = 0;
    this.defense = 0;
    this.lastUpdated = 0;
    this.id = x + '_' + y;
    this.maxControl = maxControl;
};

Cell.prototype.generateUpdate = function() {
    var that = this;
    var res = ['x','y','control','value'].reduce(function(update, field){
        update[field] = that[field];
        return update;
    },{});

    if (this.base) {
        res.soldiers = Math.ceil(this.base.soldiers);
        res.capacity = this.base.capacity;
        res.base = this.base.name;
        res.baseUpgradesTotal = this.base.upgradesTotal;
        res.offense = this.base.offense;
        res.defense = this.base.defense;
    } else {
        res.soldiers = 0;
        res.capacity = 0;
        res.offense = 0;
        res.defense = 0;
        res.base = null;
    }

    return res;
};

Cell.prototype.processClicks = function(numClicks, team, game, nextSerial) {
    var rem = numClicks;
    var controlDir = team === 1 ? 1 : -1;
    var cellTeam = this.control < 0 ? 0 : this.control > 0 ? 1 : -1;
    var changed = false;

    if (team !== cellTeam) {
        // attacking click
        if (this.base && this.base.soldiers > 0 && rem > 0) {
            var orig = rem;
            rem = this.base.processAttack(rem);
            if (orig != rem) {
                changed = true;
            }
        }
    }

    if (rem > 0 && (this.control * controlDir) < this.maxControl) {
        var control = Math.min(this.maxControl - (this.control * controlDir), rem);
        rem -= control;
        this.control += control * controlDir;
        changed = true;
    }

    if (changed) {
        game.dirtyCells.push(this);
        this.lastUpdated = nextSerial;
    }
    return rem;
};

module.exports = Cell;
