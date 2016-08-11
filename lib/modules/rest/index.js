var Promise = require('bluebird'),
    jsonBody = require("body/json")
  ;

module.exports = Rest;

/**
 * Rest component, exposes the exchange over a lightweight REST service
 * @constructor
 */
function Rest() {

}

/**
 * Attached to the mesh middleware, takes calls for a description of the API
 * @param $happn
 * @param req
 * @param res
 */
Rest.prototype.describe = function($happn, req, res){
  this.__respond($happn, $happn._mesh.name + ' description', this.__exchangeDescriptionSerialized, null, res);
};

Rest.prototype.__respond = function($happn, message, data, error, res, code){

  var responseString = '{"message":"' + message + '", "data":{{DATA}}, "error":{{ERROR}}}';

  var header = {
    'Content-Type': 'application/json'
  };

  if (error) {

    if (!code) code = 500;
    responseString = responseString.replace("{{ERROR}}", $happn._mesh.utilities.stringifyError(error));

  } else {

    if (!code) code = 200;
    responseString = responseString.replace("{{ERROR}}", "null");

  }

  res.writeHead(code, header);

  if (data) responseString = responseString.replace("{{DATA}}", JSON.stringify(data));
  else responseString = responseString.replace("{{DATA}}",  "null");

  res.end(responseString);
};

var __cache_arguments = {};

Rest.prototype.__methodArguments = function(methodName, method){

  if (!__cache_arguments[methodName]) __cache_arguments[methodName] = $happn._mesh.utilities.getFunctionParameters(method);
  return __cache_arguments[methodName];
};

Rest.prototype.__parseBody = function (req, res, $happn, $origin, callback) {

  var _this = this;

  try{

    jsonBody(req, res, function(e, body){

      if (e) return _this.__respond($happn, "Failure parsing request body", null, e, res);

      if (!body.uri) return _this.__respond($happn, "Failure parsing request body", null, new Error('no uri configured'), res);

      callback(body);

    });

  }catch(e){
    return _this.__respond($happn, "Failure parsing request body", null, e, res);
  }
};

/**
 * Attached to the mesh middleware, takes in the request body and attempts to execute an exchange method based on the request parameters
 * @param req
 * @param res
 * @param $happn
 * @param $origin
 */
Rest.prototype.handleRequest = function (req, res, $happn, $origin) {

  var _this = this;

  _this.__parseBody(req, res, $happn, $origin, function(body){

    var callPath = body.uri.split('/');

    if (callPath.length > 3) return _this.__respond($happn, "Failure parsing request body", null, new Error('call path cannot have more than 3 segments'), res);

    var mesh;
    var component;
    var method;

    var componentIndex = 0;

    if (callPath.length == 3) {
      componentIndex = 1;
      mesh = $happn._mesh.exchange[callPath[0]];
    }
    else mesh = $happn._mesh.exchange;

    if (mesh[callPath[componentIndex]]) component = mesh[callPath[componentIndex]];
    else return _this.__respond($happn, "Failure parsing request body", null, new Error('component ' + callPath[componentIndex] + ' does not exist on mesh'), res, 403);

    var methodIndex = componentIndex + 1;

    if (mesh[callPath[methodIndex]]) method = mesh[callPath[methodIndex]];
    else return _this.__respond($happn, "Failure parsing request body", null, new Error('method ' + callPath[methodIndex] + ' does not exist on component'), res, 403);


    //
    // var methodDescription =
    //
    // var arguments = _this.__methodArguments(callPath[methodIndex], method);
    //
    // var callArguments = [];
    //
    // for (var argIndex in arguments){
    //
    //   var argName = arguments[argIndex];
    //
    //   if (argName == '$happn') return callArguments.push($happn);
    //   if (argName == '$origin') return callArguments.push($origin);
    //
    //   if (requestArguments[argName]) callArguments.push(requestArguments[argName]);
    //   else callArguments.push(null);
    // }
    //
    // body.parameters.push(function(e, result){
    //
    // });
    //
    // method.call(method, body.parameters)


  });
};

Rest.prototype.attachedToMeshEvents = false;

Rest.prototype.__wrapExchange = Promise.promisify(function($happn, callback){

  this.__exchangeDescriptionSerialized = JSON.stringify($happn._mesh.description);

  this.__meshDescription = $happn._mesh.description;

  if (!this.attachedToMeshEvents){
    //TODO: we need exchange changed events

    this.attachedToMeshEvents = true;
  }

  callback();
});

Rest.prototype.initialize = function ($happn, callback) {

    var _this = this;

    _this.__wrapExchange($happn)
    .then(callback)
    .catch(callback);

};
