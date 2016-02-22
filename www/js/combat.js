
(function() {
	var villianHealthValue = 1000;

	var updateHealthDisplay = function() {
		$("#villianHealth").html("Villian Health: " + villianHealthValue);
	};

	$("#villian").click(function() {
		villianHealthValue -= 1;
		updateHealthDisplay();
	});

	updateHealthDisplay();
})();
