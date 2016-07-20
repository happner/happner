var spawn = require('child_process').spawn
  , sep = require('path').sep
  , remote
  , expect = require('expect.js')
  , mesh
  , Mesh = require('../')

var libFolder = __dirname + sep + 'lib' + sep;

//var REMOTE_MESH = 'e2-remote-mesh';
var REMOTE_MESH = '4-first-mesh';

config = {
  name: 'e2-endpoint-reconnection',
  datalayer: {
    port: 3002,
    secure:true
  },
  endpoints: {
    'remoteMesh': {  // remote mesh node
      config: {
        port: 3001,
        host: 'localhost',
        username: '_ADMIN',
        password: 'guessme'
      }
    }
  }
};

describe('e2-endpoint-reconnection', function () {

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
    mesh.exchange.remoteMesh.remoteComponent.remoteFunction(
      'one!', 'two!', 'three!', function (err, res) {

        if (err) return done(err);
        done()

      });
  };

  it("can call remote component, restart remote mesh and call component again", function (done) {

    testExchangeCalls(function(e){            // 1. check the remote exchange works

      if (e) return done(e);
      console.log('1. EXCHANGE CALLS WORKED:::');
      remote.kill();                          // 2. bring down the remote mesh unexpectedly
      console.log('2. KILLED REMOTE:::');
      setTimeout(function(){                  // 3. wait a second
        console.log('3. TESTING EXCHANGE CALLS:::');
        testExchangeCalls(function(e){        // 4. check the exchange calls fail

          expect(e).to.not.be(null);
          expect(e).to.not.be(undefined);

          console.log('4. EXCHANGE CALLS TESTED, ERROR:::', e);

          startRemoteMesh(function(e) {       // 5. restart the remote mesh

            if (e) return done(e);

            console.log('5. STARTED REMOTE MESH:::', e);

            setTimeout(function() {           // 6. wait a second
              console.log('6. TESTING EXCHANGE CALLS AFTER REMOTE RESTART:::');
              testExchangeCalls(function(e){
                console.log('7. EXCHANGE CALLS TESTED AFTER RESTART, ERROR:::', e);

                done(e);
              });                             // 7. check the exchange calls pass
            }, 20000);
          });
        });
      }, 1000);
    });
  });

  require('benchmarket').stop();

});
