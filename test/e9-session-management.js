describe('e9_session_management', function () {

  require('benchmarket').start();

  //after(require('benchmarket').store());

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

  after('disconnects the client and stops the server', function(callback){

    this.timeout(3000);

    disconnectClient();
    setTimeout(function(){
      stopService(callback);
    }, 1000);

  });

  var getService = function(activateSessionManagement, logSessionActivity, callback){

    if (typeof activateSessionManagement == 'function'){
      callback = activateSessionManagement;
      activateSessionManagement = true;
      logSessionActivity = true;
    }

    if (typeof logSessionActivity == 'function'){
      callback = logSessionActivity;
      activateSessionManagement = activateSessionManagement;
      logSessionActivity = true;
    }

    disconnectClient();

    setTimeout(function(){

      stopService(function(e){

        if (e) return callback(e);

        Mesh.create({
          secure:true,
          port: 11111,
          activateSessionManagement:activateSessionManagement,
          logSessionActivity:logSessionActivity,
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

    }, 1000);
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

    this.timeout(15000);

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

                clientInstance.exchange.security.revokeSession(newInstance.data.session, 'APP', function(e){

                  if (e) return callback(e);

                  setTimeout(function(){

                    clientInstance.exchange.security.listRevokedSessions(function(e, items){

                      expect(items.length).to.be(1);

                      newInstance.exchange.security.listActiveSessions(function(err, list){
                        if (!err) return callback(new Error('this was not meant to happn'));
                        expect(err.toString()).to.be('Error: session with id ' + newInstance.data.session.id + ' has been revoked');

                        newInstance.disconnect({reconnect:false});
                        callback();

                      });

                    });
                  }, 2000);
                });
              });
            })
            .catch(callback);
        });
      });
    });
  });

  it('tests switching on active sessions but not session activity logging on a secure instance', function (callback) {

    this.timeout(6000);

    getService(false, false, function(e){

      if (e) return callback(e);

      clientInstance.exchange.security.listActiveSessions(function(e, list){

        expect(e.toString()).to.be('Error: session management not activated');

        clientInstance.exchange.security.listSessionActivity(function(e, list){

          expect(e.toString()).to.be('Error: session activity logging not activated');

          clientInstance.exchange.security.activateSessionManagement(function(e){

            if (e) return callback(e);

            clientInstance.exchange.security.listActiveSessions(function(e, list){

              if (e) return callback(e);
              expect(list.length).to.be(1);

              clientInstance.exchange.security.listSessionActivity(function(e, list){
                expect(e.toString()).to.be('Error: session activity logging not activated');
                callback();
              });
            });
          });
        });
      });
    });
  });

  it('tests switching on active sessions and session activity logging on a secure instance', function (callback) {

    this.timeout(6000);

    getService(false, false, function(e){

      if (e) return callback(e);

      clientInstance.exchange.security.listActiveSessions(function(e, list){

        expect(e.toString()).to.be('Error: session management not activated');

        clientInstance.exchange.security.listSessionActivity(function(e, list){

          expect(e.toString()).to.be('Error: session activity logging not activated');

          clientInstance.exchange.security.activateSessionManagement(true, function(e){

            if (e) return callback(e);

            clientInstance.exchange.security.listActiveSessions(function(e, list){

              if (e) return callback(e);
              expect(list.length).to.be(1);

              clientInstance.exchange.security.listSessionActivity(function(e, list){

                if (e) return callback(e);
                expect(list.length).to.be(2);

                callback();

              });
            });
          });
        });
      });
    });
  });

  require('benchmarket').stop();

});
