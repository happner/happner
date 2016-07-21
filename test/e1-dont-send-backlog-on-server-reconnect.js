/**
 * Created by nomilous on 2016/07/21.
 */

var path = require('path');
var filename = path.basename(__filename);
var should = new require('chai').should();
var Happner = require('../');

describe(filename, function() {

  // Given a connected endpoint, and then it goes down (perhaps the server was restarted):
  //
  // - NOT HAPPENING...  Currently happner accumulates a backlog of exchange requests and
  //                     unloads them all onto the server when the endpoint reconnects.
  // - This happens despite the requests timing out.
  //
  // Exactly what should happen when the server is offline needs to be carefully considered...
  //
  // Points to ponder...
  //
  // - Happn can know it's disconnected, (its busy trying to reconnect), so immediate error
  //   could be reported to exchange caller rather than waisting time awaiting timeout.
  //   (cases: happnerclient, happnermesh)
  //
  // - NOT HAPPENING Sending the backlog is dangerous, (thundering herd...), large volume of accumulated
  //                 field data can drown/crash the server.
  //

  var startServer;
  var server, client;
  var calledData = [];

  beforeEach(function(done) {
    startServer = function() {
      return Happner.create({
        name: 'SERVER',
        datalayer: {
          port: 8000,
          setOptions: {
            timeout: 200,
          }
        },
        modules: {
          'component': {
            instance: {
              method: function($happn, data, callback) {
                calledData.push(data);
                return callback(null);
              }
            }
          }
        },
        components: {
          'component': {}
        }
      })
    };

    startServer().then(function(mesh) {
      server = mesh;
      done();
    }).catch(done);
  });

  afterEach(function(done) {
    if (!server) return done();
    server.stop(done);
  });

  beforeEach(function(done) {
    Happner.create({
      name: 'CLIENT',
      datalayer: {
        port: 8001,
        setOptions: {
          // timeout: 200, // <---------------- clientside timeout having no effect
        }
      },
      endpoints: {
        'SERVER': {
          config: {
            port: 8000
          }
        }
      }
    }).then(function(mesh) {
      client = mesh;
      done();
    }).catch(done);
  });

  afterEach(function(done) {
    if (!client) return done();
    client.stop(done);
  });

  it('should not send uncontrolled backlog data (especially after timeout?)', function(done) {
    this.timeout(3000);
    var count = 1;

    // make call (1) across exchange
    client.exchange.SERVER.component.method({data: count++})

      .then(function() {

        // now stop the server...
        return server.stop();

      })

      .then(function() {

        // make call (2) from client across __disconnected__ endpoint
        return client.exchange.SERVER.component.method({data: count++}, function(err) {

          err.should.equal('Request timed out'); // this may change to 'Endpoint offline' ?? <----------------------
                                                // no need to have waited timeout,
                                               // offline is known inside happn,
                                              // (which is currently in a reconnect loop)
          // now restart the server...
          return startServer().then(function(mesh) {
            server = mesh;

            // wait for client's endpoint to reconnect
            setTimeout(function() {

              // make call (3) across __reconnected__ endpoint
              return client.exchange.SERVER.component.method({data: count++})

                .then(function() {

                  try {

                    calledData.should.eql([
                      {data: 1},
                      // {data: 2}, // <-------------- should not have arrived at server
                      {data: 3}
                    ]);
                    done();

                  } catch (e) {
                    done(e);
                  }

                })

                .catch(done);

            }, 1000);

          }).catch(done);

        });

      })

      .catch(done);
  });

});
