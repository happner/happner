describe('6-websocket-client', function(done) {

  this.timeout(3000);

  var Mesh = require('../')

  var spawn = require('child_process').spawn;
  var expect = require('expect.js');
  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var test_id = Date.now() + '_' + require('shortid').generate();
  var should = require('chai').should();

  after(function(done){
     remote.kill();
     done();
  });

  var testClient;

  before(function(done){

     // spawn remote mesh in another process
    remote = spawn('node', [libFolder + '6-remote-mesh']);

    remote.stdout.on('data', function(data) {

      // console.log(data.toString());

      if (data.toString().match(/READY/)){
        testClient = new Mesh.MeshClient({port:3111});
        testClient.login().then(done);
      }

    });

  });
 
  it('does a set on the datalayer component', function(done) {

     testClient.exchange.test_6.data.set('/6-websocket-client/set', {"val":"set"}, function(e, result){

      if (e) return done(e);

      expect(result.val).to.be("set");

      done();

     });

  });

  it('does a get on the datalayer component', function(done) {

    testClient.exchange.test_6.data.set('/6-websocket-client/get', {"val":"get"}, function(e, result){

      if (e) return done(e);

      expect(result.val).to.be("get");

      testClient.exchange.test_6.data.get('/6-websocket-client/get', {}, function(e, getresult){

        if (e) return done(e);

        console.log('get happened:::', getresult);

        expect(getresult.val).to.be("get");
        done();

      });

     });

  });

  

  it('does a delete on the datalayer component', function(done) {

     testClient.exchange.test_6.data.set('/6-websocket-client/delete', {"val":"delete"}, function(e, result){

      if (e) return done(e);

      expect(result.val).to.be("delete");

      testClient.exchange.test_6.data.get('/6-websocket-client/delete', {}, function(e, getresult){

        if (e) return done(e);

        expect(getresult.val).to.be("delete");
        
        testClient.exchange.test_6.data.remove('/6-websocket-client/delete', {}, function(e, removeresult){

          if (e) return done(e);
          
          console.log('delete happened:::', removeresult);

          testClient.exchange.test_6.data.get('/6-websocket-client/delete', {}, function(e, getremovedresult){

            if (e) return done(e);

            expect(getremovedresult).to.be(null);
            done();

          });

          
        });

      });

     });

  });

  xit('does an on, on the datalayer component', function(done) {

     

  });

  xit('runs a method on a component', function(done) {

     

  });

  xit('runs attaches to an event on a component', function(done) {

     

  });


});

