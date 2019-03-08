describe('e4-newMesh', function () {

  this.timeout(120000);

  //require('benchmarket').start();
  //after(//require('benchmarket').store());

  var expect = require('expect.js');

  var Mesh = require('../');
  var mesh;

  it('tests the client newMesh call', function (done) {

    Mesh.create( function(e, instance){

      if (e) return callback(e);
      mesh = instance;

      mesh._mesh._createElement({component:{}, module:{config:{}}},{}, function(e){
        mesh.stop({reconnect:false}, done);
      });

    });

  });

  it('tests a re-initialized mesh', function (done) {

    Mesh.create( function(e, instance){

      if (e) return callback(e);
      mesh = instance;

      mesh._mesh._createElement({component:{}, module:{config:{}}},{}, function(e){

          mesh.stop({reconnect:false}, function(e){

            if (e) return done(e);

            mesh.initialize({},function(e, instance){

              instance._mesh._createElement({component:{}, module:{config:{}}},{}, function(e){

                mesh.stop({reconnect:false},done);

              });

            });
          });
        });

    });


  });

  it('starts a mesh with deferListen true and no loader', function (done) {

    var configDeferredListen = {
      name: "startupProxiedDifferentPort",
      port: 55001,
      deferListen: true
    };

    Mesh
      .create(configDeferredListen, function (e, created) {

        doRequest('/ping', function (data) {

          expect(data).to.be('pong');
          created.stop(done);
        },55001);
      });
  });

  //require('benchmarket').stop();

});

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
