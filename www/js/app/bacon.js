define(function (require) {
	$('#bacon').append("<button id='cookieButton'>Cookie</button>");
  $('#bacon').append("<button id='buyStoreA'>Buy Store A</button>");

  $('#bacon').append("<div>Cookies Clicked: <scan id='cookies'></scan></div>");
  $('#bacon').append("<div>Store A Score: <scan id='storeAScore'></scan></div>");
  $('#bacon').append("<div>Stores Owned A: <scan id='storeAOwned'></scan></div>");
  $('#bacon').append("<div>Store Cost A: <scan id='storeACost'></scan></div>");
  $('#bacon').append("<div>Cookies Owned: <scan id='totalCookies'></scan></div>");

  //
  // Initial Values
  var startingScore = 0;
  var startingCookies = 0;
  var startingStores = 0;
  var storeAProduction = 1;
  var storeAPurchaseCost = 10;
  var tickIntervalms = 500;

  //
  // Helper Functions
  var ClickStream = function(id) { return $(id).asEventStream('click').map(1); }
  var accum = function(x, y) { return x + y; };

  //
  // Tick stream
  var tick = Bacon.interval(tickIntervalms, 1);

  //
  // Cookie stream
  var cookie = new ClickStream('#cookieButton');
  var cookieCount = cookie.scan(startingCookies, accum);
  cookieCount.onValue(function(value) {
    $('#cookies').html(value);
  });


  // Stores count
  var buyStoreA = new ClickStream('#buyStoreA');
  var storeACount = buyStoreA.scan(startingStores, accum);
  console.log(storeACount);

  storeACount.onValue(function(value) {
    $('#storeAOwned').html(value);
  });

  var storeACost = storeACount.map(function(x) {
    return x * -10;
  });
  storeACost.onValue(function(value) {
    $('#storeACost').html(value);
  });

  var storeAScore = storeACount.sampledBy(tick).scan(startingScore, function(acc, val) { return acc + (val * storeAProduction); });
  // Score is the count of cookies and the input from the store
  storeAScore.onValue(function(value) {
    $('#storeAScore').html(value);
  });


  //
  // Cookies Owned
  var add = function(x,y) { return x + y; };
  var totalCookies = cookieCount.combine(storeAScore, add).combine(storeACost, add);

  totalCookies.onValue(function(value) {
    $('#totalCookies').html(value);
  });
  

  // Test if store can be purchased
  var canPurchaseStoreA = totalCookies.map(function (x) { return x >= storeAPurchaseCost; });
  canPurchaseStoreA.not().onValue($('#buyStoreA'), "attr", "disabled");


});
