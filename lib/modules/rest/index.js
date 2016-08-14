var Promise = require('bluebird'),
    jsonBody = require("body/json"),
    utilities = require('../../system/utilities'),
    Mesh = require('../../../')
  ;

module.exports = Rest;

/**
 * Rest component, exposes the exchange over a lightweight REST service
 * @constructor
 */
function Rest() {

}

/**
 * Does a happn login, returns a session token that is usable for subsequent operations
 * @param $happn
 * @param req
 * @param res
 */
Rest.prototype.login = function($happn, req, res){

  var _this = this;

  _this.__parseBody(req, res, $happn, function(body){

      if (!body.username) return _this.__respond($happn, "Failure parsing request body", null, new Error('no username'), res);
      if (!body.password) return _this.__respond($happn, "Failure parsing request body", null, new Error('no password'), res);

      //TODO: use happn sec serve

      _this.__securityService.login({username:body.username, password:body.password}, function(e, session){
        if (e) return _this.__respond($happn, "Failure logging in", null, e, res);
        _this.__respond($happn, "Logged in ok", {token:session.token}, null, res);
      });
    }
  );
};

/**
 * Attached to the mesh middleware, takes calls for a description of the API
 * @param $happn
 * @param req
 * @param res
 */
Rest.prototype.describe = function($happn, req, res){
  this.__respond($happn, $happn._mesh.description.name + ' description', this.__exchangeDescription, null, res);
};

Rest.prototype.__respond = function($happn, message, data, error, res, code){

  var responseString = '{"message":"' + message + '", "data":{{DATA}}, "error":{{ERROR}}}';

  var header = {
    'Content-Type': 'application/json'
  };

  if (error) {

    if (!code) code = 500;
    responseString = responseString.replace("{{ERROR}}", utilities.stringifyError(error));

  } else {

    if (!code) code = 200;
    responseString = responseString.replace("{{ERROR}}", "null");

  }

  res.writeHead(code, header);

  if (data !== null) responseString = responseString.replace("{{DATA}}", JSON.stringify(data));
  else responseString = responseString.replace("{{DATA}}",  "null");

  res.end(responseString);
};

Rest.prototype.__authorize = function(req, res, $happn, $origin, uri, successful){

  var _this = this;

  if ($happn._mesh.config.datalayer.secure){ //check we need to check security

    if (!$origin) return _this.__respond($happn, "Bad origin", null, new Error('origin of call unknown'), res, 403);

    var accessPoint = "/_exchange/" + uri;

    //session, path, action, callback
    _this.__securityService.authorize($origin, accessPoint, 'set', function(e){
      if (e) return _this.__respond($happn, "Access denied", null, e, res, 403);

      successful();
    });

  } else successful();

};

Rest.prototype.__parseBody = function (req, res, $happn, callback) {

  var _this = this;

  try{

    if (req.body) return callback(req.body);

    jsonBody(req, res, function(e, body){

      if (e) return _this.__respond($happn, "Failure parsing request body", null, e, res);

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

  _this.__parseBody(req, res, $happn, function(body){

    if (!body.uri) return _this.__respond($happn, "Failure parsing request body", null, new Error('no uri configured'), res);

    if (body.uri.indexOf('/') == 0) body.uri = body.uri.substring(1, body.uri.length);
    
    _this.__authorize(req, res, $happn, $origin, body.uri, function(){

      var callPath = body.uri.split('/');

      //ensure we don't have a leading /
      if (callPath.length > 4) return _this.__respond($happn, "Failure parsing request body", null, new Error('call path cannot have more than 4 segments'), res);

      var mesh;
      var component;
      var method;

      var meshDescription;
      var componentDescription;
      var methodDescription;

      var componentIndex = 0;

      if (callPath.length == 3) {
        componentIndex = 1;
        mesh = $happn.exchange[callPath[0]];
        meshDescription = _this.__exchangeDescription.endpoints[callPath[0]];
      }
      else {
        mesh = $happn.exchange;
        meshDescription = _this.__exchangeDescription;
      }

      if (mesh[callPath[componentIndex]]) component = mesh[callPath[componentIndex]];
      else return _this.__respond($happn, "Failure parsing request body", null, new Error('component ' + callPath[componentIndex] + ' does not exist on mesh'), res, 404);

      componentDescription = meshDescription.components[callPath[componentIndex]];

      var methodIndex = componentIndex + 1;

      if (component[callPath[methodIndex]]) method = component[callPath[methodIndex]];
      else return _this.__respond($happn, "Failure parsing request body", null, new Error('method ' + callPath[methodIndex] + ' does not exist on component ' + callPath[componentIndex]), res, 404);

      methodDescription = componentDescription.methods[callPath[methodIndex]];

      var args = [];

      var __callback = function(e, response){

        if (e) return _this.__respond($happn, "Call failed", null, e, res, 500);

        _this.__respond($happn, "Call successful", response, null, res);
      };

      var callbackFound = false;

      methodDescription.parameters.map(function(parameter){

        if (parameter.name == 'callback'){
          args.push(__callback);
          callbackFound = true;
          return;
        }

        if (body.parameters[parameter.name]) args.push(body.parameters[parameter.name]);
        else args.push(null);

      });

      //add the callback handler
      if (!callbackFound) args.push(__callback);

      method.apply(method, args);

    });
  });
};

Rest.prototype.attachedToMeshEvents = false;

Rest.prototype.__wrapExchange = Promise.promisify(function($happn, callback){

  var _this = this;

  var cleanDescription = function(desc, exclusions){

    var cleaned = {};

    exclusions.push('initializing');
    exclusions.push('setOptions');
    exclusions.push('_meta');

    Object.keys(desc).map(function(key){
      if (exclusions.indexOf(key) >= 0) return;
      cleaned[key] = desc[key];
    });

    return cleaned;
  };

  _this.__exchangeDescription = cleanDescription($happn._mesh.description, [$happn._mesh.description.name]);
  _this.__exchangeDescription.endpoints = {};

  Object.keys($happn._mesh.endpoints).map(function(endpointName){

    if (endpointName == $happn._mesh.description.name) return;

    var endPoint = $happn._mesh.endpoints[endpointName];
    _this.__exchangeDescription.endpoints[endpointName] = cleanDescription(endPoint.description, [endPoint.description.name])

  });

  if (!this.attachedToMeshEvents){
    //TODO:hook into exchange
    //TODO: we need exchange changed events

    this.attachedToMeshEvents = true;
  }

  callback();
});

Rest.prototype.initialize = function ($happn, callback) {

    var _this = this;

    _this.__securityService = $happn._mesh.datalayer.server.services.security;

    _this.__wrapExchange($happn)
    .then(callback)
    .catch(callback);

};
