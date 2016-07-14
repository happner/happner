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

config = {
  name: 'childMesh',
  dataLayer: {
    secure: true,
    port: 3002,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
  },
  endpoints: {
    parentMesh: {  // remote mesh node
      config: {
        port: 3001,
        username: '_ADMIN',
        password: 'testb4' // TODO This was necessary, did not default
      }
    }
  },
  modules: {},
  components: {}
};

describe('creates a user on the parent mesh, logs into the child mesh using the same user', function () {

  this.timeout(20000);

  before(function (done) {

    var _this = this;

    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + 'b4-parent-mesh']);

    remote.stdout.on('data', function (data) {

      if (data.toString().match(/READY/)) {


        mesh = new Mesh();

        // console.log('starting this one', mesh, config);
        // mesh.initialize(config, function(err) {
        mesh.initialize(config, function (e) {
          done(e);
        });
      }

    });
  });


  after(function (done) {
    remote.kill();
    mesh.stop(done);
  });

  context('testing user and group propagation, on a 2 level network', function () {


    it("logs in to the parent mesh using the admin user", function (done) {

    });

    it('adds a group with execute permissions on some paths to the child mesh, we must ensure the group is propagated to the parent mesh', function (done) {


    });

    it('can add a user to the parent mesh, and associate the group in the previous step to the user, we must ensure the user has been propagated to the child mesh', function (done) {


    });

    it('can login to the child mesh with the propagated ', function (done) {


    });

  });

});
