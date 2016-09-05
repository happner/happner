var path = require('path');

describe(path.basename(__filename), function (done) {

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var libFolder = path.join(__dirname, 'lib');
  var Mesh = require('../');
  var async = require('async');
  require('chai').should();
  var test_id = Date.now() + '_' + require('shortid').generate();
  var dbFileName = './temp/' + test_id + '.nedb';
  var mesh;

  var exchangeIterations = (process.arch == 'arm') ? 100 : 1000;
  var allowedOverhead = 100; // this is just value. Based on the best we can get this to, this can change. At least then we have a baseline.
  var callbackTimeout = (process.arch == 'arm') ? 0 : 0;

  var config = {
    name: "testComponent2Component",
    datalayer: {
      secure: true,
      persist: true,
      defaultRoute: "mem",
      filename: dbFileName
    },
    modules: {
      "e7Module": {
        path: path.join(libFolder, "e7-module"),
        constructor: {
          type: "sync",
          parameters: []
        }
      }
    },
    components: {
      "e7Component": {
        moduleName: "e7Module",
        startMethod: 'start',
        // scope:"component",//either component(mesh aware) or module - default is module
        schema: {
          "exclusive": false,//means we dont dynamically share anything else
          "methods": {
            start: {
              type: 'sync',
              parameters: [
                {type: 'object', name: 'options', value: {callbackTimeout: callbackTimeout}}
              ]
            }
          }
        }
      }
    }
  };

  before(function () {
    return Mesh.create(config)
      .then(function (createdMesh) {
        mesh = createdMesh;
      });
  });

  after(function () {
    return mesh.stop({reconnect: false});
  });

  it('does not add more than ' + allowedOverhead + '% overhead on local exchange functions', function (done) {
    var startTime = process.hrtime();
    var diffTimeExchange;
    var diffTimeDirect;
    var overheadTimeExchange;
    var overheadTimeDirect;
    var object = {
      someProperty: 'This is the value',
      someNumberProperty: 0
    };
    async.timesSeries(exchangeIterations,
      function (iteration, cb) {
        mesh.exchange.e7Component.exchangeFunction(object, cb);
      },
      function () {
        var diffTimeExchangeArray = process.hrtime(startTime);
        diffTimeExchange = diffTimeExchangeArray[0] + diffTimeExchangeArray[1] / 1000000000;
        overheadTimeExchange = diffTimeExchange - (callbackTimeout / 1000 * exchangeIterations);
        mesh.log.info(exchangeIterations + " exchange calls took %d seconds, added %d seconds overhead per call", diffTimeExchange, overheadTimeExchange / exchangeIterations);
        runDirectly();
      });

    function runDirectly() {
      var e7module = require(path.join(libFolder, 'e7-module'))();
      e7module.start({callbackTimeout: callbackTimeout});
      startTime = process.hrtime();
      async.timesSeries(exchangeIterations,
        function (iterations, callback) {
          var forceAsync = true;

          e7module.exchangeFunction(object, function () {
            if (forceAsync) {
              return setImmediate(callback);
            }
            callback();
          });
          forceAsync = false;
        },
        function () {
          var diffTimeDirectArray = process.hrtime(startTime);
          diffTimeDirect = diffTimeDirectArray[0] + diffTimeDirectArray[1] / 1000000000;
          overheadTimeDirect = diffTimeDirect - (callbackTimeout / 1000 * exchangeIterations);
          mesh.log.info(exchangeIterations + " direct calls took %d seconds, added %d seconds overhead per call", diffTimeDirect, overheadTimeDirect / exchangeIterations);
          var difference = ((overheadTimeExchange - overheadTimeDirect) / overheadTimeDirect) * 100;
          mesh.log.info("Exchange is %d\% slower than direct", difference);
          try {
            (difference).should.be.lt(allowedOverhead + 100);
            done();
          } catch (e) {
            done(e);
          }
        });
    }

  });

  require('benchmarket').stop();
});









