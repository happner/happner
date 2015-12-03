describe('start and stop a persisted mesh', function() {

  var Mesh = require('../');
  var test_id = Date.now() + '_' + require('shortid').generate();
  var should = require('chai').should();
  var fs = require('fs-extra');
  var dbFileName = './temp/' + test_id + '.nedb';
   var expect = require('expect.js');

  global.TESTING_7 = true;
  this.timeout(3000);

  var config = {
    secure:true,
    datalayer: {
      persist:true,
      filename:dbFileName,
      log_level: 'info'
    },
    components: {
      'data': {}
    }
  };

  var unpersistedConfig = {
    port:8888,
    secure:true,
    datalayer: {
      persist:false
    }
  };

  after(function(done){
    var _this = this;
    fs.unlink(dbFileName, function(e){
      if (e) return callback(e);
      _this.mesh.stop()
      .then(function(){
        _this.unpersistedMesh.stop(done);
      })
      .catch(done)
    });
  });

  var meshName;
  var meshPublicKey;
  var unpersistedMeshName;
  var unpersistedMeshPublicKey;

  before(function(done){
    var _this = this;
    Mesh.create(config).then(function(mesh) {

      _this.mesh = mesh;
      meshName = mesh._mesh.config.name;
      meshPublicKey = mesh._mesh.datalayer.server.services.security._keyPair.publicKey;

      Mesh.create(unpersistedConfig).then(function(unpersistedMesh) {
        _this.unpersistedMesh = unpersistedMesh;
        unpersistedMeshName = unpersistedMesh._mesh.config.name;
        unpersistedMeshPublicKey = unpersistedMesh._mesh.datalayer.server.services.security._keyPair.publicKey;
        
        console.log('names:::', meshName, unpersistedMeshName);

        done();
      }).catch(done);
    }).catch(done);
  });

  it('restarts the mesh, ensures the keypair', function(done) {

     var _this = this;

     _this.mesh.stop(function(e){
      if (e) return done(e);

       Mesh.create(config)

       .then(function(mesh) {

        _this.mesh = mesh;

        expect(mesh._mesh.datalayer.server.services.security._keyPair.publicKey.toString()).to.be(meshPublicKey.toString());
        expect(mesh._mesh.datalayer.server.services.security._keyPair.publicKey).to.not.be(null);
        expect(mesh._mesh.datalayer.server.services.security._keyPair.publicKey).to.not.be(undefined);

        done();

       })

       .catch(done);


     });
    
  });

  it('restarts the unpersisted mesh, ensures the keypair is different', function(done) {

     var _this = this;

     _this.unpersistedMesh.stop(function(e){
      if (e) return done(e);

       Mesh.create(unpersistedConfig)

       .then(function(unpersistedMesh) {

        _this.unpersistedMesh = unpersistedMesh;

        expect(unpersistedMesh._mesh.datalayer.server.services.security._keyPair.publicKey.toString()).to.not.be(unpersistedMeshPublicKey.toString());
        expect(unpersistedMesh._mesh.datalayer.server.services.security._keyPair.publicKey).to.not.be(null);
        expect(unpersistedMesh._mesh.datalayer.server.services.security._keyPair.publicKey).to.not.be(undefined);
        expect(unpersistedMeshPublicKey).to.not.be(null);
        expect(unpersistedMeshPublicKey).to.not.be(undefined);


        done();

       })

       .catch(done);


     });
    
  });

  it('restarts the mesh, ensures the name', function(done) {

     var _this = this;

     _this.mesh.stop(function(e){
      if (e) return done(e);

      //so we need to check that we are getting the name from the file
      config.name = undefined;

       Mesh.create(config)

       .then(function(mesh) {

        _this.mesh = mesh;

        expect(mesh._mesh.config.name).to.be(meshName);
        expect(mesh._mesh.config.name).to.not.be(null);
        expect(mesh._mesh.config.name).to.not.be(undefined);

        done();

       })

       .catch(done);


     });
    
  });

  it('restarts the unpersisted mesh, ensures the name is different', function(done) {

     var _this = this;

     _this.unpersistedMesh.stop(function(e){
      if (e) return done(e);

      unpersistedConfig.name = undefined;

       Mesh.create(unpersistedConfig)

       .then(function(unpersistedMesh) {

        _this.unpersistedMesh = unpersistedMesh;

        expect(unpersistedMesh._mesh.config.name).to.not.be(unpersistedMeshName);
        expect(unpersistedMesh._mesh.config.name).to.not.be(null);
        expect(unpersistedMesh._mesh.config.name).to.not.be(undefined);

        expect(unpersistedMeshName).to.not.be(null);
        expect(unpersistedMeshName).to.not.be(undefined);

        done();

       })

       .catch(done);


     });
    
  });


});
