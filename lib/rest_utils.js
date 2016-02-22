var crud = require('./crud');
var fibrous = require('fibrous');




/** validate_json_params_exist */
exports.validate_params_exist = function(params, parameter_names) {
  if (parameter_names == []) {
    return {result: true};
  }

  if (params == {}) {
    return {result: false, bad_parameter: parameter_names[0]};
  }

  var key;
  for (key in parameter_names) {
    if (typeof params[parameter_names[key]] === 'undefined') {
      return {result: false, bad_parameter: parameter_names[key]};
    }
  }

  return {result: true};
};


/** create_handler */
exports.create_rest_handler = function(rest_parameters, body_parameters, fn) {
  return function() {
    var res = arguments[1];
    var rest_params = arguments[0].params;
    var result = validate_params_exist(rest_params, rest_parameters);
    if (result.result === false) {
    	res.status(crud.HTTP_BAD_REQUEST).send("Missing url parameter: " + result.bad_parameter);
      return;
    }

    var body_params = arguments[0].body;
    console.log(body_params);
    console.log(body_parameters);
    result = validate_params_exist(body_params, body_parameters);
    console.log("ret");
    if (result.result === false) {
    	res.status(crud.HTTP_BAD_REQUEST).send("Missing body parameter: " + result.bad_parameter);
      return;
    }

    console.log(fn);
    return fn.call(this, arguments[0], arguments[1]);
  };
};

/** success */
var success = function(value) {
  return JSON.stringify({result: 1, value: value});
};


/** error */
var error = function(value) {
  return JSON.stringify({result: 0, value: value});
};

var start_web = function() {
  var port = process.env.PORT || 8181;
  app.listen(port, function() {
    console.log('API server listening on port %d in %s mode.', port, app.get('env'));
  });
};

