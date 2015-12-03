module.exports = DataComponent7;

var DONE = false;

function DataComponent7() {}

DataComponent7.prototype.storeData = function($happn, path, data, callback){
  try{

   $happn.data.set(path, data, {}, function(e, response){

    return callback(e, response)

   });

  }catch(e){
    callback(e);
  }
}

// DataComponent7.prototype.method1 = function($happn, options, callback) {
//   options.methodName = 'method1';
//    console.log('ran method1...');
//   callback(null, options); 
// }

// DataComponent7.prototype.method2 = function($happn, options, callback) {
//   options.methodName = 'method2';
//   console.log('ran method2...');
//   callback(null, options);
// }

// DataComponent7.prototype.method3 = function($happn, options, callback) {
//   options.methodName = 'method3';
//    console.log('ran method3...');
//   callback(null, options);
// }

// DataComponent7.prototype.fireEvent = function($happn, eventName, callback) {
//   $happn.emit(eventName, eventName);
//   callback(null, eventName + ' emitted');
// }

if (global.TESTING_7) return; // When 'requiring' the module above,
                              // don't run the tests below
                             //............. 

describe('test persisted config, check memory and persisted data stores', function() {

  var Mesh = require('../');
  var test_id = Date.now() + '_' + require('shortid').generate();
  var should = require('chai').should();
  var fs = require('fs-extra');
  var dbFileName = './temp/' + test_id + '.nedb';

  global.TESTING_7 = true;
  this.timeout(3000);

  var config = {
    name:"testPersistedData",
    datalayer: {
      persist:true,
      defaultRoute:"persist", //mem anyhow
      filename:dbFileName,
      log_level: 'info'
    },
    modules: {
      'DataComponent7': {
        path: __filename
      }
    },
    components: {
      'DataComponent7': {
        moduleName: 'DataComponent7',
        data:{
          routes:{
            "things/*":"persist",
            "stuff/*":"mem"
          }
        },
        schema: {
          exclusive: false,
          methods: {}
        }
      },
      'data': {
        data:{
          routes:{
            "things/*":"persist",
            "stuff/*":"mem"
          }
        }
      }
    }
  };

  after(function(done){
    var _this = this;
    fs.unlink(dbFileName, function(e){
      if (e) return callback(e);
      _this.mesh.stop(done);
    });
  });

  before(function(done){
    var _this = this;
    Mesh.create(config).then(function(mesh) {
      _this.mesh = mesh;
      _this.datastores = mesh._mesh.datalayer.server.services.data.datastores;
      done();
    }).catch(done);
  });

  it('tests storing data routed to mem', function(done) {

    var _this = this;
    var called = false;
    var originalFn = this.datastores.mem.db.update;
    this.datastores.mem.db.update = function() {
      called = true;
      originalFn.apply(this, arguments);
    }

    try{

      this.mesh.exchange.DataComponent7.storeData('stuff/this/thing', {'test':'data'}, function(e, response){

        if (e) return done(e);

        try {
          response._meta.path.should.equal('/_data/DataComponent7/stuff/this/thing');
          called.should.equal(true);
        } catch(e) {
          return done(e);
        }finally {
          _this.datastores.mem.update = originalFn;
        }

        done();

      });

    }catch(e){
      done(e);
    } finally {
      this.datastores.mem.update = originalFn;
    }
    
  });

  it('tests storing data routed to persist', function(done) {

    var _this = this;
    var called = false;
    var originalFn = this.datastores.persist.db.update;
    this.datastores.persist.db.update = function() {
      called = true;
      originalFn.apply(this, arguments);
    }

    try{

      this.mesh.exchange.DataComponent7.storeData('things/with/roman', {'test':'xata'}, function(e, response){

        if (e) return done(e);

        try {
          response._meta.path.should.equal('/_data/DataComponent7/things/with/roman');
          called.should.equal(true);
        } catch(e) {
          return done(e);
        }finally {
          _this.datastores.persist.update = originalFn;
        }

        done();

      });

    }catch(e){
      done(e);
    } finally {
      this.datastores.persist.update = originalFn;
    }

  })

  it('tests storing data routed to mem, in the data component', function(done) {

    var _this = this;
    var called = false;
    var originalFn = this.datastores.mem.db.update;
    this.datastores.mem.db.update = function() {
      called = true;
      originalFn.apply(this, arguments);
    }

    try{

      this.mesh.exchange.data.set('stuff/this/thing', {'test':'data'}, function(e, response){

        if (e) return done(e);

        try {
          response._meta.path.should.equal('/_data/data/stuff/this/thing');
          called.should.equal(true);
        } catch(e) {
          return done(e);
        }finally {
          _this.datastores.mem.update = originalFn;
        }

        done();

      });

    }catch(e){
      done(e);
    } finally {
      this.datastores.mem.update = originalFn;
    }
    
  });

  it('tests storing data routed to persist, in the data component', function(done) {

    var _this = this;
    var called = false;
    var originalFn = this.datastores.persist.db.update;
    this.datastores.persist.db.update = function() {
      called = true;
      originalFn.apply(this, arguments);
    }

    try{

      this.mesh.exchange.data.set('things/with/roman', {'test':'xata'}, function(e, response){

        if (e) return done(e);

        try {
          response._meta.path.should.equal('/_data/data/things/with/roman');
          called.should.equal(true);
        } catch(e) {
          return done(e);
        }finally {
          _this.datastores.persist.update = originalFn;
        }

        done();

      });

    }catch(e){
      done(e);
    } finally {
      this.datastores.persist.update = originalFn;
    }

  })

});
