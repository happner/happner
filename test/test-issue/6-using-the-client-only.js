describe('Using the clientside only', function () {

  this.timeout(20000);

  var spawn = require('child_process').spawn;
  var sep = require('path').sep;
  var remote;
  var assert = require('assert');
  var path = require('path');
  var sep = path.sep;
  var libFolder = path.resolve(__dirname, '../' + sep + 'lib');

  console.log(libFolder);

  // Spawn mesh in another process.
  before(function (done) {
    remote = spawn('node', [libFolder + sep + '4-first-mesh']);
    remote.stdout.on('data', function (data) {
      if (!data.toString().match(/READY/)) return;
      done();
    });
  });

  after(function (done) {
    remote.kill();
    done();
  })

  context('with clientside bits', function () {

    it('can ride the slippery slip', function (done) {

      var happn = require('happn');

      var MeshClient = require('../../lib/system/api');

      new MeshClient('localhost', 3001, 'mesh', function (err, client) {

        if (err) return done(err);

        client.exchange

          .theFarawayTree.moonface.rideTheSlipperySlip(
          'one!', 'two!', 'three!', function (err, res) {

            if (err) return done(err);
            assert(res == 'one! two! three!, wheeeeeeeeeeeeheeee!');
            done();

          }
        );
      });

    });
  })
});
