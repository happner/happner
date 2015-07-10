// cannot do mocha test/4-mesh-to-mesh.js --watch
// address already in use for 2nd... runs

var Mesh = require('../lib/system/mesh')
  , spawn = require('child_process').spawn
  , sep = require('path').sep
  , remote
  , assert = require('assert')
  ;

mesh = Mesh();

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;

config = {
  name: 'mesh2',
  dataLayer: {
    port: 3002,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  endpoints: {
    theFarawayTree: {  // remote mesh node
      config: {
        port: 3001,
        secret: 'mesh',
        host: 'localhost' // TODO This was necessary, did not default
      }
    }
  },
  modules: {},
  components: {}
};

describe('Mesh to Mesh', function() {
  
  before(function(done) {

    // spawn remote mesh in another process
    console.log(libFolder);

    remote = spawn('node',[libFolder + '4-first-mesh']);
    remote.stdout.on('data', function(data) {

      console.log('Remote:',data.toString());
      if (!data.toString().match(/READY/)) return;

      // once it says READY start local mesh

      mesh.initialize(config, function(err) {
        if (err) return done(err);
        done();
      });
    });
  });


  after(function(done) {
    remote.kill();
    done();
  })

  context('the faraway tree', function() {

    it("we can ride moonface's slippery slip",function(done) {

      mesh.api.exchange
      .theFarawayTree.moonface.rideTheSlipperySlip(
        'one!', 'two!', 'three!', function(err, res) {

          assert(res == 'one! two! three!, wheeeeeeeeeeeeheeee!');
          done()

      });
    });

    it('we know when there was an accident', function(done) {

      mesh.api.exchange
      .theFarawayTree.moonface.haveAnAccident(function(err, res) {

        // haveAnAccident() throws on the other side

        assert(err.toString().match(/SlipFailure: Stray patch of glue./))
        done();

      });

    });

  });

});
