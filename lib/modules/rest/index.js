var Promise = require('bluebird'),
    jsonBody = require("body/json"),
    utilities = require('../../system/utilities'),
    Mesh = require('../../../'),
    async = require('async')
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
Rest.prototype.describe = function($happn, req, res, $origin){

  var description = this.__exchangeDescription;
  var _this = this;

  if ($origin && $origin.username != '_ADMIN'){

    description = JSON.parse(JSON.stringify(this.__exchangeDescription));

    async.eachSeries(Object.keys(description.callMenu), function(accessPoint, accessPointCB){

      _this.__authorizeAccessPoint($happn, $origin, accessPoint, function(e, authorized){

        if (e) accessPointCB(e);

        if (!authorized) delete description.callMenu[accessPoint];

        accessPointCB();
      });

    }, function(e){

      if (e) _this.__respond($happn, 'call failed', null, e, res);
      _this.__respond($happn, $happn._mesh.description.name + ' description', description.callMenu, null, res);
    });

  } else this.__respond($happn, $happn._mesh.description.name + ' description', description.callMenu, null, res);
};

Rest.prototype.__respond = function($happn, message, data, error, res, code){

  var responseString = '{"message":"' + message + '", "data":{{DATA}}, "error":{{ERROR}}}';

  var header = {
    'Content-Type': 'application/json'
  };

  //doing the replacements to the response string, allows us to stringify errors without issues.

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

Rest.prototype.__authorizeAccessPoint = function($happn, $origin, accessPoint, callback){

  var _this = this;

  accessPoint = utilities.removeLeading('/', accessPoint);
  accessPoint = "/_exchange/requests/" + $happn._mesh.config.name + "/" + accessPoint;
  
  _this.__securityService.authorize($origin, accessPoint, 'set', function(e, authorized){

    callback(e, authorized);
  });
};

Rest.prototype.__authorize = function(req, res, $happn, $origin, uri, successful){

  var _this = this;

  if ($happn._mesh.config.datalayer.secure){ //check we need to check security

    if (!$origin) return _this.__respond($happn, "Bad origin", null, new Error('origin of call unknown'), res, 403);

    _this.__authorizeAccessPoint($happn, $origin, uri, function(e, authorized){

      if (e) return _this.__respond($happn, "Authorization failed", null, e, res, 403);
      if (!authorized) return _this.__respond($happn, "Authorization failed", null, new Error("Access denied"), res, 403);

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

    body.uri = utilities.removeLeading('/', body.uri);

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

        var meshName = callPath[0];

        if (meshName != $happn._mesh.config.name) return _this.__respond($happn, "Access denied", null, new Error('attempt to access remote mesh: ' + meshName), res, 403);

        componentIndex = 1;
        mesh = $happn.exchange[meshName];

      }else mesh = $happn.exchange;

      meshDescription = _this.__exchangeDescription;

      var componentName = callPath[componentIndex];

      if (componentName == 'security') return _this.__respond($happn, "Access denied", null, new Error('attempt to access security component over rest'), res, 403);

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

Rest.prototype.__buildCallMenu = function(exchangeDescription, endpoint, menu){

  var callMenu = {};

  if (menu) callMenu = menu;

  for (var componentName in exchangeDescription.components){

    var component = exchangeDescription.components[componentName];

    if (componentName == 'security') continue;

    for (var methodName in component.methods){

      var method = component.methods[methodName];
      var callUri = '/' + componentName + '/' + methodName;

      if (endpoint) callUri = '/' + endpoint + callUri;

      var operation =  {
        uri:callUri,
        parameters:{}
      };

      method.parameters.map(function(param){
        if (param.name == 'callback') return;
        operation.parameters[param.name] = '{{' + param.name +'}}';
      });

      callMenu[callUri] = operation;

    }
  }

  //no leap frogging, discussion with Richard
  // for (var endpointName in exchangeDescription.endpoints){
  //   Rest.prototype.__buildCallMenu(exchangeDescription.endpoints[endpointName], endpointName, callMenu);
  // }

  return callMenu;
};

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

  //leap frogging not allowed
  // _this.__exchangeDescription.endpoints = {};
  //
  // Object.keys($happn._mesh.endpoints).map(function(endpointName){
  //
  //   if (endpointName == $happn._mesh.description.name) return;
  //
  //   var endPoint = $happn._mesh.endpoints[endpointName];
  //   _this.__exchangeDescription.endpoints[endpointName] = cleanDescription(endPoint.description, [endPoint.description.name])
  //
  // });

  if (!this.attachedToMeshEvents){
    //TODO:hook into exchange
    //TODO: we need exchange changed events

    this.attachedToMeshEvents = true;
  }

  _this.__exchangeDescription.callMenu = _this.__buildCallMenu(_this.__exchangeDescription);

  callback();
});

Rest.prototype.initialize = function ($happn, callback) {

    var _this = this;

    _this.__securityService = $happn._mesh.datalayer.server.services.security;

    _this.__wrapExchange($happn)
    .then(callback)
    .catch(callback);

};
