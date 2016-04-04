// cannot do mocha test/4-mesh-to-mesh.js --watch
// address already in use for 2nd... runs

var spawn = require('child_process').spawn
  , sep = require('path').sep
  , remote
  , assert = require('assert')
  , mesh
  , Mesh = require('../')

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;
var Crypto = require('happn-util-crypto');
var crypto = new Crypto();


var config = {
  name: 'mesh2',
  datalayer: {
    port: 55002,
    secure:true,
    encryptPayloads:true
  },
  endpoints: {
    theFarawayTree: {  // remote mesh node
      config: {
        port: 55001,
        host: 'localhost',
        username: '_ADMIN',
        password: 'guessme'
      }
    }
  },
  modules: {},
  components: {}
};

describe('c8-payload-encryption', function() {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(20000);

  before(function(done) {

    var _this = this;

    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + 'c8-payload-encryption']);

    remote.stdout.on('data', function(data) {

      if (data.toString().match(/READY/)){

        mesh = new Mesh();
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

  context('the faraway tree, in the mist...', function() {

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

  });

  require('benchmarket').stop();
});