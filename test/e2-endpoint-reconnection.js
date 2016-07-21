describe('e2-endpoint-reconnection', function () {

  var spawn = require('child_process').spawn
    , sep = require('path').sep
    , remote
    , expect = require('expect.js')
    , mesh
    , Mesh = require('../')

  var libFolder = __dirname + sep + 'lib' + sep;

//var REMOTE_MESH = 'e2-remote-mesh';
  var REMOTE_MESH = 'e2-remote-mesh';

  var PORT_REMOTE = 3030;
  var PORT_LOCAL = 4040;

  var config = {
    name: 'e2-endpoint-reconnection',
    datalayer: {
      port: PORT_LOCAL,
      secure:true
    },
    endpoints: {
      'remoteMeshE2': {  // remote mesh node
        config: {
          port: PORT_REMOTE,
          host: 'localhost',
          username: '_ADMIN',
          password: 'guessme'
        }
      }
    }
  };

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var startRemoteMesh = function(callback){

    var timedOut = setTimeout(function(){
      callback(new Error('remote mesh start timed out'));
    },2000);

    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + REMOTE_MESH]);

    remote.stdout.on('data', function (data) {

      //console.log('output:::', data.toString());

      if (data.toString().match(/READY/)) {

        clearTimeout(timedOut);

        setTimeout(function(){
          callback();
        },1000);
      }
    });
  };

  before(function (done) {

    startRemoteMesh(function(e){

      if (e) return done(e);

      Mesh.create(config, function (e, instance) {
        if (e) return done(e);

        mesh = instance;
        done();
      });
    });
  });


  after(function (done) {
    remote.kill();
    mesh.stop({reconnect: false}, done);
  });

  var testExchangeCalls = function(done){

    mesh.exchange.remoteMeshE2.remoteComponent.remoteFunction(
      'one!', 'two!', 'three!', function (err, res) {

        if (err) return done(err);
        done()

      });
  };

  var __endpointConnectionTestDisconnected1 = false;
  var __endpointConnectionTestDisconnected2 = false;

  it("tests endpoint connection events", function (done) {

    testExchangeCalls(function(e) {                           // 1. check the remote exchange works

      if (e) return done(e);
      console.log('1.1 EXCHANGE CALLS WORKED:::');

      mesh.on('endpoint-reconnect-scheduled', function(evt) { // 2. attach to the endpoint disconnection

        if (__endpointConnectionTestDisconnected1) return;
        __endpointConnectionTestDisconnected1 = true;

        console.log('1.2 KILLED REMOTE:::');

        expect(evt.endpointName).to.be('remoteMeshE2');
        expect(evt.endpointConfig.config.port).to.be(PORT_REMOTE);

        mesh.on('endpoint-reconnect-successful', function(evt){

          if (__endpointConnectionTestDisconnected2) return;
          __endpointConnectionTestDisconnected2 = true;

          console.log('1.4 RESTARTED REMOTE:::');

          expect(evt.endpointName).to.be('remoteMeshE2');
          expect(evt.endpointConfig.config.port).to.be(PORT_REMOTE);

          done();

        });

        startRemoteMesh(function(e) {       // 3. start the remote mesh

          if (e) return done(e);
          console.log('1.3 STARTED REMOTE MESH:::');

        });
      });

      remote.kill();

    });
  });

  var __remoteRestartTestDisconnected1 = false;
  var __remoteRestartTestDisconnected2 = false;

  it("can call remote component, restart remote mesh and call component again", function (done) {

    testExchangeCalls(function(e){                           // 1. check the remote exchange works

      if (e) return done(e);
      console.log('2.1 EXCHANGE CALLS WORKED:::');

      mesh.on('endpoint-reconnect-scheduled', function(evt){ // 2. attach to the endpoint disconnection

        if (__remoteRestartTestDisconnected1) return;
        __remoteRestartTestDisconnected1 = true;

        console.log('2.2 KILLED REMOTE:::');
        console.log('2.3 TESTING EXCHANGE CALLS FAIL:::');

        expect(evt.endpointName).to.be('remoteMeshE2');
        expect(evt.endpointConfig.config.port).to.be(PORT_REMOTE);

        testExchangeCalls(function(e){                       // 4. check the exchange calls fail

          expect(e).to.not.be(null);
          expect(e).to.not.be(undefined);

          console.log('2.4 EXCHANGE CALLS TESTED AND FAILED, OK:::');

          mesh.on('endpoint-reconnect-successful', function(evt){

            if (__remoteRestartTestDisconnected2) return;
            __remoteRestartTestDisconnected2 = true;

            expect(evt.endpointName).to.be('remoteMeshE2');
            expect(evt.endpointConfig.config.port).to.be(PORT_REMOTE);

            console.log('2.6 REMOTE ENDPOINT RECONNECTED:::');
            testExchangeCalls(function(e){
              console.log('2.7 EXCHANGE CALLS TESTED AFTER RESTART:::');

              done(e);
            });

          });

          startRemoteMesh(function(e) {       // 5. start the remote mesh

            if (e) return done(e);
            console.log('5. STARTED REMOTE MESH:::', e);

          });
        });
      });

      remote.kill();                          // 3. bring down the remote mesh unexpectedly
    });
  });

  require('benchmarket').stop();

});
