var Promise = require('bluebird'),
    jsonBody = require("body/json")
  ;

module.exports = Rest;

// For shared Rest.

function Rest() {

}

Rest.prototype.describe = function($happn, req, res){

  var header = {
    'Content-Type': 'application/json',
    'Content-Length': this.__exchangeDescription.length
  };

  res.writeHead(200, header);

  $happn.log.$$TRACE('rest describe request ' + req.url);

  res.end(this.__exchangeDescription);
};

Rest.prototype.__errorResponse = function($happn, message, error){
  var responseString = '{"response":"' + message + '", "error":{{ERROR}}}';
  var stringifiedError = $happn._mesh.utilities.stringifyError(e);
  return responseString.replace("{{ERROR}}", stringifiedError);
};

Rest.prototype.handleRequest = function ($happn, req, res) {

  console.log('handling request:::', req);

  var _this = this;

  var header = {
      'Content-Type': 'application/json'
    };

  var data = {};

  jsonBody(req, res, function(e, body){

    if (e) {
      res.writeHead(500, header);
      return res.send(_this.__errorResponse($happn, "Failure parsing request body", e));
    }

    if (!body.uri)
      res.send(_this.__errorResponse($happn, "Failure parsing request body", new Error('no uri configured')));

    if (body.parameters)
      body.parameters = [];

    var callPath = body.uri.split('/');

    

  });


  res.end(script.data);

  // var script = $happn.tools.packages.api;
  //
  // if (req.headers['if-none-match'] == script.md5) {
  //
  //   $happn.log.$$TRACE('client already has latest version ' + req.url);
  //   res.statusCode = 304; // <---- 304 Not Modified (RFC 7232)
  //   return res.end();    // <---- send nothing.
  // }
  //
  // var header = {
  //   'Content-Type': 'text/javascript',
  //   'Cache-Control': "max-age=0", // <---- client should always check
  //   'ETag': script.md5           // <---- etag (see 'if-none-match')
  // }
  //
  // if (script.gzip) {
  //   header['Content-Encoding'] = 'gzip'; // <---- script.data is gzipped (flag set in system/widget)
  // }
  //
  // res.writeHead(200, header);
  // $happn.log.$$TRACE('sending latest version ' + req.url);
  // res.end(script.data);

};

Rest.prototype.__wrapExchange = Promise.promisify(function($happn, callback){
  this.__exchangeDescription = JSON.stringify($happn._mesh.description);

  callback();
});

Rest.prototype.initialize = function ($happn, callback) {

    var _this = this;

    _this.__wrapExchange($happn)
    .then(callback)
    .catch(callback);

};
