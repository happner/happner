describe('shared data component', function() {

  var should = require('chai').should();
  var Mesh = require('../../');
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
      _this.mesh = mesh;
      _this.data = mesh.exchange.data;
      done();
    }).catch(done);
  });

  after(function(done) {
    this.mesh.stop(done);
  });

  context('direct use', function() {

    it('can set and get with opts', function(done) {
      var data = this.data;
      data.set('some/path/one', {key: 'value'}, {}, function(e, result) {
        if (e) return done(e);
        data.get('some/path/one', {}, function(e, result) {
          if (e) return done(e);
          result.key.should.equal('value');
          done();
        });
      });
    });


    it('can set and get without opts', function(done) {
      var data = this.data;
      data.set('some/path/two', {key: 'value'}, function(e, result) {
        if (e) return done(e);
        data.get('some/path/two', function(e, result) {
          if (e) return done(e);
          result.key.should.equal('value');
          done();
        });
      });
    });


    it.only('can subscribe with opts', function(done) {
      var data = this.data;
      data.on('/some/path/three', {}, function(data, meta) {
        console.log('did on:::');
        data.should.eql({key: 'VAL'});
        done();
      }, function(e) {
         console.log('did on set?:::', e);
        if (e) return done(e);
        data.set('/some/path/three', {key: 'VAL'}, {}, function(e) {
           console.log('did on set:::');
          if (e) return done(e);
        })
      });
    });


    it('can subscribe without opts', function(done) {
      var data = this.data;
      data.on('/some/path/four', function(data, meta) {
        data.should.eql({key: 'VALUE'});
        done();
      }, function(e) {
        if (e) return done(e);
        data.set('/some/path/four', {key: 'VALUE'}, function(e) {
          if (e) return done(e);
        })
      });
    });

    it('can unsubscribe', function(done) {
      var received = [];
      var data = this.data;
      data.on('/some/path/five', function(data, meta) {
        received.push(data);
      }, function(e) {
        if (e) return done(e);
        data.set('/some/path/five', {key: 1}) // <--------------- 1
        .then(function() {
          return data.set('/some/path/five', {key: 1}) // <------ 2
        })
        .then(function() {
          return data.off('/some/path/five') // <------------- unsub
        })
        .then(function() {
          return data.set('/some/path/five', {key: 1}) // <------- 3
        })
        .then(function() {
          received.length.should.equal(2);
          done();
        })
        .catch(done)
      });
    })

    it('can delete', function(done) {
      var data = this.data;
      data.set('some/path/six', 6)
      .then(function() {
        return data.get('some/path/six');
      })
      .then(function(six) {
        six.value.should.equal(6);
        return data.remove('some/path/six')
      })
      .then(function(res) {
        return data.get('some/path/six');
      })
      .then(function(res) {
        should.not.exist(res);
        done();
      })
      .catch(done)
    });

    it('can get paths', function(done) {
      var data = this.data;
      require('bluebird').all([
        data.set('this/one', 1),
        data.set('this/two', 2),
        data.set('this/three', 3),
      ])
      .then(function() {
        return data.getPaths('this/*')
      })
      .then(function(paths) {
        paths.length.should.equal(3);
        done();
      })
      .catch(done);
    })

  });


  context('shared use', function() {

    it('can set from one component and getted from another', function(done) {
      var _this = this;
      this.mesh.exchange.module1.setSharedData('/my/thing', {'y':'x'})
      .then(function() {
        return _this.mesh.exchange.module2.getSharedData('/my/thing')
      })
      .then(function(d) {
        d.y.should.equal('x');
        done();
      })
      .catch(done);
    });

  });

});

