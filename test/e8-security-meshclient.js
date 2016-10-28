var path = require('path');
var Happner = require('../');
var Promise = require('bluebird');
var fs = require('fs');
var should = require('chai').should();

describe.skipWindows = (process.platform === 'win32') ? describe.skip : describe;

// skip for issue 223
describe.skipWindows(path.basename(__filename), function () {

  require('benchmarket').start();
  after(require('benchmarket').store());

  var server;
  var test_id = Date.now() + '_' + require('shortid').generate();
  var dbFileName = './temp/' + test_id + '.nedb';

  this.timeout(60000);

  before('start server', function (done) {

    try {
      fs.unlinkSync(dbFileName);
    } catch (e) {
    }
    Happner.create({
      name: 'Server',
      datalayer: {
        persist: true,
        secure: true,
        filename: dbFileName
      },
      modules: {
        'ComponentName': {
          instance: {
            allowedMethod: function ($origin, input, callback, $happn) { // "max-nasty" injection
              input.meshName = $happn.info.mesh.name;
              input.originUser = $origin.username;
              callback(null, input);
            },
            deniedMethod: function (input, callback) {
              callback(null, input);
            }
          }
        }
      },
      components: {
        'ComponentName': {}
      }
    })
      .then(function (mesh) {
        var security = mesh.exchange.security;
        server = mesh;
        return Promise.all([
          security.addGroup({
            name: 'group',
            permissions: {
              events: {},
              // data: {},
              methods: {
                '/Server/ComponentName/allowedMethod': {authorized: true}
              }
            }
          }),
          security.addUser({
            username: 'username',
            password: 'password'
          })
        ]).spread(function (group, user) {
          return security.linkGroup(group, user);
        });
      })
      .then(function () {
        done();
      })
      .catch(done);
  });

  after('stop server', function (done) {
    try {
      fs.unlinkSync(dbFileName);
    } catch (e) {
    }
    if (server) return server.stop({reconnect: false}, done);
    done();
  });

  it('rejects login promise on bad credentials', function (done) {
    var client = new Happner.MeshClient();
    client.login({
      username: 'username',
      password: 'bad password'
    })
      .then(function () {
        client.disconnect();
        done(new Error('should not allow'));
      })
      .catch(function (error) {
        error.toString().should.equal('AccessDenied: Invalid credentials');
        done();
      })
      .catch(done);
  });

  it('emits login/deny on bad credentials', function (done) {
    var client = new Happner.MeshClient();
    client.on('login/deny', function (error) {
      try {
        error.toString().should.equal('AccessDenied: Invalid credentials');
        done();
      } catch (e) {
        done(e);
      }
    });
    client.login({
      username: 'username',
      password: 'bad password'
    })
      .then(function () {
        client.disconnect();
        done(new Error('should not allow'));
      })
  });

  it('emits login/allow on good credentials', function (done) {
    var client = new Happner.MeshClient();
    client.on('login/allow', function () {
      done();
    });
    client.login({
      username: 'username',
      password: 'password'
    })
      .catch(done)
  });

  context('events', function () {
    // might already be implicitly tested in elsewhere
    //
    // publish allowed/denied
    // subscribe allowed/denied
  });

  context('data', function () {
    // ?
  });

  context('exchange', function () {
    var client;

    before('start client', function (done) {
      client = new Happner.MeshClient();
      client.login({
        username: 'username',
        password: 'password'
      })
        .then(function () {
          done();
        })
        .catch(done);
    });

    after('stop client', function () {
      client.disconnect();
    });

    it('allows access to allowed methods', function (done) {
      client.exchange.ComponentName.allowedMethod({key: 'value'})
        .then(function (result) {
          // result.should.eql({}); // ???
          ({
            key: 'value',
            meshName: 'Server',
            originUser: 'username'
          }).should.eql(result);
          done();
        })
        .catch(done);
    });

    it('denies access to denied methods', function (done) {
      client.exchange.ComponentName.deniedMethod({key: 'value'})
        .then(function (result) {
          done(new Error('should not allow'));
        })
        .catch(function (error) {
          error.toString().should.equal('AccessDenied: unauthorized');
          done();
        })
        .catch(done);
    });
  });

  require('benchmarket').stop();
});
