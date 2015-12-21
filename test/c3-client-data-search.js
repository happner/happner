describe('c3-client-data-search', function() {

  var should = require('chai').should();
  var Mesh = require('../');
  var meshInstance;
  var meshClientInstance;
  var dataEvents;
  var config;

  var TestModule1 = {
    setSharedData: function($happn, path, data, callback) {
      $happn.exchange.data.set(path, data, callback);
    }
  }

  var TestModule2 = {
    getSharedData: function($happn, path, callback) {
      $happn.exchange.data.get(path, callback);
    }
  }

  before(function(done) {
    var _this = this;
    Mesh.create(config = {
      modules: {
        'module1': {
          instance: TestModule1
        },
        'module2': {
          instance: TestModule2
        }
      },

      components: {
        'data': {},
        'module1': {},
        'module2': {},
      }


    }).then(function(mesh) {
      meshInstance = mesh;
      meshClientInstance = new Mesh.MeshClient();
      meshClientInstance.login().then(done);
    }).catch(done);
  });

  after(function(done) {
    meshInstance.stop(done);
  });

  context('direct use', function() {

    it('can get using criteria', function(done) {

      meshInstance.exchange.data.set('movie/war',{name : 'crimson tide', genre : 'war'},
      function(e, result){

        if (e) return done(e);

        var options = {
          fields: {"data.name": 1},
          sort: {"data.name": 1},
          limit: 1
        }

        var criteria = {
          "data.name" : "crimson tide"
        }

        meshInstance.exchange.data.get('movie/*',{criteria: criteria, options: options},
        function(e, result){
          if(e) return done(e);
         
          console.log('crimson:::', result);

          result.length.should.eql(1);
          done();

        });

      });

    });

  });

  context('client use', function() {

    it('can get using criteria', function(done) {

      meshClientInstance.exchange.data.set('movie/comedy',{name : 'nkandla', genre : 'comedy'},
      function(e, result){

        if (e) return done(e);

        var options = {
          //fields: {"data.name": 1},
          sort: {"data.name": 1},
          limit: 1
        }

        var criteria = {
          "data.genre" : "comedy"
        }

        meshClientInstance.exchange.data.get('movie/*',{criteria: criteria, options: options},
        function(e, result){
          if(e) return done(e);
         
          result.length.should.eql(1);
           result[0].name.should.eql('nkandla');
          done();

        });


      });

    });

  });

  context('client data use', function() {

    it('can get using criteria', function(done) {

      meshClientInstance.data.set('movie/drama',{name : 'nkandla2', genre : 'drama'},
      function(e, result){

        if (e) return done(e);

        var options = {
          fields: {"data.name":1},
          sort: {"data.name": 1},
          limit: 1
        }

        var criteria = {
          "data.genre" : "drama"
        }

        meshClientInstance.data.get('movie/*',{criteria: criteria, options: options},
        function(e, result){
          if(e) return done(e);
         
          console.log('comedy result:::', result);

          result.length.should.eql(1);
          result[0].name.should.eql('nkandla2');

          done();

        });

      });

    });

  });

});

