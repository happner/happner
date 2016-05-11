// Uses unit test 2 modules
var should = require('chai').should();
var Mesh = require('../');
var spawn = require('child_process').spawn;
var path = require('path');
var expect = require('expect.js');

describe('d6-startup-proxy', function (done) {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(10000);

  var configDefault = {
    name: "startupProxiedDefault",
    port: 55001,
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

  var configRedirect = {
    name: "startupProxiedRedirect",
    port: 55002,
    startupProxy: {
      enabled: true,
      redirect: "/ping.html"
    }
  };

  var mesh;

  function doRequest(path, token, query, callback, port) {

    var request = require('request');

    if (!port) port = 55000;

    if (path[0] != '/')
      path = '/' + path

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

  var startProxy = function (done) {

    var proxyPath = path.resolve('./lib/startup/proxy.js');

    console.log('PROXY PATH:::', proxyPath);

    // spawn remote mesh in another process
    remote = spawn('node', [proxyPath, '55001']);

    remote.stdout.on('data', function (data) {

      var result = data.toString();

      console.log('FROM PROXY:::', result, result.length);

      if (result.substring(0, 7) == 'STARTED')
        return done(null, remote);

      return done(new Error(data), remote);

    });
  }

  var __proxy;

  it('starts the proxy server and checks all resources are available', function (done) {

    startProxy(function (e, proxy) {

      console.log('in start proxy:::', e);

      if (proxy) {
        proxy.kill();
        console.log('KILLED PROXY OK');
      }

      if (e) return done(e);

      done();
    })

  });

  var proxyManager;

  it('starts the proxy server using the proxy manager', function (done) {

    var ProxyManager = require('../lib/startup/proxy_manager');
    proxyManager = new ProxyManager();

    proxyManager.start({port: 55001}, function (e) {

      if (e) return done(e);

      done();

      // proxyManager.stop({delay: 2000}, function () {
      //
      //   done();
      //
      // });

    })

  });

  it('fails to start a mesh because the proxy is up', function (done) {

    Mesh
      .create(configDefault, function (e, created) {

        console.log('mesh start error:::', JSON.stringify(e));
        expect(e).to.not.be(null);
        expect(e.code).to.be("EADDRINUSE");

        proxyManager.stop();
        done();

      })

  });

  it('starts a mesh that takes 5 seconds to start', function (done) {

    Mesh
      .create(configDefault, function (e, created) {
        if (e) return done(e);
        mesh = created;
        done();
      })

  });


  it('stops the mesh', function (done) {
    if (mesh) {
      mesh.stop({reconnect: false}, function (e, log) {
        done(e);
      });
    }
  });

  require('benchmarket').stop();

  after('kills the proxy and stops the mesh if its running', function (done) {

    if (__proxy)
      __proxy.kill();

    done();

  })

});









