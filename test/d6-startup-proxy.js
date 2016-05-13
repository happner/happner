// Uses unit test 2 modules
var should = require('chai').should();
var Mesh = require('../');
var spawn = require('child_process').spawn;
var path = require('path');
var expect = require('expect.js');
var async = require('async');

describe('d6-startup-proxy', function (done) {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(120000);

  var configDefault = {
    name: "startupProxiedDefault",
    port: 55000,
    startupProxy: {
      enabled: true
    },
    modules: {
      testComponent: {
        instance: require("./lib/d6_slow_startup_component")
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

  var configDifferentPort = {
    name: "startupProxiedDifferentPort",
    port: 55001,
    startupProxy: {
      enabled: true
    }
  };

  var configDifferentPortRedirect = {
    name: "startupProxiedDifferentPort",
    port: 55002,
    startupProxy: {
      enabled: true,
      redirect: "/ping"
    }
  };

  var meshes = [];
  var mesh;

  function doRequest(path, token, query, callback, port) {

    var request = require('request');

    if (!port) port = 55000;

    if (path[0] != '/')
      path = '/' + path;

    var options = {
      url: 'http://127.0.0.1:' + port.toString() + path,
    };

    if (token) {
      if (!query)
        options.headers = {'Cookie': ['happn_token=' + token]}
      else
        options.url += '?happn_token=' + token;
    }

    request(options, function (error, response, body) {
      callback(body);
    });

  }

  var proxyManager;

 // for manually testing the proxy

  it('starts the proxy server using the proxy manager, long running', function (done) {

    this.timeout(60000);

    var ProxyManager = require('../lib/startup/proxy_manager');
    proxyManager = new ProxyManager();

    proxyManager.start({port: 55000}, function (e) {

      if (e) return done(e);

      proxyManager.progress('test', 10);
      proxyManager.progress('test1', 20);

      doRequest('/progress', null, null, function(data){

        var prog_data = JSON.parse(data);

        expect(prog_data[0].log).to.be('test');
        expect(prog_data[0].percentComplete).to.be(10);
        expect(prog_data[1].log).to.be('test1');
        expect(prog_data[1].percentComplete).to.be(20);



        setTimeout(done, 40000);


      }, 55000);

    })

  });

  // it('starts the proxy server using the proxy manager', function (done) {
  //
  //   var ProxyManager = require('../lib/startup/proxy_manager');
  //   proxyManager = new ProxyManager();
  //
  //   proxyManager.start({port: 55000}, function (e) {
  //
  //     if (e) return done(e);
  //
  //     proxyManager.progress('test', 10);
  //     proxyManager.progress('test1', 20);
  //
  //     doRequest('/progress', null, null, function(data){
  //
  //       var prog_data = JSON.parse(data);
  //
  //       expect(prog_data[0].log).to.be('test');
  //       expect(prog_data[0].percentComplete).to.be(10);
  //       expect(prog_data[1].log).to.be('test1');
  //       expect(prog_data[1].percentComplete).to.be(20);
  //
  //       done();
  //
  //
  //     }, 55000);
  //
  //   })
  //
  // });

  it('fails to start a mesh because the proxy is up', function (done) {

    Mesh
      .create(configDefault, function (e, created) {

        expect(e).to.not.be(null);
        expect(e.code).to.be("EADDRINUSE");

        proxyManager.stop();
        setTimeout(done, 5000);

      })

  });

  it('starts a mesh that takes 5 seconds to start', function (done) {

    Mesh
      .create(configDefault, function (e, created) {
        if (e) return done(e);
        mesh = created;
        meshes.push(mesh);
        done();
      })

  });

  var otherMesh;

  it('starts a mesh on a different port', function (done) {

    Mesh
      .create(configDifferentPort, function (e, created) {
        if (e) return done(e);
        otherMesh = created;
        meshes.push(otherMesh);
        done();
      })

  });

  var redirectMesh;

  it('starts a mesh on a different port, with a redirect configured', function (done) {

    Mesh
      .create(configDifferentPortRedirect, function (e, created) {
        if (e) return done(e);
        redirectMesh = created;
        meshes.push(redirectMesh);

        done();

      })

  });

  after('kills the proxy and stops the mesh if its running', function (done) {

    async.eachSeries(meshes, function(stopMesh, cb){
      stopMesh.stop({reconnect: false}, cb);
    }, done);

  })

  require('benchmarket').stop();

});









