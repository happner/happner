var should = require('chai').should();
var Mesh = require('../');

describe('Multiple component initialization', function() {
  var mesh;

  this.timeout(10000);

  before(function(done) {
    var config = {
      name: 'meshName',
      dataLayer: {
        port: 4001,
        authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
        systemSecret: 'mesh',
        log_level: 'info|error|warning'
      },
      modules: {
        one_class: {
          path: __dirname + '/lib/3-one_class-module.js',
          construct: {}
        },
        one_class_with_params: {
          path: __dirname + '/lib/3-one_class_with_params-module.js',
          construct: {
            parameters: [
              {name: 'opt1', value: '1'},
              {name: 'opt2', value: '2'},
            ]
          }
        },
        two_sync: {
          path: __dirname + '/lib/3-two_sync-module.js'
        },
        two_sync_with_params: {
          path: __dirname + '/lib/3-two_sync_with_params-module.js',
          create: {
            name: 'create',
            parameters: [
              {name: 'opt1', value: '1'},
              {name: 'opt2', value: '2'},
            ]
          }
        },
        three_async: {
          path: __dirname + '/lib/3-three_async-module.js',
          create: {
            type: 'async',
            callback: {
              parameters: [ // unnecessary, this is the default
                {parameterType: 'error'},
                {parameterType: 'instance'}
              ]
            }
          }
        },
        three_async_with_params: {
          path: __dirname + '/lib/3-three_async_with_params-module.js',
          create: {
            type: 'async',
            name: 'create',
            parameters: [
              {name: 'x', value: '1'},
              {parameterType: 'callback'},
              {name: 'y', value: '2'}
            ]
          }
        },
        four_object: {
          path: __dirname + '/lib/3-four_object-module.js'
        },
        five_hidden_class: {
          path: __dirname + '/lib/3-five_hidden_class-module.js'
        },
        five_hidden_class_with_params: {
          path: __dirname + '/lib/3-five_hidden_class_with_params-module.js',
          construct: {
            parameters: [
              {name: 'opt1', value: '1'},
              {name: 'opt2', value: '2'},
            ]
          }
        },
        six_nested_class: {
          path: __dirname + '/lib/3-six_nested_class-module.js',
          construct: {
            name: 'Thing'
          }
        },
        six_nested_class_with_params: {
          path: __dirname + '/lib/3-six_nested_class_with_params-module.js',
          construct: {
            name: 'Thing',
            parameters: [
              {value: '1'},
              {value: '2'}
            ]
          }
        }
      },
      components: {
        one_class: {},
        one_class_with_params: {},
        two_sync: {},
        two_sync_with_params: {},
        three_async: {},
        three_async_with_params: {},
        four_object: {},
        five_hidden_class: {},
        five_hidden_class_with_params: {},
        six_nested_class: {},
        six_nested_class_with_params: {}
      }
    }


    mesh = new Mesh();
    mesh.initialize(config, function(err) {

      if (err) return done(err);
      done();
    });

  });

  after(function(done){
       mesh.stop(done);
  });


  it('loads the class ok', function(done) {
    mesh.api.exchange.one_class.method(function(err, res) {
      res.should.equal('RESULT');
      done();
    });
    
  });

  it('loads the class with parameters ok', function(done) {
    mesh.api.exchange.one_class_with_params.method(function(err, res) {
      res.should.equal('1 2')
      done();
    });
    
  });

  it('loads the returned from sync ok', function(done) {
    mesh.api.exchange.two_sync.method(function(err, res) {
      res.should.equal('RESULT');
      done();
    });
  });

  it('loads the returned from sync with params ok', function(done) {
    mesh.api.exchange.two_sync_with_params.method(function(err, res) {
      res.should.equal('1 2')
      done();
    });
  });

  it('loads the async ok', function(done) {
    mesh.api.exchange.three_async.method(function(err, res) {
      res.should.equal('RESULT');
      done();
    });
  });

  it('loads the async with params ok', function(done) {
    mesh.api.exchange.three_async_with_params.method(function(err, res) {
      res.should.equal('1 2')
      done();
    });
  });


  it('loads the object ok', function(done) {
    mesh.api.exchange.four_object.method(function(err, res) {
      res.should.equal('RESULT');
      done();
    });
  });



  it('loads the hidden class ok', function(done) {
    mesh.api.exchange.five_hidden_class.method(function(err, res) {
      res.should.equal('RESULT');
      done();
    });
  });

  it('loads the class with parameters ok', function(done) {
    mesh.api.exchange.five_hidden_class_with_params.method(function(err, res) {
      res.should.equal('1 2')
      done();
    });
  });


  it('loads the nested class ok', function(done) {
    mesh.api.exchange.six_nested_class.method(function(err, res) {
      res.should.equal('RESULT');
      done();
    });
  });

  it('loads the nested class with parameters ok', function(done) {
    mesh.api.exchange.six_nested_class_with_params.method(function(err, res) {
      res.should.equal('1 2')
      done();
    });
  });


});