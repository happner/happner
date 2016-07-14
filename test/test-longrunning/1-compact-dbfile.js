var Mesh = require('../../');
var path = require('path');

var fs = require('fs');

var test_file_call = path.resolve(__dirname, '../') + path.sep + 'temp/1-compact-dbfile-call.nedb';
var test_file_interval = path.resolve(__dirname, '../') + path.sep + 'temp/1-compact-dbfile-interval.nedb';

var expect = require('expect.js');
var test_helper = require('../lib/test_helper');

var async = require('async');

var config_call = {
  datalayer: {
    port: 55006,
    filename: test_file_call
  },
  components: {
    "data": {}
  }
};

var config_interval = {
  datalayer: {
    port: 55007,
    filename: test_file_interval,
    compactInterval: 10000//compact every 5 seconds
  },
  components: {
    "data": {}
  }
};

describe('1-compact-dbfile', function () {

  this.timeout(30000);
  var callMeshInstance;
  var callMeshClient;
  var intervalMeshInstance;
  var intervalMeshClient;

  function getFileSize(filepath) {
    var stats = fs.statSync(filepath);

    if (!stats) return 0;
    if (!stats["size"]) return 0;

    return stats["size"];
  }

  before(function (done) {
    test_helper.startHappnerInstance('1-compact-dbfile',
      config_call,
      function (e, mesh, client) {
        if (e) return done(e);
        callMeshInstance = mesh;
        callMeshClient = client;
        test_helper.startHappnerInstance('1-compact-dbfile',
          config_interval,
          function (e, mesh, client) {
            if (e) return done(e);
            intervalMeshInstance = mesh;
            intervalMeshClient = client;
            done();
          });
      });
  });

  after(function (done) {
    test_helper.stopHappnerInstances('1-compact-dbfile', done)
  });

  it('should add and update some data, check the filesize - then call compact and check the size is smaller', function (done) {

    async.series([
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 1}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 2}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 3}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 4}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 5}, callback)
      }
    ], function (e) {

      if (e) return done(e);
      var fileSizeUncompacted = getFileSize(test_file_call);

      callMeshInstance.exchange.system.compactDBFile(function (e) {

        if (e) return done(e);

        var fileSizeCompacted = getFileSize(test_file_call);
        expect(fileSizeCompacted < fileSizeUncompacted).to.be(true);

        done();

      });
    });

  });

  it('should add and update some data on the interval system, then wait for 15 seconds and check the filesize is the expected compact size', function (done) {

    async.series([
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 1}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 2}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 3}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 4}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 5}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 1}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 2}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 3}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 4}, callback)
      },
      function (callback) {
        callMeshClient.exchange.data.set('/some/test/data', {'test': 5}, callback)
      }
    ], function (e) {

      if (e) return done(e);

      var fileSizeUncompacted = getFileSize(test_file_interval);

      setTimeout(function () {

        var fileSizeCompacted = getFileSize(test_file_interval);
        expect(fileSizeCompacted < fileSizeUncompacted).to.be(true);
        done();

      }, 13000);

    });
  });
});
