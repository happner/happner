var filename = require('path').basename(__filename);
var expect = require('expect.js');
var Happner = require('..');

describe(filename, function () {

  var server1;
  var server2;
  var client;

  before('start server 1', function (done) {

    Happner.create({
        name: 'SERVER1',
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
        server1 = _server;
        done();
      })

      .catch(done);

  });

  before('start server 2', function (done) {

    Happner.create({
        name: 'SERVER2',
        endpoints: {
          'SERVER1': {
            config: {
              host: 'localhost',
              port: 55000,
              pubsub: {
                options: {
                  ping: 5000,
                  pong: 1000
                }
              }
            }
          }
        },
        datalayer: {
          port: 55001
        }
      })

      .then(function (_server) {
        server2 = _server;
        done();
      })

      .catch(done);

  });

  before('start mesh client', function (done) {

    client = new Happner.MeshClient({
      pubsub: {
        options: {
          ping: 500,
          pong: 100
        }
      }
    })

    client.login()
      .then(function () {
        done();
      })
      .catch(done);

  });

  after('stop client', function (done) {

    if (!client) return done();
    client.disconnect(done);

  })

  after('stop server 2', function (done) {

    if (!server2) return done();
    server2.stop({
      reconnect: false
    }, done);

  });

  after('stop server 1', function (done) {

    if (!server1) return done();
    server1.stop({
      rec1nnect: false
    }, done);

  });

  it('sets server primus opts', function (done) {

    var serverPrimusOptions = server1._mesh.datalayer.server.services
      .pubsub.primus.options;

    expect(serverPrimusOptions.allowSkippedHeartBeats).to.equal(20);
    expect(serverPrimusOptions.pongSkipTime).to.equal(500);
    done();

  });

  it('sets endpoint primus opts', function (done) {

    var endpointPrimusOpts = server2._mesh.endpoints.SERVER1.data.pubsub.options;

    expect(endpointPrimusOpts.ping).to.equal(5000);
    expect(endpointPrimusOpts.pong).to.equal(1000);
    done();

  });

  it('sets meshclient primus opts', function (done) {

    var clientPrimusOpts = client.data.pubsub.options;

    expect(clientPrimusOpts.ping).to.equal(500);
    expect(clientPrimusOpts.pong).to.equal(100);
    done();

  });

});
