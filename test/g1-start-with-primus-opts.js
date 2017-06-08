var filename = require('path').basename(__filename);
var expect = require('expect.js');
var Happner = require('..');

describe(filename, function () {

  var server;

  before('start server', function (done) {

    Happner.create({
        datalayer: {
          pubsub: {
            primusOpts: {
              allowSkippedHeartBeats: 20,
              pongSkipTime: 500
            }
          }
        }
      })

      .then(function (_server) {
        server = _server;
        done();
      })

      .catch(done);

  });

  after('stop server', function (done) {

    if (!server) return done();
    server.stop({
      reconnect: false
    }, done);

  });

  it('sets primus opts', function (done) {

    var primusOptions = server._mesh.datalayer.server.services
      .pubsub.primus.options;

    expect(primusOptions.allowSkippedHeartBeats).to.equal(20);
    expect(primusOptions.pongSkipTime).to.equal(500);
    done();

  });

});
