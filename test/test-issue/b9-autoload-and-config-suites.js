var should = require('chai').should();
var Mesh = require('../');
var Promise = require('bluebird');
var fxt = require('fxt');


describe('autoload with happner.js', function () {

  it('might be testable __without__ having actual autoloading modules as (suggestion: dev)dependencies to "see" if they load');

});


describe('config suites with happner.js', function () {

  /***
   TODO: Support minimalist component config
   meshConfig = {
      components: {
        'component-name': 'happner-js-config-name',
        'component-name': function(configName) {return configName + modifications;}
      }
    }

   TODO: Elements inserted into an already running mesh could use $mesh in config factory function
   module.exports.configs = {
      'dynamic-config': function($mesh) {
        $mesh.exchange...
        // not $happn because there is no componentInstance
      }
    }
   ***/

  afterEach(function () {
    // remove mocks
    delete require.cache[require.resolve('fs')];
    // flush previous test's happner.js
    delete require.cache[this.flushHappnerJsPath];
  });

  beforeEach('create mock mesh instance with just the necessary bits', function () {
    this.mockMeshInstance = {
      log: {
        error: function () {
          console.error('ERROR', arguments)
        },
        $$DEBUG: function () { /*console.log('debug', arguments) */
        }
      },
      __supplementSuites: Mesh.prototype.__supplementSuites,
      loadPackagedModules: Mesh.prototype.loadPackagedModules,
    }
  });

  beforeEach('create a fake module called xyz with a happner.js', function () {
    var _this = this;

    var fs = require('fs');
    var originalreadFileSync = fs.readFileSync;
    var originalstatSync = fs.statSync;
    var originallstatSync = fs.lstatSync;

    fs.readFileSync = function (filename) {
      // console.log('readFileSync', filename);
      if (filename.match(/xyz\/package.json/)) return JSON.stringify({
        name: 'xyz',
        main: 'index.js',
      });
      if (filename.match(/xyz\/index.js/)) return fxt(function () {/*
       module.exports = {}
       */
      });
      if (filename.match(/xyz\/happner.js/)) {
        _this.flushHappnerJsPath = filename;
        return _this.happnerJSContent;
      }
      return originalreadFileSync.apply(this, arguments);
    }

    fs.statSync = function (filename) {
      // console.log('statSync', filename);
      if (filename.match(/xyz$/)) return {
        isDirectory: function () {
          return true;
        }
      }
      if (filename.match(/xyz\/index.js/)) return {
        isDirectory: function () {
          return false;
        }
      }
      if (filename.match(/xyz\/happner.js/)) return {
        isDirectory: function () {
          return false;
        }
      }
      return originalstatSync.apply(this, arguments);
    }

    fs.lstatSync = function (filename) {
      // console.log('lstatSync', filename);
      if (filename.match(/lib\/node_modules$/)) return {
        isDirectory: function () {
          return true;
        },
        isSymbolicLink: function () {
          return false;
        }
      }
      if (filename.match(/lib\/node_modules\/xyz$/)) return {
        isDirectory: function () {
          return true;
        },
        isSymbolicLink: function () {
          return false;
        }
      }
      if (filename.match(/lib\/node_modules\/xyz\/index.js$/)) return {
        isDirectory: function () {
          return false;
        },
        isSymbolicLink: function () {
          return false;
        }
      }
      if (filename.match(/xyz\/happner.js/)) return {
        isDirectory: function () {
          return false;
        },
        isSymbolicLink: function () {
          return false;
        }
      }
      return originallstatSync.apply(this, arguments);
    }
  });


  it("can load a singular element from the config suite in the module's happner.js file", function (done) {
    var meshConfig = {
      modules: {},
      components: {
        'xyz': {
          $config: 'suite-name'
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     module.exports = {
     configs: {
     'suite-name': {
     component: {
     name: 'xyz',
     config: {
     magic: 919
     }
     }
     }
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {}
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            magic: 919
          }
        }
      });

      done();
    });
  });


  it("can load an array of elements from the config suite in the module's happner.js file", function (done) {
    var meshConfig = {
      modules: {},
      components: {
        'xyz': {
          $config: 'suite-name'
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     module.exports = {
     configs: {
     'suite-name': [{
     component: {
     name: 'xyz',
     config: {
     magic: 919
     }
     }
     },{
     module: {
     name: 'abc',
     config: {
     the: 'second module'
     }
     },
     component: {
     name: 'abc',
     config: {
     the: 'second component'
     }
     }
     }]
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {},
          'abc': {
            the: 'second module'
          }
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            magic: 919
          },
          'abc': {
            moduleName: 'abc',
            the: 'second component'
          }
        }
      });

      done();
    });
  });


  it('supplements the existing config without replacing or merging', function (done) {
    var meshConfig = {
      modules: {
        'xyz': {
          existing: 'config in module'
        }
      },
      components: {
        'xyz': {
          $config: 'suite-name',
          existing: {
            nested1: 'config in component'
          }
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     module.exports = {
     configs: {
     'suite-name': {
     module: {
     name: 'xyz',
     config: {
     existing: 'm config in happner.js',
     added: 'm config in happner.js',
     }
     },
     component: {
     name: 'xyz',
     config: {
     added: 'c config in happner.js',
     existing: {
     nested1: 'c config in happner.js',
     nested2: 'it does not merge'
     }
     }
     }
     }
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {
            added: 'm config in happner.js',
            existing: 'config in module'
          }
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            added: 'c config in happner.js',
            existing: {
              nested1: 'config in component'
            }
          }
        }
      });

      done();
    });
  });


  it("runs the suite's config factory function (with promise)", function (done) {
    var meshConfig = {
      modules: {},
      components: {
        'xyz': {
          $config: 'configname'
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     var Promise = require('bluebird');
     module.exports = {
     configs: {
     'configname': function(config) {
     return new Promise(function(resolve) {
     resolve({
     component: {
     name: 'xyz',
     config: {
     from: 'factory promise'
     }
     }
     });
     })
     }
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {}
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            from: 'factory promise'
          }
        }
      })

      done();
    });

  });


  it("runs the suite's config factory function (without promise)", function (done) {
    var meshConfig = {
      modules: {},
      components: {
        'xyz': {
          $config: 'configname'
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     module.exports = {
     configs: {
     'configname': function(config) {
     return {
     component: {
     name: 'xyz',
     config: {
     from: 'factory promise'
     }
     }
     }
     }
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {}
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            from: 'factory promise'
          }
        }
      })

      done();
    });
  });


  it('runs the outer config passthrough function with injected config (with promise)', function (done) {
    var meshConfig = {
      modules: {},
      components: {
        'xyz': {
          $configure: function (configName) {
            return new Promise(function (resolve) {
              configName.component.config.added = 'this';
              resolve(configName);
            });
          }
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     module.exports = {
     configs: {
     'config-name': {
     component: {
     name: 'xyz',
     config: {
     from: 'happner.js'
     }
     }
     }
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {}
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            added: 'this',
            from: 'happner.js'
          }
        }
      })

      done();
    });
  });

  it('runs the outer config passthrough function with injected config (without promise)', function (done) {
    var meshConfig = {
      modules: {},
      components: {
        'xyz': {
          $configure: function (configName) {
            configName.component.config.added = 'this';
            return configName;
          }
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     module.exports = {
     configs: {
     'config-name': {
     component: {
     name: 'xyz',
     config: {
     from: 'happner.js'
     }
     }
     }
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {}
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            added: 'this',
            from: 'happner.js'
          }
        }
      })

      done();
    });
  });


  it('runs the factory and the passthrough (both promised)', function (done) {
    var meshConfig = {
      modules: {},
      components: {
        'xyz': {
          $configure: function (configName) {
            return new Promise(function (resolve) {
              configName.component.config.addedByPassthroughPromise = 'this';
              resolve(configName);
            });
          }
        }
      }
    }

    this.happnerJSContent = fxt(function () {/*
     module.exports = {
     configs: {
     'config-name': function() {
     return new Promise(function(resolve) {
     resolve({
     component: {
     config: {
     addedByFactoryPromise: 'this'
     }
     }
     })
     })
     }
     }
     }
     */
    });

    Mesh.prototype._loadComponentSuites.call(this.mockMeshInstance, meshConfig, function (e) {
      if (e) return done(e);

      meshConfig.should.eql({
        modules: {
          'xyz': {}
        },
        components: {
          'xyz': {
            moduleName: 'xyz',
            addedByFactoryPromise: 'this',
            addedByPassthroughPromise: 'this'
          }
        }
      })

      done();
    });
  });

});



