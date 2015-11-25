describe('attach to multiple meshes (meshs?)', function() {

  var promise = require('when').promise;
  var parallel = require('when/parallel');
  var spawn = require('child_process').spawn;
  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;
  var should = require('chai').should();
  var Mesh = require('../');

  var bunchOfRemoteNodes = [1, 2, 3];

  this.timeout(20000);

  before(function(done) {

    var kids = this.kids = [];

    var mesh = this.mesh = new Mesh();

    var config = {
      endpoints: {}
    };

    parallel(
      bunchOfRemoteNodes.map(
        function(i) {   // for each i, re-map to...
          return function() {  // ...to an array of functions, ie. parallel([fn,fn,fn])
            return promise(  // each function returns a promise
              function(resolve, reject) { // receive resolve() and reject() from promise()
                var kid;
                                                          // argv[2]
                kids.push(kid = spawn(                   // i in kid as (3000 + i) port
                  'node', [libFolder + 'a1-remote-mesh', i]
                ));

                kid.stdout.on('data', function(data) {
                  console._stdout.write('remote' +i+ ' ' + data.toString());
                  if (data.toString().match(/READY/)) resolve();
                });

                kid.on('exit', function() {
                  reject(new Error('kid ' +i+ ' exited'))
                  // this also runs in the after hook, but the rejection will
                  // be ignored because the promise will have already resolved()
                  // (cannot resolve and then reject)
                });

                // assemble endpoints in local mesh config per i
                config.endpoints['mesh' + i] = {
                  config: {
                    port: 3000 + i,
                    secret: 'mesh',
                    host: 'localhost'
                  }
                }
              }
            )
          }
        }
      )
    ).then(function() {

      console.log(config);

      // local mesh init
      mesh.initialize(config, done);

    }).catch(done);
             // call done with rejections error (if)
  });

  after(function(done) {
    this.kids.forEach(function(kid) {
      console.log('killing kid', kid);
      kid.kill();
    });
    this.mesh.stop(done);
  });

  it('can call methods on all', function(done) {

    var i = 0;
    var mesh = this.mesh;
    var expecting = this.kids.map(function(kid) {
      return [++i, kid.pid];
    });

    parallel(
      bunchOfRemoteNodes.map(
        function(i) {
          return function() {
            return promise(
              function(resolve, reject) {
                mesh.api.exchange['mesh'+i].component.getPid(function(err, pid){
                  if (err) return reject(err);
                  resolve([i, pid]);
                });
              }
            )
          }
        }
      )
    ).then(function(iPids) {

      iPids.should.eql(expecting);
      done();

    }).catch(done)
  });
});
