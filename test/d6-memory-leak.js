// cannot do mocha test/4-mesh-to-mesh.js --watch
// address already in use for 2nd... runs

var spawn = require('child_process').spawn
  , sep = require('path').sep
  , remote
  , shoould = require('chai').should()
  , mesh
  , Mesh = require('../')
  , async = require('async');

if (!global.gc) {
  console.log("Memory leak test not relevant");
  global.gc = function () {
  };
}

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;

config = {
  name: 'mesh2',
  datalayer: {
    port: 3002
  },
  endpoints: {},
  modules: {
    "moonface": {
      path: __dirname + "/lib/4-moonface",
      constructor: {
        type: "sync",
        parameters: []
      }
    }
  },
  components: {
    "moonface": {
      moduleName: "moonface",
      schema: {
        "exclusive": false,
        "methods": {
          "rideTheSlipperySlip": {
            parameters: [
              {name: 'one', required: true},
              {name: 'two', required: true},
              {name: 'three', required: true},
              {name: 'callback', type: 'callback', required: true}
            ]
          }
          ,
          "haveAnAccident": {
            parameters: [
              {name: 'callback', type: 'callback', required: true}
            ]
          }
        }
      }
    }
  }
};

describe('d6 memory leak', function () {

  this.timeout(20000);

  before(function (done) {

    var _this = this;

    mesh = new Mesh();

    // console.log('starting this one', mesh, config);
    // mesh.initialize(config, function(err) {
    mesh.initialize(config, function (e) {
      done(e);
    });
  });


  after(function (done) {
    mesh.stop(done);
  });


  it("should not leak on local calls", function (done) {
    global.gc();
    var memoryUsage = [];

    var total = 10;
    var callsDone = 0;

    for (var n = 0; n < total; n++) {
      global.gc();
      memoryUsage[n] = process.memoryUsage().heapUsed;
      var object = {};
      for (var i = 0; i < 10000; i++) {
        object[i] = Math.random();
      }
      testLocal(object, function (err, result) {
        result.should.eql("All good");
        callsDone++;
        if (callsDone == total) setImmediate(complete);
      });
    }

    function complete() {
      console.log(memoryUsage);
      (memoryUsage[memoryUsage.length - 1] - memoryUsage[memoryUsage.length - 2]).should.be.lt(10000);
      done();
    }
  });

  it("should not leak on exchange calls", function (done) {
    this.timeout(100000);
    global.gc();
    var memoryUsage = [];

    var total = 10;
    var callsDone = 0;

    // do a 1000 calls to fill up the cache
    for (var n = 0; n < 1000; n++) {
      var object = {};
      mesh.exchange.moonface.slowlySlides(object, function (err, result) {
      });
    }

    for (var n = 0; n < total; n++) {
      global.gc();
      memoryUsage[n] = process.memoryUsage().heapUsed;
      var object = {};
      for (var i = 0; i < 10000; i++) {
        object[i] = Math.random();
      }
      mesh.exchange.moonface.slowlySlides(object, function (err, result) {
        var object2 = {};
        for (var i = 0; i < 10000; i++) {
          object2[i] = Math.random();
        }
        result.should.eql("All good");
        callsDone++;
        if (callsDone == total) setImmediate(complete);
      });
    }

    function complete() {
      console.log(memoryUsage);
      (memoryUsage[memoryUsage.length - 1] - memoryUsage[memoryUsage.length - 2]).should.be.lt(10000);
      done();
    }

  });

  function testLocal(object, callback) {
    callback(null, 'All good');
  }
});
