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
 * Created by Johan on 10/14/2015.
 */

// Uses unit test 2 modules
var expect = require('expect.js');
var Mesh = require('../');
var libFolder = __dirname + sep + 'lib' + sep;

//var REMOTE_MESH = 'e2-remote-mesh';
var REMOTE_MESH = 'e3-remote-mesh';

describe('e3-rest-component', function () {

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
          'remoteMeshE3': {  // remote mesh node
            reconnect:{
              max:2000, //we can then wait 10 seconds and should be able to reconnect before the next 10 seconds,
              retries:100
            },
            config: {
              port: 10001,
              host: '127.0.0.1',
              username: '_ADMIN',
              password: 'guessme',
            }
          }
        }
      }, function (err, instance) {

        delete global.TESTING_E9; //.............
        mesh = instance;
        if (err) return done(err);
        done();

      });

    });
  });

  after(function (done) {

    this.timeout(30000);

    if (remote) remote.kill();
    if (mesh) mesh.stop({reconnect: false}, done);

  });

  var happnUtils = require('../lib/system/utilities');

  var mock$Happn = {
    _mesh:{
      utilities:happnUtils
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

    var RestModule = require('../lib/modules/rest/index.js');
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

    var MockRequest = require('./lib/helper_mock_req');
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

    restModule.__parseBody(request, mockResponse, mock$Happn, mock$Origin, function(body){

      expect(body).to.not.be(null);
      expect(body).to.not.be(undefined);
      expect(body.uri).to.be('/testComponent/methodName1');
      expect(body.parameters['opts'].number).to.be(1);

      done();

    });

  });

  xit('tests the rest components describe method', function(done){

  });

  it('tests the rest components describe method over the api', function(done){

    var restClient = require('restler');

    restClient.get('http://localhost:10000/rest/describe').on('complete', function(result){

      console.log('desc result:::', result);

      expect(result.data.components.testComponent.method1).to.not.be(null);
      expect(result.data.components.testComponent.method2).to.not.be(null);

      done();
    });

  });

  xit('tests the rest components handleRequest method', function(done){

  });

  xit('can call a method on the mesh, via the rest API', function (done) {

    var requestData = {
      uri:'testComponent/method1',
      parameters:[
        {number:1}
      ]
    };

    rest.post('http://localhost:10000/rest/api', requestData).on('complete', function(data, response) {

      expect(response.statusCode).to.be(200);
      var returnedOptions = JSON.parse(data);

      expect(returnedOptions.number).to.be(2);
      done();

    });

  });

  require('benchmarket').stop();

});
