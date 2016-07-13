describe('1-startup-loader', function (done) {

  // Uses unit test 2 modules
  var should = require('chai').should();
  var Mesh = require('../../');
  var spawn = require('child_process').spawn;
  var path = require('path');
  var expect = require('expect.js');
  var async = require('async');
  var exec = require('child_process').exec;

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(120000);

  var childPIDs = [];

  var configDefault = {
    name: "startupProxiedDefault",
    port: 55000,
    "happner-loader": {},
    modules: {
      testComponent: {
        instance: require("../lib/d6_slow_startup_component")
      }
    },
    components: {
      testComponent: {
        name: 'testComponent',
        moduleName: 'testComponent',
        startMethod: "init",
        schema: {
          "exclusive": false,
          "methods": {
            "init": {
              type: "async",
              parameters: [
                {name: "delay", value: 5000}
              ]
            }
          }
        }
      }
    }
  };

  var configDeferredListen = {
    name: "startupProxiedDifferentPort",
    port: 55001,
    "happner-loader": {},
    deferListen: true
  };

  var configDifferentPortProgressLog = {
    name: "differentPortProgressLog",
    port: 55002
  };

  var configDifferentPortMeshLog = {
    name: "configDifferentPortMeshLog",
    port: 55003
  };

  var meshes = [];
  var mesh;

  function killProc(pid, callback, removeFromChildPIDs) {

    var killCommand = exec("kill -9 " + pid, function (error, stdout, stderr) {

      if (removeFromChildPIDs)
        childPIDs.map(function (childPid, ix) {
          if (childPid == pid)
            childPIDs.splice(ix, 1);
        });

      callback();

    });
  }

  function doRequest(path, callback, port) {

    var request = require('request');

    if (!port) port = 55000;

    if (path[0] != '/')
      path = '/' + path;

    var options = {
      url: 'http://127.0.0.1:' + port.toString() + path,
    };

    request(options, function (error, response, body) {
      callback(body);
    });

  }

  it('starts the loader http server', function (done) {

    var LoaderProgress = require('../../lib/startup/loader_progress');
    var loaderProgress = new LoaderProgress({port: 55000});

    loaderProgress.listen(function (e) {

      if (e) return done(e);

      loaderProgress.progress('test', 10);
      loaderProgress.progress('test1', 20);

      doRequest('/progress', function (data) {

        var prog_data = JSON.parse(data);

        expect(prog_data[0].log).to.be('test');
        expect(prog_data[0].progress).to.be(10);
        expect(prog_data[1].log).to.be('test1');
        expect(prog_data[1].progress).to.be(20);

        loaderProgress.stop();

        done();

      }, 55000);

    });
  });

  it('starts the loader http server, fails to start happn, stops the http server and successfully starts happn', function (done) {

    var LoaderProgress = require('../../lib/startup/loader_progress');
    var loaderProgress = new LoaderProgress({port: 55000});

    loaderProgress.listen(function (e) {

      if (e) return done(e);

      Mesh
        .create(configDefault, function (e, created) {

          expect(e).to.not.be(null);
          expect(e.code).to.be("EADDRINUSE");

          loaderProgress.stop();

          Mesh
            .create(configDefault, function (e, created) {

              expect(e).to.be(null);

              doRequest('/ping', function (data) {

                expect(data).to.be('pong');
                done();

              }, 55000);


            })
        })
    });
  });

  it('starts a mesh with a deferred listen', function (done) {

    Mesh
      .create(configDeferredListen, function (e, created) {

        doRequest('/ping', function (data) {

          expect(data).to.be(undefined);

          created.listen(function (e) {

            doRequest('/ping', function (data) {

              expect(data).to.be('pong');
              done();

            }, 55001);

          });

        }, 55001);

      });

  });

  it('starts a mesh and checks we have progress logs', function (done) {

    var progressLogs = [];

    var startupProgressHandler = function (data) {

      progressLogs.push(data);

      if (data.progress == 100) {
        expect(progressLogs.length).to.be(15);
        Mesh.off('startup-progress', startupProgressHandler)
        done();
      }

    };

    var eventId = Mesh.on('startup-progress', startupProgressHandler);

    Mesh
      .create(configDifferentPortProgressLog, function (e, created) {

        if (e) return done(e);

      });

  });

  it('starts a mesh and checks we have mesh logs', function (done) {

    var meshLogs = [];

    var eventId = Mesh.on('mesh-log', function (data) {

      meshLogs.push(data);

      if (data.stack == 'started!') {
        expect(meshLogs.length > 16).to.be(true);
        done();
      }

    });

    Mesh
      .create(configDifferentPortMeshLog, function (e, created) {

        if (e) return done(e);

      });

  });

  it('starts a loader process, we analyze the loader logs to ensure it is all working', function (done) {
    var _this = this;

    this.timeout(15000);

    var loaderPath = path.resolve('./bin/happner-loader');
    var confPath = path.resolve('./test/lib/d6_conf_redirect.json');

    // spawn remote mesh in another process
    var remote = spawn('node', [loaderPath, '--conf', confPath]);
    var logs = [];
    var childPID = -1;

    var verifyLogs = function () {

      var logScore = 0;

      for (var logIndex in logs) {

        var logMessage = logs[logIndex];

        if (logMessage.indexOf('(mesh) started component \'security\'') >= 0) {
          console.log('score 1');
          logScore++;
        }

        if (logMessage.indexOf('(mesh) started component \'system\'') >= 0) {
          console.log('score 2');
          logScore++;
        }

        if (logMessage.indexOf('happner ready to start listening') >= 0) {
          console.log('score 3');
          logScore++;
        }

        if (logMessage.indexOf('happner process is now listening, killing parent process in 5 seconds') >= 0) {
          console.log('score 4');
          logScore++;
        }

      }


      return logScore;
    }

    remote.stdout.on('data', function (data) {

      var logMessage = data.toString().toLowerCase();

      logs.push(logMessage);

      if (logMessage.indexOf('child process loaded') >= 0) {

        var childPIDLog = logMessage.split(':::');
        var childPID = parseInt(childPIDLog[childPIDLog.length - 1]);

        childPIDs.push(childPID);
      }

      if (logMessage.indexOf('happner process is now listening, killing parent process in 5 seconds') >= 0) {
        setTimeout(function () {

          doRequest('/ping', function (data) {

            expect(data).to.be('pong');
            var score = verifyLogs();

            if (score == 4)
              killProc(childPID, done, true);
            else done(new Error('log message score invalid:::' + score.toString()));

          }, 55004);

        }, 7000);
      }
    });

  });


  after('kills the proxy and stops the mesh if its running', function (done) {

    var killProcs = function () {

      if (childPIDs.length > 0) {

        async.eachSeries(childPIDs, function (pid, cb) {

          killProc(pid, cb);

        }, done);

      } else done();
    }

    if (meshes.length > 0)
      async.eachSeries(meshes, function (stopMesh, cb) {
        stopMesh.stop({reconnect: false}, cb);
      }, killProcs);
    else killProcs();

  });

  require('benchmarket').stop();

});









