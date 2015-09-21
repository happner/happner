var request = require('request');
var testport = 8080;

var Mesh = require('../../lib/system/mesh');

var maximumPings = 1000;

var config = {
  name:"componentWebTestMesh",
  dataLayer: {
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning',
    port:testport,
    setOptions:{}
  }
};

var mesh = new Mesh();

mesh.initialize(config, function(err) {

  if (err)
    console.error(err);

  mesh.api.exchange.api.test('message', function(e, response){

    console.log('ran test arguments');
    console.log(arguments);

    console.log('mesh initialized and started, here are the paths for the api:');
    console.log('http://127.0.0.1:' + testport + '/' + config.name + '/api/client');
    console.log('http://127.0.0.1:' + testport + '/' + config.name + '/api/app/describe.html');
  });

});