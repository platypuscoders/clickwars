define(function() {
	// A battlesquare is an interactable terrain square
	var Control = function() {
		return {
			red: 0,
			blue: 0
		};
	}

	return function(x, y, width, height, parent, view) {
		this.x = x;
		this.y = y;
		this.parent = parent
		this.width = width;
		this.height = height;
		this.value = 1;
		this.control = 0;
		this.base = null;
		this.offense = 0;
		this.defense = 0;
		this.soldiers = -1;
		this.capacity = 0;
		this.upgradesTotal = 0;
		this.view = view;
		this.div_name = 'bs-' + x + '-' + y;
		$(parent).append("<div id='" + this.div_name + "'></div>");

		this.getColor = function(control) {
			var redColor   = 255;
			var greenColor = 255;
			var blueColor  = 255;

			if (this.control > 0) {
				blueColor = 255;
				greenColor = 255 - Math.floor((this.control / 100) * 255);
				redColor = greenColor;
			} else if (this.control < 0) {
				redColor = 255;
				greenColor = 255 - Math.floor((-this.control / 100) * 255);
				blueColor = greenColor;
			}

			//var color = "#" + red.toString(16) + green.toString(16) + blue.toString(16);
			var color = "rgb(" + redColor + "," + greenColor + "," + blueColor + ")";
			return color;
		};

		this.setActive = function(state) {
			console.log("set sqaure to " + state + ": (" + x + "/" + y + ")");

			this.active = state;
			if (state === true) {
				this.draw();
			}
		};

		this.draw = function() {
            if (this.base) {
                $('#' + this.div_name).html('<div style="text-align: center; pointer-events: none;">' + this.offense + '&nbsp;&nbsp;' + this.defense + '</div>' +
							'<div style="text-align: center; pointer-events: none">' + Math.floor(this.soldiers / 10) + '/' + Math.floor(this.capacity / 10) + '</div>');
            } else {
                $('#' + this.div_name).html('');
            }
			$('#' + this.div_name).css('background-color',      '');
			$('#' + this.div_name).css('background-color',      this.getColor(this.control));
			$('#' + this.div_name).css('padding',               '0px 0px 0px 0px');
			$('#' + this.div_name).css('position',              'absolute');
			$('#' + this.div_name).css('-webkit-touch-callout', 'none');
			$('#' + this.div_name).css('-webkit-user-select',   'none');
			$('#' + this.div_name).css('-khtml-user-select',    'none');
			$('#' + this.div_name).css('-moz-user-select',      'none');
			$('#' + this.div_name).css('-ms-user-select',       'none');
			$('#' + this.div_name).css('user-select',           'none');

			if (this.control > 0) {
				$('#' + this.div_name).css('border', '2px solid blue');
				$('#' + this.div_name).css('height', this.height - 4 + 'px');
				$('#' + this.div_name).css('width', this.width - 4 + 'px');
				$('#' + this.div_name).css('margin', '1');
				$('#' + this.div_name).css('left', ((this.x * this.width)  + $(this.parent).offset().left) + 1 + "px");
				$('#' + this.div_name).css('top',  ((this.y * this.height) + $(this.parent).offset().top) + 1 + "px");
			} else if (this.control < 0) {
				$('#' + this.div_name).css('border', '2px solid red');
				$('#' + this.div_name).css('height', this.height - 4 + 'px');
				$('#' + this.div_name).css('width', this.width - 4 + 'px');
				$('#' + this.div_name).css('margin', '1');
				$('#' + this.div_name).css('left', ((this.x * this.width)  + $(this.parent).offset().left) + 1 + "px");
				$('#' + this.div_name).css('top',  ((this.y * this.height) + $(this.parent).offset().top) + 1 + "px");

			} else {
				$('#' + this.div_name).css('border', '1px solid black');
				$('#' + this.div_name).css('height', this.height - 2 + 'px');
				$('#' + this.div_name).css('width', this.width - 2 + 'px');
				$('#' + this.div_name).css('margin', '1');
				$('#' + this.div_name).css('left', ((this.x * this.width)  + $(this.parent).offset().left) + 1 + "px");
				$('#' + this.div_name).css('top',  ((this.y * this.height) + $(this.parent).offset().top) + 1 + "px");
			}

			if (this.active === true) {
				this.drawBattleview();
			}
		};

		this.drawBattleview = function() {
			$('#bsCoords').html("(" + this.x + "/" + this.y + ")");
			$('#bsControl').html(this.control);
			if (this.control < 0) {
				$('#bsOwner').html("red");
			} else if (this.control > 0) {
				$('#bsOwner').html("blue");
			} else {
				$('#bsOwner').html("unaligned");
			}

			if (this.base != null) {
				$('#bsOffense').html(this.offense);
				$('#bsDefense').html(this.defense);
				$('#bsSoldiers').html(this.soldiers);
				$('#bsCapacity').html(this.capacity);


				$('#offenseCost').html(Math.ceil(100 * Math.pow(1.1, this.upgradesTotal)));
				$('#defenseCost').html(Math.ceil(75 * Math.pow(1.1, this.upgradesTotal)));
				$('#capacityCost').html(Math.ceil(50 * Math.pow(1.1, this.upgradesTotal)));
			} else {
				$('#bsOffense').html("none");
				$('#bsDefense').html("none");
				$('#bsSoldiers').html("none");
				$('#bsCapacity').html("none");
			}
		};
	};
});
