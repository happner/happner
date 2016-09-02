/* RUN: LOG_LEVEL=off mocha test/18-exchange-promises.js */

var Promise = require('bluebird');
var sep = require('path').sep;
var spawn = require('child_process').spawn;
module.exports = SeeAbove;

function SeeAbove() {
}

SeeAbove.prototype.method1 = function (opts, callback) {

  if (opts.errorAs == 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs == 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.method2 = function (opts, callback) {

  if (opts.errorAs == 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs == 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.method3 = function ($happn, $origin, opts, callback) {

  if (opts.errorAs == 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs == 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.synchronousMethod = function(opts, opts2){
  return opts + opts2;
};

SeeAbove.prototype.$happner = {
  config: {
    'testComponent': {
      schema: {
        methods: {
          'methodName1': {
            alias: 'ancientmoth'
          },
          'methodName2': {
            alias: 'ancientmoth'
          },
          'synchronousMethod': {
            type: 'sync-promise'//NB - this is how you can wrap a synchronous method with a promise
          }
        }
      }
    }
  }
};


if (global.TESTING_E9) return; // When 'requiring' the module above,

/**
 * Simon Bishop
 * @type {expect}
 */

// Uses unit test 2 modules
var expect = require('expect.js');
var Mesh = require('../../');
var libFolder = require('path').resolve('..',__dirname + sep + 'lib' + sep);

//var REMOTE_MESH = 'e2-remote-mesh';
var REMOTE_MESH = 'e3-remote-mesh';

describe('e3a-rest-component', function () {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(120000);

  var mesh;
  var remote;

  var startRemoteMesh = function(callback){

    var timedOut = setTimeout(function(){
      callback(new Error('remote mesh start timed out'));
    },5000);

    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + REMOTE_MESH]);

    remote.stdout.on('data', function (data) {

      if (data.toString().match(/READY/)) {

        clearTimeout(timedOut);

        setTimeout(function(){
          callback();
        },1000);
      }
    });
  };

  before(function (done) {

    global.TESTING_E9 = true; //.............

    startRemoteMesh(function(e){

      if (e) return done(e);

      Mesh.create({
        port: 10000,
        util: {
          // logger: {}
        },
        modules: {
          'testComponent': {
            path: __filename   // .............
          }
        },
        components: {
          'testComponent': {}
        },
        endpoints:{
          'remoteMesh': {  // remote mesh node
            reconnect:{
              max:2000, //we can then wait 10 seconds and should be able to reconnect before the next 10 seconds,
              retries:100
            },
            config: {
              port: 10001,
              host: 'localhost'
            }
          }
        }
      }, function (err, instance) {

        delete global.TESTING_E9; //.............
        mesh = instance;

        if (err) return done(err);
        mesh.exchange.remoteMesh.remoteComponent.remoteFunction('one','two','three', function(err, result){
          if (err) return done(err);
          done();
        });
      });

    });
  });

  after(function (done) {

    this.timeout(30000);

    if (remote) remote.kill();
    if (mesh) mesh.stop({reconnect: false}, done);

  });

  var happnUtils = require('../../lib/system/utilities');

  var mock$Happn = {
    _mesh:{
      utilities:happnUtils,
      config:{
        datalayer:{
          secure:false
        }
      }
    },
    exchange:{
      testComponent:{
        method1:function(opts, callback){
          opts.number++;
          callback(null, opts);
        }
      }
    }
  };

  var mock$Origin = {

  };

  var mockResponse = {
    writeHead:function(code, header){
      this.header = {code:code, header:header};
    }
  };

  it('tests the rest components __respond method', function(done){

    var RestModule = require('../../lib/modules/rest/index.js');
    var restModule = new RestModule();

    var testStage = 'success';

    mockResponse.end = function(responseString){

      try{

        if (testStage == "done") return;

        var response = JSON.parse(responseString);

        //TODO: an unexpected GET or POST with a non-json content

        if (testStage == 'success'){

          expect(response.message).to.be("test success response");
          expect(response.data.test).to.be("data");
          testStage = 'error';

          restModule.__respond(mock$Happn, 'test success response', {"test":"data"}, new Error('a test error'), mockResponse);

        }

        if (testStage == 'error'){

          expect(response.error).to.not.be(null);
          expect(response.error.message).to.be('a test error');

          testStage = "done";

          done();
        }

      }catch(e){
        done(e);
      }
    };

    restModule.__respond(mock$Happn, 'test success response', {"test":"data"}, null, mockResponse);

  });

  it('tests the rest components __parseBody method', function(done){

    var RestModule = require('../lib/modules/rest/index.js');
    var restModule = new RestModule();

    var MockRequest = require('../lib/helper_mock_req');
    var request = new MockRequest({
      method: 'POST',
      url: '/rest/api',
      headers: {
        'Accept': 'application/json'
      }
    });

    request.write({
      uri:'/testComponent/methodName1',
      parameters:{
        'opts':{
          number:1
        }
      }
    });

    request.end();

    mockResponse.end = function(responseString){
      var response = JSON.parse(responseString);

      if (!response.error) return done(new Error('bad response expected error'));

      done(new Error(response.error));
    };

    restModule.__parseBody(request, mockResponse, mock$Happn, function(body){

      expect(body).to.not.be(null);
      expect(body).to.not.be(undefined);
      expect(body.uri).to.be('/testComponent/methodName1');
      expect(body.parameters['opts'].number).to.be(1);

      done();

    });

  });

  it('tests the rest components describe method over the api', function(done){

    var restClient = require('restler');

    restClient.get('http://localhost:10000/rest/describe').on('complete', function(result){

      expect(result.data['/testComponent/method1']).to.not.be(null);
      expect(result.data['/testComponent/method2']).to.not.be(null);

      // expect(result.data['/remoteMesh/remoteComponent/remoteFunction'].parameters['one']).to.be('{{one}}');
      // expect(result.data['/remoteMesh/remoteComponent/remoteFunction'].parameters['two']).to.be('{{two}}');
      // expect(result.data['/remoteMesh/remoteComponent/remoteFunction'].parameters['three']).to.be('{{three}}');

      done();
    });

  });

  it('tests the rest components handleRequest method', function(done){

    var RestModule = require('../lib/modules/rest/index.js');
    var restModule = new RestModule();

    restModule.__exchangeDescription = {
      components:{
        testComponent:{
          methods:{
            method1:{
              parameters:[
                {name:'opts'},
                {name:'callback'}
              ]
            }
          }
        }
      }
    };

    var MockRequest = require('./lib/helper_mock_req');
    var request = new MockRequest({
      method: 'POST',
      url: '/rest/api',
      headers: {
        'Accept': 'application/json'
      }
    });

    var operation = {
      uri:'testComponent/method1',
      parameters:{
        'opts':{'number':1}
      }
    };

    request.write(operation);

    request.end();

    mockResponse.end = function(responseString){

      var response = JSON.parse(responseString);
      expect(response.data.number).to.be(2);
      done();

    };

    restModule.handleRequest(request, mockResponse, mock$Happn, mock$Origin);

  });

  it('tests posting an operation to a local method', function(done){

    var restClient = require('restler');

    var operation = {
      uri:'testComponent/method1',
      parameters:{
        'opts':{'number':1}
      }
    };
    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.data.number).to.be(2);

      done();
    });

  });

  it('tests posting an operation to a remote method fails', function(done){

    var restClient = require('restler');

    var operation = {
      uri:'/remoteMesh/remoteComponent/remoteFunction',
      parameters:{
        'one':'one',
        'two':'two',
        'three':'three'
      }
    };

    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.error).to.not.be(null);
      expect(result.error.message).to.be('attempt to access remote mesh: remoteMesh');

      done();
    });

  });

  it('tests posting an operation to a local method, no uri', function(done){

    var restClient = require('restler');

    var operation = {
      parameters:{
        'opts':{'number':1}
      }
    };
    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.error.message).to.be('no uri configured');

      done();
    });

  });

  it('tests posting an operation to the security component fails', function(done){

    //TODO login function gives us a token, token is used in body of rest request

    var restClient = require('restler');

    var operation = {
      uri:'/security/updateOwnUser',
      parameters:{
        'username':'_ADMIN',
        'password':'blah'
      }
    };

    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){
      expect(result.error.number).to.not.be(null);
      expect(result.error.message).to.be('attempt to access security component over rest');
      done();
    });

  });

  it('tests posting an operation an unsecured mesh, with a token works', function(done){

    var restClient = require('restler');

    var operation = {
      uri:'testComponent/method1',
      parameters:{
        'opts':{'number':1}
      }
    };

    restClient.postJson('http://localhost:10000/rest/api?happn_token=' + 'blahblah', operation).on('complete', function(result){
      expect(result.data.number).to.be(2);
      done();
    });

  });


  it('tests posting an operation to a remote method, no uri', function(done){

    var restClient = require('restler');

    var operation = {
      parameters:{
        'one':'one',
        'two':'two',
        'three':'three'
      }
    };

    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.error.message).to.be('no uri configured');

      done();
    });

  });

  it('tests posting an operation to a local method, bad uri component', function(done){

    var restClient = require('restler');

    var operation = {
      uri:'/nonexistant/uri',
      parameters:{
        'opts':{'number':1}
      }
    };
    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.error.message).to.be('component nonexistant does not exist on mesh');

      done();
    });

  });

  it('tests posting an operation to a remote method, bad uri component', function(done){

    var restClient = require('restler');

    var operation = {
      uri:'/nonexistant/uri',
      parameters:{
        'one':'one',
        'two':'two',
        'three':'three'
      }
    };

    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.error.message).to.be('component nonexistant does not exist on mesh');

      done();
    });

  });

  it('tests posting an operation to a local method, bad uri method', function(done){

    var restClient = require('restler');

    var operation = {
      uri:'testComponent/nonexistant',
      parameters:{
        'opts':{'number':1}
      }
    };
    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.error.message).to.be('method nonexistant does not exist on component testComponent');

      done();
    });

  });

  it('tests posting an operation to a remote method, bad uri method', function(done){

    var restClient = require('restler');

    var operation = {
      uri:'/remoteMesh/remoteComponent/nonexistant',
      parameters:{
        'one':'one',
        'two':'two',
        'three':'three'
      }
    };

    restClient.postJson('http://localhost:10000/rest/api', operation).on('complete', function(result){

      expect(result.error.message).to.be('attempt to access remote mesh: remoteMesh');

      done();
    });

  });

  require('benchmarket').stop();

});
