var path = require('path');

describe(path.basename(__filename), function () {

  var Happner = require('../');
  var Promise = require('bluebird');
  var fs = require('fs');
  var should = require('chai').should();
  var async = require('async');

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
          filename: dbFileName,
          accountLockout:{
            enabled:true,
            attempts:2,
            retryInterval:3000
          }
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
    if (!server) return done();
    server.stop({reconnect: false}, done);
  });

  it('tests that accountLockout functionality is ported', function (done) {

    async.series([
      function(itemCB){

        var client = new Happner.MeshClient();
        client.login({
            username: 'username',
            password: 'bad password'
          })
          .catch(function (error) {
            error.toString().should.equal('AccessDenied: Invalid credentials');
            itemCB();
          })
      },
      function(itemCB){

        var client = new Happner.MeshClient();
        client.login({
            username: 'username',
            password: 'bad password'
          })
          .catch(function (error) {
            error.toString().should.equal('AccessDenied: Invalid credentials');
            itemCB();
          })
      },
      function(itemCB){

        var client = new Happner.MeshClient();
        client.login({
            username: 'username',
            password: 'bad password'
          })
          .catch(function (error) {
            error.toString().should.equal('AccessDenied: Account locked out');
            setTimeout(itemCB, 3000);
          })
      },
      function(itemCB){

        var client = new Happner.MeshClient();
        client.login({
            username: 'username',
            password: 'password'
          })
          .then(itemCB)
          .catch(itemCB)
      }
    ], done);

  });

  //require('benchmarket').stop();
});
