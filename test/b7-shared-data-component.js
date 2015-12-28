describe('shared data component', function() {

  var should = require('chai').should();
  var Mesh = require('../');
  var  meshInstance;
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
      port:9898,
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
      dataComponent = mesh.exchange.data;
      dataEvents = mesh.event.data;
      done();
    }).catch(done);
  });

  after(function(done) {
    meshInstance.stop(done);
  });

  context('direct use', function() {

    it('can set and get with opts', function(done) {
      dataComponent.set('some/path/one', {key: 'value'}, {}, function(e, result) {
        if (e) return done(e);
        dataComponent.get('some/path/one', {}, function(e, result) {
          if (e) return done(e);
          result.key.should.equal('value');
          done();
        });
      });
    });


    it('can set and get without opts', function(done) {
      dataComponent.set('some/path/two', {key: 'value'}, function(e, result) {
        if (e) return done(e);
        dataComponent.get('some/path/two', function(e, result) {
          if (e) return done(e);
          result.key.should.equal('value');
          done();
        });
      });
    });


    it('can subscribe with opts', function(done) {
      dataComponent.on('/some/path/three', {}, function(data, meta) {
        data.should.eql({key: 'VAL'});
        done();
      }, function(e) {
        if (e) return done(e);
        dataComponent.set('/some/path/three', {key: 'VAL'}, {}, function(e) {
          if (e) return done(e);
        })
      });
    });


    it('can subscribe without opts', function(done) {
      dataComponent.on('/some/path/four', function(data, meta) {
        data.should.eql({key: 'VALUE'});
        done();
      }, function(e) {
        if (e) return done(e);
        dataComponent.set('/some/path/four', {key: 'VALUE'}, function(e) {
          if (e) return done(e);
        })
      });
    });

    it('can unsubscribe', function(done) {
      var received = [];
      dataComponent.on('/some/path/five', function(data, meta) {
        received.push(data);
      }, function(e) {
        if (e) return done(e);
        dataComponent.set('/some/path/five', {key: 1}) // <--------------- 1
        .then(function() {
          return dataComponent.set('/some/path/five', {key: 1}) // <------ 2
        })
        .then(function() {
          return dataComponent.off('/some/path/five') // <------------- unsub
        })
        .then(function() {
          return dataComponent.set('/some/path/five', {key: 1}) // <------- 3
        })
        .then(function() {
          received.length.should.equal(2);
          done();
        })
        .catch(done)
      });
    })

    it('can delete', function(done) {
      dataComponent.set('some/path/six', 6)
      .then(function() {
        return dataComponent.get('some/path/six');
      })
      .then(function(six) {
        six.value.should.equal(6);
        return dataComponent.remove('some/path/six')
      })
      .then(function(res) {
        return dataComponent.get('some/path/six');
      })
      .then(function(res) {
        should.not.exist(res);
        done();
      })
      .catch(done)
    });

    it('can get paths', function(done) {
      require('bluebird').all([
        dataComponent.set('this/one', 1),
        dataComponent.set('this/two', 2),
        dataComponent.set('this/three', 3),
      ])
      .then(function() {
        return dataComponent.getPaths('this/*')
      })
      .then(function(paths) {
        paths.length.should.equal(3);
        done();
      })
      .catch(done);
    })
    
    it('can subscribe to data change with events', function(done) {
      dataEvents.on('/some/path/five', function(data) {
        data.should.property('key','VALUE');
        dataEvents.off('/some/path/five', function(data, meta) {
          done();
        });
      }, function(e) {
        if (e) return done(e);
        dataComponent.set('/some/path/five', {key: 'VALUE'}, function(e) {
          if (e) return done(e);
        })
      });
    })

  });


  context('shared use', function() {

    it('can set from one component and getted from another', function(done) {
      meshInstance.exchange.module1.setSharedData('/my/thing', {'y':'x'})
      .then(function() {
        return meshInstance.exchange.module2.getSharedData('/my/thing')
      })
      .then(function(d) {
        d.y.should.equal('x');
        done();
      })
      .catch(done);
    });

  });

});

