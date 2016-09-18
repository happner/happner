describe('f2-client-disconnection', function () {

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var expect = require('expect.js');

  var Mesh = require('../');
  var mesh;

  var adminClient = new Mesh.MeshClient({secure: true, port: 8884,
    reconnect:{
      max:2000 //we can then wait 10 seconds and should be able to reconnect before the next 10 seconds,
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

  before(function (done) {
    done();
  });

  after(function (done) {
    done();
  });

  it('tests the client disconnection with promise login', function (done) {

    this.timeout(10000);

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

    startMesh(middleware, function(e){
      if (e) return done(e);

      adminClient
        .login({username: '_ADMIN', password: test_id})
        .then(finishTest())
        .catch(done);
    });

    var finishTest = function(){

      adminClient.disconnect(function(e){

        if (e) return done(e);
        packetsIn = [];

        setTimeout(function(){

          console.log('packetsIn:::', packetsIn);
          done();

        }, 5000);

      });
    };
  });

  it.only('tests the client disconnection with callback login', function (done) {
    this.timeout(10000);

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

    startMesh(middleware, function(e){
      if (e) return done(e);

      adminClient
        .login({username: '_ADMIN', password: test_id}, function(e){

          if (e) return done(e);
          finishTest();

        });
    });

    var finishTest = function(){

      adminClient.disconnect(function(e){

        if (e) return done(e);
        packetsIn = [];

        setTimeout(function(){

          console.log('packetsIn:::', packetsIn);
          done();

        }, 5000);

      });
    };
  });

  require('benchmarket').stop();

});
