module.exports = TestComponent;

function TestComponent() {
}

TestComponent.prototype.method1 = function ($happn, args, callback) {

  // var e = new Error('xxx');
  // console.log(e.stack);

  // console.log('1 ARGS', args);
  // console.log('1 CALLBACK', callback);

  callback = args; // callback comes in position1

  callback(null, 'result1');
}

TestComponent.prototype.method2 = function ($happn, args, callback) {
  // console.log('1 ARGS', args);
  // console.log('1 CALLBACK', callback);

  callback(null, 'result2');
}

TestComponent.prototype.doEmit = function ($happn, args, callback) {
  $happn.emit('test-emmission', args);
  callback();
}


if (global.TESTING_C5) return; // When 'requiring' the module above,
// don't run the tests below
//.............

var expect = require('expect.js');
var Happner = require('../');

describe('c9-payload-encryption-client-to-mesh', function () {

  /*
   * Note: also tests that args arrive in the called sequence.
   *
   * eg. When calling function(arg1, callback) with only the callback os the only arg
   *     then the resulting call actoss the exchange has arg1 as the callback
   *     and callback as undefined)
   *
   */

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  before(function () {
    global.TESTING_C5 = true; //.............
  });

  beforeEach(function (done) {
    var _this = this;
    Happner.create({
        datalayer: {
          secure: true,
          encryptPayloads: true,
          adminPassword: 'happn'
        },
        port: 54545,
        modules: {
          'test': {
            path: __filename
          }
        },
        components: {
          'test': {
            module: 'test'
          }
        }
      })
      .then(function (mesh) {
        _this.mesh = mesh;
      })
      .then(done).catch(done);
  });

  afterEach(function (done) {
    this.mesh.stop({reconnect: true}, done);
  });

  var encryptedRequestsCount = 0;
  var unencryptedRequestsCount = 0;


  it('server can call more than one method in sequence (callback)', function (done) {
    var mesh = this.mesh;
    mesh.exchange.test.method1(function (e, result) {

      if (e) return done(e);
      expect(result).to.equal('result1');

      var args = {};

      mesh.exchange.test.method2(args, function (e, result) {

        if (e) return done(e);
        expect(result).to.equal('result2');

        done();
      });
    });
  });


  it('server can call more than one method in sequence (promise)', function (done) {
    var mesh = this.mesh;
    mesh.exchange.test.method1()

      .then(function (result) {
        expect(result).to.equal('result1');
        var args = {};
        return mesh.exchange.test.method2(args);
      })

      .then(function (result) {
        expect(result).to.equal('result2');
      })

      .then(done).catch(done);
  });

  it('server can listen for an event - then recieve an event by calling a method', function (done) {
    var mesh = this.mesh;

    mesh.event.test.on('test-emmission', function (args) {
      done();
    });

    mesh.exchange.test.doEmit({test: "test"})
      .catch(done);

  });


  it('client can call more than one method in sequence (callback)', function (done) {
    var client = new Happner.MeshClient({
      port: 54545,
      secure: true
    });

    client.login({username: '_ADMIN', password: 'happn'}).then(function () {

      client.exchange.test.method1(function (e, result) {

        if (e) return done(e);
        expect(result).to.equal('result1');

        var args = {};

        client.exchange.test.method2(args, function (e, result) {

          if (e) return done(e);
          expect(result).to.equal('result2');
          done();

        });
      });
    });
  });


  it('client can call more than one method in sequence (promise)', function (done) {
    var client = new Happner.MeshClient({
      port: 54545,
      secure: true
    });
    client.login({username: '_ADMIN', password: 'happn'}).then(function () {

      client.exchange.test.method1()

        .then(function (result) {
          expect(result).to.equal('result1');
          var args = {};
          return client.exchange.test.method2(args);
        })

        .then(function (result) {
          expect(result).to.equal('result2');
        })

        .then(done).catch(done);

    });
  });

  it('client can listen for an event - then recieve an event by calling a method', function (done) {

    var client = new Happner.MeshClient({
      port: 54545,
      secure: true
    });

    client.login({username: '_ADMIN', password: 'happn'})

      .then(function () {

        client.event.test.on('test-emmission', function (data) {
          done();
        });

        client.exchange.test.doEmit({test: "test"}, function (e, result) {
        });

      })

      .catch(done)

  });

  require('benchmarket').stop();
});

