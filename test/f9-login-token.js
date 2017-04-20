
describe(require('path').basename(__filename), function () {

  this.timeout(30000);

  var expect = require('expect.js');
  var Happner = require('../');
  var async = require('async');

  var happnerInstance1 = null;
  var happnerInstance2 = null;

  var serviceConfig1 = {
    datalayer: {
      port: 10000,
      secure: true,
      adminPassword:'happn',
      services: {
        security: {
          config: {
            sessionTokenSecret: 'h1_test-secret',
            keyPair: {
              privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
              publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2'
            }
          }
        }
      },
      profiles: [
         {
          name: "short-session",
          session: {
            $and: [{
              user: {username: {$eq: '_ADMIN'}},
              info: {shortSession: {$eq: true}}
            }]
          },
          policy: {
            ttl: '2 seconds'
          }
        }, {
          name: "browser-session",
          session: {
            $and: [{
              user: {username: {$eq: '_ADMIN'}},
              info: {_browser: {$eq: true}}
            }]
          },
          policy: {
            ttl: '7 days'
          }
        }, {
          name: "node-session",
          session: {
            $and: [{
              user: {username: {$eq: '_ADMIN'}},
              _browser: false
            }]
          },
          policy: {
            ttl: 0 // no ttl
          }
        }
      ]
    }
  };

  var serviceConfig2 = {
    datalayer:{
      port:10001,
      secure: true,
      adminPassword:'happn',
      services:{
        security: {
          config: {
            sessionTokenSecret:'h1_test-secret',
            keyPair: {
              privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
              publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2'
            },
            profiles:[ //profiles are in an array, in descending order of priority, so if you fit more than one profile, the top profile is chosen
              {
                name:"token-not-allowed",
                session:{
                  $and:[{
                    user:{username:{$eq:'_ADMIN'}},
                    info:{tokenNotAllowedForLogin:{$eq:true}}
                  }]
                },
                policy:{
                  disallowTokenLogins:true
                }
              }, {
                name:"short-session",
                session:{
                  $and:[{
                    user:{username:{$eq:'_ADMIN'}},
                    info:{shortSession:{$eq:true}}
                  }]
                },
                policy:{
                  ttl: '2 seconds'
                }
              }, {
                name:"browser-session",
                session:{
                  $and:[{
                    user:{username:{$eq:'_ADMIN'}},
                    _browser:true
                  }]
                },
                policy:{
                  ttl: '7 days'
                }
              }, {
                name:"locked-session",
                session:{
                  $and:[{
                    user:{username:{$eq:'_ADMIN'}},
                    info:{tokenOriginLocked:{$eq:true}}
                  }]
                },
                policy:{
                  ttl: 0, // no ttl
                  lockTokenToOrigin:true
                }
              }, {
                name:"node-session",
                session:{
                  $and:[{
                    user:{username:{$eq:'_ADMIN'}},
                    _browser:false
                  }]
                },
                policy:{
                  ttl: 0 // no ttl
                }
              }
            ]
          }
        }
      }
    }
  };

  before('should initialize the service', function (callback) {

    this.timeout(20000);

    try {

      Happner.create(serviceConfig1, function (e, happnInst1) {

        if (e) return callback(e);

        happnerInstance1 = happnInst1;

        Happner.create(serviceConfig2, function (e, happnInst2) {

          if (e) return callback(e);

          happnerInstance2 = happnInst2;

          callback();
        });
      });
    } catch (e) {
      callback(e);
    }
  });

  after(function (done) {

    if (happnerInstance1) happnerInstance1.stop()

      .then(function(){

        if (happnerInstance2) happnerInstance2.stop()
          .then(function(){
            done();
          })
          .catch(done);
        else done();

      })
      .catch(done);

    else done();
  });

  var getClient = function(options, credentials, callback){



    var client = new Happner.MeshClient(options);

    client.login(credentials)

      .then(function () {
        //console.log('get client login succeeded:::');
        callback(null, client);
      })

      .catch(function (e) {
        //console.log('get client login failed:::', e);
        callback(e);
      });
  };

  var tryDisconnect = function(clientInstance, callback){

    if (!clientInstance) return callback();

    try{
      clientInstance.disconnect(callback);
    }catch(e){
      callback();
    }
  };

  var testOperations = function(clientInstance, callback){

    var calledBack = false;

    var timeout = setTimeout(function(){
      raiseError('operations timed out');
    }, 2000);

    var raiseError = function(message){
      if (!calledBack){
        calledBack = true;
        return callback(new Error(message));
      }
    };

    var operations = '';

    clientInstance.data.on('/test/operations',

      function(data, meta){

        operations += meta.action.toUpperCase().split('@')[0].replace(/\//g, '');

        if (operations === 'SETREMOVE'){

          clearTimeout(timeout);

          callback();
        }

      }, function(e){

        if (e) return raiseError(e.toString());

        clientInstance.data.set('/test/operations', {test:'data'}, function(e){

          if (e) return raiseError(e.toString());

          clientInstance.data.remove('/test/operations', function(e){

            if (e) return raiseError(e.toString());
          });
        });
      });
  };

  it('001: logs in with the test client, supplying a public key, we perform a bunch of operations - we remember the token and logout - then login with the token, and test operations', function (done) {

    getClient({
      port:10000
    }, {
      username: '_ADMIN',
      password: 'happn'
    }, function(e, instance){

      if (e) return done(e);

      testOperations(instance, function(e){

        if (e) return done(e);

        var token = instance.data.session.token;

        instance.disconnect(function(e){

          if (e) return done(e);

          getClient({
            port:10000
          }, {
            token:token
          }, function(e, tokenInstance) {

            if (e) return done(e);

            testOperations(tokenInstance, function(e){

              tryDisconnect(tokenInstance, function(){
                done(e);
              });
            });
          });
        });
      });
    });
  });

  it('002: logs in with the test client, supplying a public key, we perform a bunch of operations - we wait for the short session to time out, then try and reuse the token for login, it should not be allowed', function (done) {

    getClient({
      port:10000,
      info:{
        shortSession:true
      }
    }, {
      username: '_ADMIN',
      password: 'happn'
    }, function(e, instance){

      if (e) return done(e);

      testOperations(instance, function(e){

        if (e) return done(e);

        var token = instance.data.session.token;

        instance.disconnect(function(e){

          if (e) return done(e);

          setTimeout(function(){

            getClient({
              port:10000
            }, {
              token:token
            }, function(e) {
              expect(e.toString()).to.be('AccessDenied: Invalid credentials');
              done();
            });

          }, 2010);
        });
      });
    });
  });

  it('003: testing inverse of test 002, so no timed out session', function (done) {

    getClient({
      port:10000
    },{
      username: '_ADMIN',
      password: 'happn'
    }, function(e, instance){

      if (e) return done(e);

      testOperations(instance, function(e){

        if (e) return done(e);

        var token = instance.data.session.token;

        instance.disconnect(function(e){

          if (e) return done(e);

          setTimeout(function(){

            getClient({
              port:10000
            },{
              token:token
            }, done);

          }, 2010);
        });
      });
    });
  });

  it('004: logs in with the test client, supplying a public key, we perform a bunch of operations - we remember the token and logout revoking the token - we then ensure we are unable to login with the revoked token', function (done) {

    getClient({
      port:10000
    }, {
      username: '_ADMIN',
      password: 'happn'
    }, function(e, instance){

      if (e) return done(e);

      testOperations(instance, function(e){

        if (e) return done(e);

        var token = instance.data.session.token;

        instance.disconnect({revokeSession:true}, function(e){

          if (e) return done(e);

          setTimeout(function(){

            getClient({
              port:10000
            }, {
              token:token
            }, function(e){
              expect(e.toString()).to.be('AccessDenied: Invalid credentials');
              done();
            });

          }, 2010);
        });
      });
    });
  });

});
