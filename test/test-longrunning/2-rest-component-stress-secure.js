/* RUN: LOG_LEVEL=off mocha test/18-exchange-promises.js */

var Promise = require('bluebird');
var sep = require('path').sep;
var spawn = require('child_process').spawn;
module.exports = SeeAbove;

function SeeAbove() {}

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


if (global.TESTING_REST_COMP_STRESS_SECURE) return; // When 'requiring' the module above,

/**
 * Simon Bishop
 * @type {expect}
 */

// Uses unit test 2 modules
var expect = require('expect.js');
var Mesh = require('..' + sep + '..');
var path = require('path');
var libFolder = path.resolve('.' + sep + 'test' + sep + 'lib') + sep;
var async = require('async');

//var REMOTE_MESH = 'e2-remote-mesh';
var REMOTE_MESH = 'e3-remote-mesh-secure';

describe('2-rest-component-stress-secure', function () {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(120000);

  var mesh;
  var remote;

  var startRemoteMesh = function(callback){

    var timedOut = setTimeout(function(){
      callback(new Error('remote mesh start timed out'));
    },5000);

    console.log('starting remote:::', libFolder + REMOTE_MESH);

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

    global.TESTING_REST_COMP_STRESS_SECURE = true; //.............

    startRemoteMesh(function(e){

      if (e) return done(e);

      Mesh.create({
        name:'e3b-test',
        datalayer:{
          secure:true,
          adminPassword: 'happn',
          port: 10000
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
            config: {
              secure:true,
              port: 10001,
              host: 'localhost',
              username:'_ADMIN',
              password:'happn'
            }
          }
        }
      }, function (err, instance) {

        delete global.TESTING_REST_COMP_STRESS_SECURE; //.............
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

  var CONNECTIONS_COUNT = 1000;

  var generateRequests = function(testKey, count){
    var requests = [];

    for (var i = 0;i < count; i++){
      var operation = {
        uri:'testComponent/method1',
        parameters:{
          'opts':{'number':i},
          'key':testKey
        }
      };

      requests.push(operation);
    }

    return requests;
  };

  var verifyResponses = function(responses, done){

    var errors = [];

    responses.map(function(response){

      try{
        expect(response.request.parameters.opts.number).to.be(response.response.data.number - 1);
      }catch(e){
        errors.push(response);
      }

    });

    if (errors.length == 0) return done();
    else {
      return done(new Error('failures found in responses:::'));
    }

  };

  var generateLoginRequests = function(testKey, count){
    var requests = [];

    for (var i = 0;i < count; i++){
      var operation = {
        username:'_ADMIN',
        password:'happn'
      };

      requests.push(operation);
    }

    return requests;
  };

  var verifyLoginResponses = function(responses, done){

    var errors = [];

    responses.map(function(response){

      try{
        expect(response.response.data.token).to.not.be(null);
      }catch(e){
        errors.push(response);
      }

    });

    if (errors.length == 0) return done();
    else {
      return done(new Error('failures found in responses:::'));
    }

  };

  var login = function(done, credentials){

    var restClient = require('restler');

    var operation = {
      username:'_ADMIN',
      password:'happn'
    };

    if (credentials) operation = credentials;

    restClient.postJson('http://localhost:10000/rest/login', operation).on('complete', function(result){
      if (result.error) return done(new Error(result.error.message));
      done(null, result);
    });

  };

  it('tests N logins to the REST component, in series', function(done){

    if (CONNECTIONS_COUNT > 1000) this.timeout(500000);

    var requests = generateLoginRequests('SERIES', CONNECTIONS_COUNT);
    var responses = [];
    var restClient = require('restler');

    console.log('about to login test:::', requests.length);
    var loginCounter = 0;

    async.eachSeries(requests, function(request, requestCB){

      restClient.postJson('http://localhost:10000/rest/login', request).on('complete', function(result){

        loginCounter++;

        if (loginCounter % 100 == 0) console.log(loginCounter.toString() + ' logins');

        responses.push({request:request, response:result});

        requestCB();
      });

    }, function(e){

      if (e) return done(e);

      return verifyLoginResponses(responses, done);

    });

  });

  it('tests N logins to the REST component, in paralel', function(done){

    if (CONNECTIONS_COUNT > 1000) this.timeout(500000);

    var requests = generateLoginRequests('SERIES', CONNECTIONS_COUNT);
    var responses = [];
    var restClient = require('restler');

    console.log('about to login test:::', requests.length);
    var loginCounter = 0;

    async.each(requests, function(request, requestCB){

      restClient.postJson('http://localhost:10000/rest/login', request).on('complete', function(result){

        loginCounter++;

        if (loginCounter % 100 == 0) console.log(loginCounter.toString() + ' logins');

        responses.push({request:request, response:result});

        requestCB();
      });

    }, function(e){

      if (e) return done(e);

      return verifyLoginResponses(responses, done);

    });

  });

  it('tests N posts to the REST component in series', function(done){

    var requests = generateRequests('SERIES', CONNECTIONS_COUNT);
    var responses = [];
    var restClient = require('restler');

    login(function(e, response){

      if (e) return done(e);
      var token = response.data.token;

      async.eachSeries(requests, function(request, requestCB){

        restClient.postJson('http://localhost:10000/rest/method/' + request.uri + '?happn_token=' + token, request).on('complete', function(result){

          responses.push({request:request, response:result});

          requestCB();
        });

      }, function(e){

        if (e) return done(e);

        return verifyResponses(responses, done);

      });

    });

  });

  it('tests N posts to the REST component in parallel', function(done){

    var requests = generateRequests('SERIES', CONNECTIONS_COUNT);
    var responses = [];
    var restClient = require('restler');

    login(function(e, response){

      if (e) return done(e);
      var token = response.data.token;

      async.each(requests, function(request, requestCB){

        restClient.postJson('http://localhost:10000/rest/method/' + request.uri + '?happn_token=' + token, request).on('complete', function(result){

          responses.push({request:request, response:result});

          requestCB();
        });

      }, function(e){

        if (e) return done(e);

        return verifyResponses(responses, done);

      });
    });
  });

  require('benchmarket').stop();

});
