/* RUN: LOG_LEVEL=off mocha test/18-exchange-promises.js */

var Promise = require('bluebird');

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
var should = require('chai').should();
var Mesh = require('../');
var http = require('http');
var rest = require('./restler');

describe('e3-rest-component', function () {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(120000);

  var mesh;

  function doPost(path, token, body, callback){

    request.post('http://service.com/upload').form({key:'value'})

  }

  function doRequest(path, token, callback) {

    var request = require('request');

    var options = {
      url: 'http://127.0.0.1:10000' + path
    };

    if (token)
      options.url += '?happn_token=' + token;

    request(options, function (error, response, body) {
      callback(null, response, body);
    });

  };

  before(function (done) {

    global.TESTING_E9 = true; //.............

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
      }
    }, function (err, instance) {

      delete global.TESTING_E9; //.............
      mesh = instance;
      if (err) return done(err);
      done();

    });
  });

  after(function (done) {
    mesh.stop({reconnect: false}, done);
  });

  it('tests the rest components describe method', function(done){

    var restModule = require('../lib/modules/rest/index.js');


  });

  it('tests the rest components handleRequest method', function(done){

  });

  xit('can get the mesh description, to perform api calls with', function (done) {

    doRequest('/rest/describe', null, function (e, resp, body) {

      var description = JSON.parse(resp.body);
      resp.statusCode.should.eql(200);

      console.log('description:::', description);

      expect(description.components.testComponent.method1).to.not.be(null);
      expect(description.components.testComponent.method2).to.not.be(null);

      done();

    });

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
