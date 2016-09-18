describe('f2-client-disconnection', function () {

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var expect = require('expect.js');

  var Mesh = require('../');
  var mesh;

  var adminClient = new Mesh.MeshClient({secure: true, port: 8884,
    reconnect:{
      max:500 //we can then wait 10 seconds and should be able to reconnect before the next 10 seconds,
    }
  });

  var test_id = Date.now() + '_' + require('shortid').generate();

  var startMesh = function(middleware, callback){

    Mesh.create({
      name: 'f2-client-disconnection',
      datalayer: {
        secure: true,
        adminPassword: test_id,
        port: 8884,
        transformMiddleware:middleware
      },
      components: {
        'data': {}
      }
    }, function(e, instance){

      if (e) return callback(e);
      mesh = instance;

      callback();

    });
  };

  var packetsIn = [];
  var packetsOut = [];

  before(function (done) {

    var spyConfig = {

      suppressPrint:true,

      log:function(direction, packet){

        if (direction == 'incoming') packetsIn.push(packet);
        if (direction == 'outgoing') packetsOut.push(packet);

      }
    };

    var middleware = [{path:'./transform-message-spy', options:spyConfig}];
    startMesh(middleware, function(e){

      if (e) return done(e);
      done();

    });

  });

  after(function (done) {
    done();
  });

  it('tests the client disconnection with promise login', function (done) {

    this.timeout(10000);

    var finishTest = function(){

      adminClient.disconnect(function(e){

        if (e) return done(e);

        packetsIn = [];

        setTimeout(function(){

          expect(packetsIn.length).to.be(0);
          done();

        }, 5000);
      });
    };

    adminClient
      .login({username: '_ADMIN', password: test_id})
      .then(finishTest)
      .catch(done);


  });

  it('tests the client disconnection with promise', function (done) {

    this.timeout(10000);

    var completeDisconnect = function(e){

      if (e) return done(e);

      packetsIn = [];

      setTimeout(function(){

        expect(packetsIn.length).to.be(0);
        done();

      }, 5000);

    };

    var finishTest = function(){
      adminClient.disconnect().then(completeDisconnect).catch(done);
    };

    adminClient
      .login({username: '_ADMIN', password: test_id})
      .then(finishTest)
      .catch(done);
  });

  require('benchmarket').stop();

});
