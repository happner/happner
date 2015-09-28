module.exports = function() {

  return; // 

  var mesh1;

  before(function(done, Mesh) {
    this.timeout(2000);

    Mesh.create({
      name: 'testnode',
      port: 54321,
      modules: {
        test: {
          instance: {
            func: function(arg, callback) {
              callback(null, ++arg);
            }
          }
        }
      },
      components: {
        test: {}
      }
    }).then(function(mesh) {

              // injectable as 'test' into tests
             //
      mock('test', mesh.exchange.test);
      mesh1 = mesh;
      done();

    }).catch(done);
  });

  after(function() {
    console.log('XXX');
    
    // console.log(mesh);
    // mesh.stop().then(done).catch(done);
  });



  context('initialization', function() {

    it('pending');

  });




  context('shutdown', function() {

    it('pending');

  });




  context('usage', function() {


    context('exchange to local', function() {


      it('supports promises', function(done, test, should) {

        test.func(918).then(function(r) {

          r.should.equal(919);
          done();

        }).catch(done);

      });

      it('supports callbacks', function(done, test, should) {

        test.func(-1, function(e, r) {
          if (e) return done(e);
          r.should.equal(0);
          done();
        })

      });
    });



    context('exchange to remote', function() {

      var mesh2;

      before(function(done, Mesh) {
        this.timeout(2000);
        Mesh.create({

          port: 12346,
          name: 'doesntmatter',
          endpoints: {
            'testnode': 54321
          }

        }).then(function(mesh) {

          mesh2 = mesh;
          mock('remoteNode', mesh.exchange.testnode);
          done();

        }).catch(done);
      });

      afterAll(function(done) {
        console.log('XXXXXXX');
        done()

      })


      it('supports promises', function(done, remoteNode, should) {

        // BUG:
        //
        // [ WARN] - 134ms doesntmatter (Mesh) endpoint 'testnode' returned description for 'doesntmatter'
        //
        // - The second mesh-node (in the same process) registers it's description and it
        //   seems to replace the description the first mesh-node previously registered.
        //
        // - Does happn properly support multiple 'server' instances in the same process.
        //

        remoteNode.test.func(99).then(function(r) {

          r.should.equal(100);
          done();

        }).catch(done);
      });

      xit('supports callbacks');

    });

  });

}
