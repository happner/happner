// cannot do mocha test/4-mesh-to-mesh.js --watch
// address already in use for 2nd... runs

var expect = require('expect.js');

var spawn = require('child_process').spawn
  , sep = require('path').sep
  , remote
  , assert = require('assert')
  , mesh
  , Mesh = require('../')

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;

config = {
  name: 'mesh2',
  secure:true,
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

describe('d6-noStore-check', function() {

  this.timeout(20000);

  before(function(done) {

    var _this = this;

    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + 'd6-first-mesh']);

    remote.stdout.on('data', function(data) {

      // console.log(data.toString());

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

    it('we know that the exchange data is not being stored, as we are using a noStore', function(done) {


      mesh._mesh.data.get("/_exchange/*", function(e, results){
        console.log(results);
        expect(results.length).to.be(0);
        done();
      });

    });

    it('we know that the exchange data is not being stored, as we are using a noStore - via a client', function(done) {


      var adminClient = new Mesh.MeshClient({secure:true, port:3001});

      var credentials = {
        username: '_ADMIN', // pending
        password: 'guessme'
      }

      adminClient.login(credentials).then(function(clientInstance){

        console.log(adminClient.exchange.theFarawayTree.moonface);

        adminClient.exchange.theFarawayTree.moonface.rideTheSlipperySlip(
            'one!', 'two!', 'three!', function(err, res) {
            assert(res == 'one! two! three!, wheeeeeeeeeeeeheeee!');
            //queryTheMesh
            console.log('doing query:::');
            adminClient.exchange.theFarawayTree.moonface.queryTheMesh(
            "/_exchange/*", function(e, results) {
              console.log('checked requests:::',e, results);
              expect(results.length).to.be(0);
              mesh._mesh.data.get("/_exchange/*", function(e, results){
                console.log(results);
                expect(results.length).to.be(0);
                done();
              });
            });
        });

      }).catch(done);

    });



  });

});