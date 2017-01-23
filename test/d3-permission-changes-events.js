describe('d3-permission-changes', function () {

  this.timeout(120000);

  //require('benchmarket').start();
  //after(//require('benchmarket').store());

  var expect = require('expect.js');
  var should = require('chai').should();

  var Mesh = require('../');
  var mesh = new Mesh();

  var test_id = Date.now() + '_' + require('shortid').generate();
  var async = require('async');

  before(function (done) {

    var _this = this;

    _this.adminClient = new Mesh.MeshClient({secure: true, port: 8004});

    mesh.initialize({
      name: 'd3-permission-changes-events',
      datalayer: {
        secure: true,
        adminPassword: test_id,
        port: 8004
      }
    }, function (err) {
      if (err) return done(err);
      mesh.start(function (err) {
        if (err) {
          return done(err);
        }

        // Credentials for the login method
        var credentials = {
          username: '_ADMIN', // pending
          password: test_id
        }

        _this.adminClient.login(credentials).then(function () {
          done();
        }).catch(done);

      });
    });
  });

  after(function (done) {
    mesh.stop({reconnect: false}, done);
  });

  it('tests that all security events are being bubbled back from happn to happner security - and are consumable from an admin client', function (done) {

    var _this = this;

    var testGroup = {
      name: 'TESTGROUP1' + test_id,

      custom_data: {
        customString: 'custom1',
        customNumber: 0
      },

      permissions: {
        methods: {}
      }
    }

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    var userUpsertedEventFired = false;
    var groupUpsertedEventFired = false;
    var linkGroupEventFired = false;
    var unlinkGroupEventFired = false;
    var deleteGroupEventFired = false;
    var deleteUserEventFired = false;

    //link-group
    //

    var eventsToFire = {
      'upsert-user': false,
      'upsert-group': false,
      'link-group': false,
      'unlink-group': false,
      'delete-group': false,
      'delete-user': false
    };

    var fireEvent = function (key) {

      eventsToFire[key] = true;

      for (var eventKey in eventsToFire)
        if (eventsToFire[eventKey] == false)
          return;

      done();
    };

    _this.adminClient.exchange.security.attachToSecurityChanges(function (e) {

      if (e) return callback(e);

      _this.adminClient.event.security.on('upsert-user', function (data) {
        fireEvent('upsert-user');
      });

      _this.adminClient.event.security.on('upsert-group', function (data) {
        fireEvent('upsert-group');
      });

      _this.adminClient.event.security.on('link-group', function (data) {
        fireEvent('link-group');
      });

      _this.adminClient.event.security.on('unlink-group', function (data) {
        fireEvent('unlink-group');
      });

      _this.adminClient.event.security.on('delete-group', function (data) {
        fireEvent('delete-group');
      });

      _this.adminClient.event.security.on('delete-user', function (data) {
        fireEvent('delete-user');
      });

      _this.adminClient.exchange.security.addGroup(testGroup, function (e, result) {

        if (e) return done(e);

        testGroupSaved = result;

        var testUser = {
          username: 'TESTUSER1' + test_id,
          password: 'TEST PWD',
          custom_data: {
            something: 'useful'
          }
        };

        _this.adminClient.exchange.security.addUser(testUser, function (e, result) {

          if (e) return done(e);

          expect(result.username).to.be(testUser.username);
          testUserSaved = result;

          _this.adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {
            //we'll need to fetch user groups, do that later
            if (e) return done(e);

            testUser.password = 'NEW PWD';
            testUser.custom_data = {changedCustom: 'changedCustom'};

            _this.adminClient.exchange.security.updateUser(testUser, function (e, result) {

              if (e) return done(e);

              _this.adminClient.exchange.security.unlinkGroup(testGroupSaved, testUserSaved, function (e, result) {

                if (e) return done(e);

                _this.adminClient.exchange.security.deleteGroup(testGroupSaved, function (e, result) {

                  if (e) return done(e);

                  _this.adminClient.exchange.security.deleteUser(testUser, function (e, result) {

                    if (e) return done(e);

                  })

                });
              });
            });
          });
        });
      });
    });
  });

  //require('benchmarket').stop();

});
