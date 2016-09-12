var path = require('path');

describe(path.basename(__filename), function (done) {

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var Mesh = require('../')

  var spawn = require('child_process').spawn;
  var expect = require('expect.js');
  var libFolder = path.join(__dirname, 'lib');
  var Promise = require('bluebird');

  var test_id = Date.now() + '_' + require('shortid').generate();
  var should = require('chai').should();

  after(function (done) {
    remote.kill();
    done();
  });

  var testClient;

  before(function (done) {

    // spawn remote mesh in another process
    remote = spawn('node', [path.join(libFolder, '6-remote-mesh')]);

    remote.stdout.on('data', function (data) {

      if (data.toString().match(/READY/)) {
        testClient = new Mesh.MeshClient({port: 3111});
        testClient.login({
          username: '_ADMIN',
          password: 'password'
        }).then(done);
      }

    });

  });

  it('does a set on the datalayer component', function (done) {

    testClient.exchange.test_6.data.set('/6-websocket-client/set', {"val": "set"}, function (e, result) {

      if (e) return done(e);

      expect(result.val).to.be("set");

      done();

    });

  });

  it('does a get on the datalayer component', function (done) {

    testClient.exchange.test_6.data.set('/6-websocket-client/get', {"val": "get"}, function (e, result) {

      if (e) return done(e);

      expect(result.val).to.be("get");

      testClient.exchange.test_6.data.get('/6-websocket-client/get', {}, function (e, getresult) {

        if (e) return done(e);

        expect(getresult.val).to.be("get");
        done();

      });

    });

  });

  it('contains the mesh name and version', function () {
    expect(testClient.info.version).to.be(require(__dirname + '/../package.json').version);
    expect(testClient.info.name).to.be('test_6');
  });

  it('does a delete on the datalayer component', function (done) {

    testClient.exchange.test_6.data.set('/6-websocket-client/delete', {"val": "delete"}, function (e, result) {

      if (e) return done(e);

      expect(result.val).to.be("delete");

      testClient.exchange.test_6.data.get('/6-websocket-client/delete', {}, function (e, getresult) {

        if (e) return done(e);

        expect(getresult.val).to.be("delete");

        testClient.exchange.test_6.data.remove('/6-websocket-client/delete', {}, function (e, removeresult) {

          if (e) return done(e);

          testClient.exchange.test_6.data.get('/6-websocket-client/delete', {}, function (e, getremovedresult) {

            if (e) return done(e);

            expect(getremovedresult).to.be(null);
            done();

          });


        });

      });

    });

  });

  xit('does an on, on the datalayer component', function (done) {


  });

  it('runs a method on a component', function () {
    return testClient.exchange.component.remoteCall();
  });

  it('deletes the right listeners when unsubscribing from data', function (done) {
    this.timeout(30000);

    var subID;

    var utils = {
      subscribeToData: function subscribeToData() {
        return new Promise(function (resolve) {
          testClient.event.data.on('some/random/path', function call1() {
          }, function (err, handle) {
            subID = handle;
            resolve()
          });
        });
      },
      doRemoteCall: function doRemoteCall() {
        return testClient.exchange.component.remoteCall();
      },
      unsubscribeFromData: function () {
        return new Promise(function (resolve) {
          testClient.event.data.off(subID, resolve);
        });
      }
    };

    utils.subscribeToData()
      .then(utils.doRemoteCall)
      .then(utils.unsubscribeFromData)
      .then(utils.doRemoteCall)
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      })
  });

  xit('runs attaches to an event on a component', function (done) {


  });

  require('benchmarket').stop();

});

