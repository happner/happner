// cannot do mocha test/4-mesh-to-mesh.js --watch
// address already in use for 2nd... runs



describe('secure mesh to mesh', function() {
 
  context('secure mesh to mesh', function(){

    var spawn = require('child_process').spawn
    , sep = require('path').sep
    , remote
    , assert = require('assert')
    , mesh
    , Mesh = require('../')

    var sep = require('path').sep;
    var libFolder = __dirname + sep + 'lib' + sep;

    var config = {
      name: 'mesh2',
      dataLayer: {
        secure:true,
        port: 51233,
        authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
        systemSecret: 'mesh',
        log_level: 'info|error|warning'
      },
      endpoints: {
        theFarawayTree: {  // remote mesh node
          config: {
            port: 51234,
            username: '_ADMIN',
            password: 'testb2' // TODO This was necessary, did not default
          }
        }
      },
      modules: {},
      components: {}
    };

    this.timeout(20000);

    before(function(done) {

      var _this = this;

      // spawn remote mesh in another process
      remote = spawn('node', [libFolder + 'b2-first-mesh']);

      remote.stdout.on('data', function(data) {

        // console.log(data.toString());
        if (data.toString().match(/READY/)){
        
          console.log('remote ready:::', remote.pid);

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
      mesh.stop(function(e){
        console.log('killed ok:::', remote.pid);
        done();
      });
    });

    it("we can ride moonface's slippery slip",function(done) {
      mesh.exchange.theFarawayTree.moonface.rideTheSlipperySlip(
        'one!', 'two!', 'three!', function(err, res) {

          assert(res == 'one! two! three!, wheeeeeeeeeeeeheeee!');
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

});
