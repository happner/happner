var path = require('path');

describe(path.basename(__filename), function () {

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var libFolder = path.join(__dirname, 'lib');
  var Happner = require('../');
  var Promise = require('bluebird');
  var async = require('async');
  require('chai').should();
  var test_id = Date.now() + '_' + require('shortid').generate();
  var dbFileName = './temp/' + test_id + '.nedb';
  var mesh;
  var fs = require('fs');
  try {
    fs.unlinkSync(dbFileName);
  } catch (e) {
  }

  var exchangeIterations = (process.arch == 'arm') ? 100 : 1000;
  var allowedOverhead = 1000; // Based on tests with node 6. setImmediate introduces variation in the test result

  var config = {
    name: "testComponent2Component",
    datalayer: {
      secure: true,
      persist: true,
      defaultRoute: "mem",
      filename: dbFileName,
      adminPassword: 'xxx'
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
          "exclusive": false,
          "methods": {
            start: {
              type: 'sync',
              parameters: [
                {type: 'object', name: 'options', value: {}}
              ]
            }
          }
        }
      }
    }
  };

  before(function (done) {
    Happner.create(config)
      .then(function (createdMesh) {
        mesh = createdMesh;
        done();
      })
      .catch(done);
  });

  after(function (done) {
    try {
      fs.unlinkSync(dbFileName);
    } catch (e) {
    }
    mesh.stop({reconnect: false}, done);
  });

  it('does not add more than ' + allowedOverhead + '% overhead on local exchange functions', function (done) {
    var diffTimeExchange;
    var diffTimeDirect;
    var object = {
      someProperty: 'This is the value',
      someNumberProperty: 0
    };
    var startTime = process.hrtime();
    async.timesSeries(exchangeIterations,
      function (iteration, cb) {
        mesh.exchange.e7Component.exchangeFunction(object, cb);
      },
      function () {
        var diffTimeExchangeArray = process.hrtime(startTime);
        diffTimeExchange = diffTimeExchangeArray[0] + diffTimeExchangeArray[1] / 1000000000;
        mesh.log.info(exchangeIterations + " exchange calls took %d seconds, added %d seconds overhead per call", diffTimeExchange, diffTimeExchange / exchangeIterations);
        runDirectly();
      });

    function runDirectly() {
      var e7module = require(path.join(libFolder, 'e7-module'))();
      e7module.start({});
      startTime = process.hrtime();
      async.timesSeries(exchangeIterations,
        function (iterations, callback) {
          setImmediate(function () {
            e7module.exchangeFunction(object, function () {
              return setImmediate(callback);
            });
          });
        },
        function () {
          var diffTimeDirectArray = process.hrtime(startTime);
          diffTimeDirect = diffTimeDirectArray[0] + diffTimeDirectArray[1] / 1000000000;
          mesh.log.info(exchangeIterations + " direct calls took %d seconds, added %d seconds overhead per call", diffTimeDirect, diffTimeDirect / exchangeIterations);
          var difference = ((diffTimeExchange - diffTimeDirect) / diffTimeDirect) * 100;
          mesh.log.info("Exchange is %d\% slower than direct", difference);
          try {
            (difference).should.be.lt(allowedOverhead);
            done();
          } catch (e) {
            done(e);
          }
        });
    }

  });

  context('as async with callback', function () {

    it('can call ok', function (done) {
      mesh.exchange.e7Component.methodOk({key: 'value'}, function (err, result) {
        try {
          result.should.eql({key: 'value'});
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can call with error', function (done) {
      mesh.exchange.e7Component.methodError(function (err, result) {
        try {
          err.toString().should.equal('Error: Some problem');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can inject $happn into position 1', function (done) {
      mesh.exchange.e7Component.methodInjectHappn1({}, function (err, result) {
        try {
          result.meshName.should.equal('testComponent2Component');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can inject $happn into position 2', function (done) {
      mesh.exchange.e7Component.methodInjectHappn2({}, function (err, result) {
        try {
          result.meshName.should.equal('testComponent2Component');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('does inject $origin as _ADMIN', function (done) {
      mesh.exchange.e7Component.methodInjectOrigin({key: 'value'}, function (err, result) {
        try {
          result.should.eql({
            key: 'value',
            meshName: 'testComponent2Component',
            originUser: '_ADMIN'
          });
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can inject $happn last', function(done) {
      mesh.exchange.e7Component.methodInjectHappnLast({key: 'value'}, function (err, result) {
        try {
          result.should.eql({
            key: 'value',
            meshName: 'testComponent2Component',
            originUser: '_ADMIN'
          });
          done();
        } catch (e) {
          done(e);
        }
      });
    });

  });

  context('as async with promise', function () {

    it('can call ok', function (done) {
      mesh.exchange.e7Component.methodOk({key: 'value'})
        .then(function (result) {
          result.should.eql({key: 'value'});
          done();
        })
        .catch(done);
    });

    it('can call with error', function (done) {
      mesh.exchange.e7Component.methodError()
        .then(function () {
          done(new Error('should not succeed'));
        })
        .catch(function (error) {
          error.toString().should.equal('Error: Some problem');
          done();
        })
        .catch(done)
    });

    it('can inject $happn into position 1', function (done) {
      mesh.exchange.e7Component.methodInjectHappn1({})
        .then(function (result) {
          result.meshName.should.equal('testComponent2Component');
          done();
        })
        .catch(done);
    });

    it('can inject $happn into position 2', function (done) {
      mesh.exchange.e7Component.methodInjectHappn2({})
        .then(function (result) {
          result.meshName.should.equal('testComponent2Component');
          done();
        })
        .catch(done);
    });

    it('does inject $origin as _ADMIN', function (done) {
      mesh.exchange.e7Component.methodInjectOrigin({key: 'value'})
        .then(function (result) {
          result.should.eql({
            key: 'value',
            meshName: 'testComponent2Component',
            originUser: '_ADMIN'
          });
          done();
        })
        .catch(done);
    });

    it('can inject $happn last', function (done) {
      mesh.exchange.e7Component.methodInjectHappnLast({key: 'value'})
        .then(function (result) {
          result.should.eql({
            key: 'value',
            meshName: 'testComponent2Component',
            originUser: '_ADMIN'
          });
          done();
        })
        .catch(done);
    });

  });

  require('benchmarket').stop();
});









