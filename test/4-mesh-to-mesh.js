// cannot do mocha test/4-mesh-to-mesh.js --watch
// address already in use for 2nd... runs

var spawn = require('child_process').spawn
  , sep = require('path').sep
  , remote
  , assert = require('assert')
  , mesh
  , Mesh = require('../')
  , should = require('chai').should();

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;

config = {
  name: 'mesh2',
  datalayer: {
    port: 3002
  },
  endpoints: {
    theFarawayTree: {  // remote mesh node
      config: {
        port: 3001,
        host: 'localhost', // TODO This was necessary, did not default
        username: '_ADMIN',
        password: 'guessme'
      }
    }
  },
  modules: {},
  components: {}
};

describe('4 - Mesh to Mesh', function() {

  this.timeout(20000);

  before(function(done) {

    var _this = this;

    // spawn remote mesh in another process
    remote = spawn('/home/johan/.nvm/v0.10.40/bin/node', [libFolder + '4-first-mesh']);

    remote.stdout.on('data', function(data) {

      //console.log(data.toString());

      if (data.toString().match(/READY/)){


        mesh = new Mesh();

        // console.log('starting this one', mesh, config);
        // mesh.initialize(config, function(err) {
        mesh.initialize(config, function(e){
          done(e);
        });
      }

    });
  });


  after(function(done) {
    remote.kill();
    mesh.stop(done);
  });

  context('the faraway tree', function() {

    it("we can ride moonface's slippery slip",function(done) {

      var eventFired = false;

      mesh.event.theFarawayTree.moonface.on('*', function(data, meta){
        if (data.value == 'whoa') eventFired = true;
      });

      mesh.exchange.theFarawayTree.moonface.rideTheSlipperySlip(
        'one!', 'two!', 'three!', function(err, res) {

          assert(res == 'one! two! three!, wheeeeeeeeeeeeheeee!');
          assert(eventFired);
          done()

      });
    });

    it('we know when there was an accident', function(done) {

      mesh.exchange.theFarawayTree.moonface.haveAnAccident(function(err, res) {

        assert(err.toString().match(/SlipFailure: Stray patch of glue./))
        done();

      });

    });

    it("should not leak on exchange calls", function (done) {
      this.timeout(100000);
      global.gc();
      var memoryUsage = [];

      var total = 200;
      var callsDone = 0;

      //do a 1000 calls to fill up the cache
      for (var n = 0; n < 1000; n++) {
        var object = {};
        mesh.exchange.theFarawayTree.moonface.slowlySlides(object, function (err, result) {
        });
      }
      global.gc();
      global.gc();
      global.gc();
      global.gc();

      console.log('SNAPSHOT');
      setTimeout(doTest, 10000);

      function doTest() {
        doExchange(callsDone);
      }

      function doExchange(n) {
        global.gc();
        memoryUsage[n] = process.memoryUsage().heapUsed;
        var object = {};
        for (var i = 0; i < 10000; i++) {
          object[i] = Math.random();
        }
        mesh.exchange.theFarawayTree.moonface.slowlySlides(object, function slowlySlidesCallback(err, result) {
          //result.should.eql("All good");
          callsDone++;
          if (callsDone == total) {
            global.gc();
            console.log('SNAPSHOT');
            return setTimeout(complete, 10000);
          }
          setImmediate(doExchange, callsDone);
        });
      }

      function complete() {
        console.log(memoryUsage);
        console.log(process.memoryUsage().heapUsed);
        (memoryUsage[memoryUsage.length - 1] - memoryUsage[memoryUsage.length - 2]).should.be.lt(10000);
        done();
      }

    });

  });

});