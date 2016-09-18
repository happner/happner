describe('f1-datalayer-transform-middleware', function () {

  require('benchmarket').start();

  after(require('benchmarket').store());

  var expect = require('expect.js');
  var Mesh = require('../');

  var serviceInstance;
  var clientInstance = new Mesh.MeshClient({secure: true, port: 22222});

  var disconnectClient = function(client, cb){

    if (typeof client === 'function'){
      cb = client;
      client = null;
    }

    if (!client) client = clientInstance;

    if (client) {
      client.disconnect(cb);
    } else cb();
  };

  var stopService = function(callback){
    if (serviceInstance)
      serviceInstance.stop(callback);
    else
      callback();
  };

  after('disconnects the client and stops the server', function(callback){

    this.timeout(3000);

    disconnectClient();
    setTimeout(function(){
      stopService(callback);
    }, 1000);

  });

  var getService = function(transformMiddleware, callback, port){

    disconnectClient();

    setTimeout(function(){

      stopService(function(e){

        if (e) return callback(e);

        if (!port) port = 22222;

        var config = {
          secure:true,
          port: port,
          activateSessionManagement:true,
          logSessionActivity:true,
          datalayer:{
            adminPassword:'happn',
            transformMiddleware:transformMiddleware
          }
        };

        Mesh.create(config, function (err, instance) {

          serviceInstance = instance;

          if (err) return callback(err);

          clientInstance = new Mesh.MeshClient({secure: true, port: port});

          clientInstance
            .login({username: '_ADMIN', password: 'happn'})
            .then(function(){
              setTimeout(callback, 1000)
            })
            .catch(callback);

        });
      });

    }, 1000);
  };

  it('tests spying on session activity', function (callback) {

    this.timeout(6000);

    var packetsIn = [];
    var packetsOut = [];

    var spyConfig = {

      suppressPrint:true,

      log:function(direction, packet){

        if (direction == 'incoming') packetsIn.push(packet);
        if (direction == 'outgoing') packetsOut.push(packet);

      }
    };

    var middleware = [{path:'./transform-message-spy', options:spyConfig}];

    getService(middleware, function(e){

      if (e) return callback(e);

      clientInstance.exchange.security.listActiveSessions(function(e, list){

        if (e) return callback(e);
        expect(list.length <= 2).to.be(true);

        setTimeout(function(){

          clientInstance.exchange.security.listSessionActivity(function(e, list){

            if (e) return callback(e);

            expect(list.length <= 2).to.be(true);

            expect(packetsIn.length > 0).to.be(true);
            expect(packetsOut.length > 0).to.be(true);

            callback();

          });

        }, 1000);
      });
    });
  });

  require('benchmarket').stop();

});
