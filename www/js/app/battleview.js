(function () {
	$('#battleview').append(
        '<div>Gold: <span id="goldValue"></span></div>',
 			'<div>Click Value: <span id="clickValue">-</span><button id="playerClickValueButton">Buy (<span id="clickValueCost">5000</span>)</button></div>',
        $('<div>').append(
            $('<a>').text("Buy Base").on('click', function(){
                radio('buyBase').broadcast(true);
            })
        )
    );

	$('#battleview').append('<div id="battlesquare"> \
			<div>Cell Coordinates: <span id="bsCoords"></span></div> \
			<div>Owner: <span id="bsOwner">unaligned</span></div> \
			<div>Control: <span id="bsControl">0</span></div> \
			<div>Base States</div> \
			<div>Attack: <span id="bsOffense">none</span><button id="bsOffenseButton">Buy (<span id="offenseCost">100</span>)</button></div> \
			<div>Defense: <span id="bsDefense">none</span><button id="bsDefenseButton">Buy (<span id="defenseCost">75</span>)</button></div> \
			<div>Capacity: <span id="bsCapacity">none</span><button id="bsCapacityButton">Buy (<span id="capacityCost">50</span>)</button></div> \
			<div>Current Soldiers: <span id="bsSoldiers">none</span></div> \
		</div>');



	radio('goldUpdate').subscribe(function(data) {
		$('#goldValue').html(data);
	});
	radio('clickValueUpdate').subscribe(function(data) {
		$('#clickValue').html(data);
		$('#clickValueCost').html(Math.ceil(5000 * Math.pow(1.1, data - 10)));
	});

	$(document).ready(function(){
		$('#battleview').append(
			$('<div>')
				.css("position", "relative")
				.css("width", "100%")
				.css("height", "400px")
				.append(
					$('<div>')
						.attr("id", "battlegraph")
						.append($('<canvas id="graphcanvas" width="400" height="300"></canvas>'))
			)
		);

		var ctx = $("#graphcanvas").get(0).getContext("2d");
		var goldChart = new Chart(ctx);
		var goldDataset = {
			labels: [],
			datasets: [
				{
					label: "Red Team Gold",
					fillColor: "rgba(0,0,0,0)",
					strokeColor: "rgba(255,0,0,1)",
					pointColor: "rgba(255,0,0,1)",
					data: [null]
				},{
					label: "Blue Team Gold",
					fillColor: "rgba(0,0,0,0)",
					strokeColor: "rgba(0,0,255,1)",
					pointColor: "rgba(0,0,255,1)",
					data: [null]
				}
			]
		};

		var teamGoldLines = goldChart.Line(goldDataset, {animation: false});
		var totalStats = 0;
		radio('boardUpdate').subscribe(function(update){
			var stats = update.stats;
			if (stats[0].gold == 0 && stats[1].gold == 0) {
				return;
			}

			if (update.serial % 5 !== 0) {
				return;
			}

			totalStats += 1;
			var label = update.serial % 100 === 0 ? "^": "";
			teamGoldLines.addData([stats[0].gold, stats[1].gold], label);

			while (totalStats > 20) {
				teamGoldLines.removeData();
				totalStats -= 1;
			}
		});
	});
})();
