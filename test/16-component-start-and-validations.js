module.exports = Explicit;

function Explicit() {}

Explicit.prototype.asyncStart = function(opts, optionalOpts, callback) {
  setTimeout(function() {
    Explicit.startCalled = arguments;
    callback(null);
  }, 200);
}

Explicit.prototype.asyncStartFails = function(callback) {
  callback(new Error('erm'));
}

Explicit.prototype.methodName1 = function(opts, optionalOpts, callback) {
  console.log('args', arguments);
  callback(null, {yip: 'eee'});
}




if (global.TESTING_16) return; // When 'requiring' the module above,
                              // don't run the tests below
                             //............. 



var should = require('chai').should();

describe('component start and validation -', function() {

  require('./lib/0-hooks')();
  before(function(done) {

    global.TESTING_16 = true; //.............

    var mesh = this.mesh = this.Mesh();
    mesh.initialize({
      util: {
        // logLevel: ['error']
      },
      dataLayer: {
        port: 8001,
        log_level: 'error'
      },
      modules: {
        'expliCit': {
          path: __filename
        }
      },
      components: {
        'explicit': {
          moduleName: 'expliCit',
          startMethod: 'asyncStart',
          schema: {
            exclusive: true,
            methods: {
              
              'asyncStart': {
                type: 'async',
                parameters: [
                  {name: 'opts', required: true, value: {op:'tions'}},
                  {name: 'optionalOpts', required: false},
                  {type: 'callback', required: true}
                ],
                callback: {
                  parameters: [
                    {type: 'error'}
                  ]
                }
              },

              'methodName1': {
                alias: 'm1',
                parameters: [
                  {name: 'opts', required: true, value: {op:'tions'}},
                  {name: 'optionalOpts', required: false},
                  {type: 'callback', required: true}
                ]
              }

            }
          }
        }
      }

    }, function(err) {
      if (err) return done(err);

        mesh.start(function(err) {
          if (err) {
            console.log(err.stack);
            //process.exit(err.errno || 1);
            return done(err);
          }
          return done();
        });
    });
  });

  after(function() {
    delete global.TESTING_16; //.............
  })

  it('has called and finished the component async start method', function(done) {

    //
    // This test is failing because mesh.start callback occurrs before 
    // the component start method has finished
    //

    // console.log(require(__filename).startCalled);
    require(__filename).startCalled[0].should.eql({ op: 'tions' });
    done();

  });


  it('has called back with error into the mesh start callback because the component start failed', function(done) {

    var anotherMesh = this.Mesh();
    anotherMesh.initialize({
      util: {
        logger: {}
      },
      dataLayer: {
        port: 8002,
        log_level: 'error'
      },
      modules: {
        'expliCit': {
          path: __filename
        }
      },
      components: {
        'explicit': {
          moduleName: 'expliCit',
          startMethod: 'asyncStartFails',
          schema: {
            methods: {
              'asyncStartFails': {
                type: 'async',
                parameters: [
                  {type: 'callback', required: true}
                ],
                callback: {
                  parameters: [
                    {type: 'error'}
                  ]
                }
              }
            }
          }
        }
      }

    }, function(err) {
      if (err) return done(err);

      anotherMesh.start(function(err) {
        // console.log(err);
        should.exist(err);
        done();
      });

    });
  });

  context('method validation', function() {
    it.only('', function(done) {
      this.mesh.api.exchange.explicit.methodName1(function() {
        console.log('XXX', arguments);
      });
      done();
    });
  });

});