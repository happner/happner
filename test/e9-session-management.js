describe('e9_session_management', function () {

  require('benchmarket').start();

  after(require('benchmarket').store());

  var expect = require('expect.js');
  var Mesh = require('../');

  var serviceInstance;
  var clientInstance = new Mesh.MeshClient({secure: true, port: 11111});

  var disconnectClient = function(){
    if (clientInstance)
      clientInstance.disconnect({reconnect:false});
  };

  var stopService = function(callback){
    if (serviceInstance)
      serviceInstance.stop(callback)
    else
      callback();
  };

  var getService = function(activateSessionManagement, callback){

    if (typeof activateSessionManagement == 'function'){
      callback = activateSessionManagement;
      activateSessionManagement = true;
    }

    disconnectClient();

    console.log('disconnected client:::');

    stopService(function(e){

      if (e) return callback(e);

      Mesh.create({
        secure:true,
        port: 11111,
        activateSessionManagement:activateSessionManagement,
        datalayer:{
          adminPassword:'happn'
        }
      }, function (err, instance) {

        serviceInstance = instance;

        if (err) return callback(err);

        clientInstance
          .login({username: '_ADMIN', password: 'happn'})
          .then(callback)
          .catch(callback);

      });
    });
  };

  it('tests active sessions and session activity logging on a secure instance', function (callback) {

    this.timeout(6000);

    getService(function(e){

      if (e) return callback(e);

      clientInstance.exchange.security.listActiveSessions(function(e, list){

        if (e) return callback(e);
        expect(list.length).to.be(2);

        clientInstance.exchange.security.listSessionActivity(function(e, list){

          if (e) return callback(e);
          expect(list.length).to.be(2);

          callback();

        });
      });
    });
  });

  it('tests session revocation on a secure instance', function (callback) {

    this.timeout(10000);

    getService(function(e){
      clientInstance.exchange.security.listActiveSessions(function(e, list){

        if (e) return callback(e);
        expect(list.length).to.be(2);

        clientInstance.exchange.security.listSessionActivity(function(e, list){

          if (e) return callback(e);
          expect(list.length).to.be(2);

          var newInstance = new Mesh.MeshClient({secure: true, port: 11111});

          newInstance

            .login({username: '_ADMIN', password: 'happn'})
            .then(function(){

              clientInstance.exchange.security.listActiveSessions(function(e, list){

                if (e) return callback(e);
                expect(list.length).to.be(3);

                var session = list[2];

                clientInstance.exchange.security.revokeSession(session, 'APP', function(e){

                  if (e) return callback(e);

                  clientInstance.exchange.security.listRevokedSessions(function(e, items){

                    expect(items.length).to.be(1);

                    newInstance.exchange.security.listActiveSessions(function(e, list){
                      if (!e) return callback(new Error('this was not meant to happn'));
                    });

                    setTimeout(function(){
                      callback();
                    }, 2000)
                  });
                });
              });
            })
            .catch(callback);

        });
      });
    });
  });

  require('benchmarket').stop();

});
