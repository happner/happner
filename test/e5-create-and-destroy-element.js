/**
 * Created by nomilous on 2016/07/28.
 */

var path = require('path');
var filename = path.basename(__filename);
var should = require('chai').should();
var Happner = require('../');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

describe(filename, function () {

  require('benchmarket').start();
  after(require('benchmarket').store());

  var mesh;

  before(function (done) {
    Happner.create({
        modules: {
          'factory': { // component that adds another component via _mesh
            instance: {
              createComponent: function ($happn, name, callback) {
                $happn._mesh._createElement({
                  module: {
                    name: name,
                    config: {
                      instance: {
                        method: function (callback) {
                          callback(null, name + ' OK');
                        }
                      }
                    }
                  },
                  component: {
                    name: name,
                    config: {}
                  }
                }, callback);
              }
            }
          }
        },
        components: {
          'factory': {
            accessLevel: 'mesh'
          }
        }
      })
      .then(function (_mesh) {
        mesh = _mesh;
        done();
      })
      .catch(done);
  });

  after(function (done) {
    if (!mesh) return done();
    mesh.stop({reconnect: false}, done);
  });


  it('can add a component to the mesh', function (done) {
    mesh._createElement({
        module: {
          name: 'newComponent',
          config: {
            instance: {
              method: function (callback) {
                callback(null, 'newComponent OK');
              },
              page: function (req, res) {
                res.end('WEB PAGE');
              }
            }
          }
        },
        component: {
          name: 'newComponent',
          config: {
            web: {
              routes: {
                page: 'page'
              }
            }
          }
        }
      })

      .then(function () {
        // use the new component's method
        return mesh.exchange.newComponent.method();
      })

      .then(function (result) {
        result.should.equal('newComponent OK');
      })

      .then(function () {
        // use new component's web method
        return request('http://localhost:55000/newComponent/page');
      })

      .then(function (result) {
        result[1].should.equal('WEB PAGE');
      })

      .then(done)
      .catch(done);
  });


  it('can add a new component to the mesh (from another component using _mesh)', function (done) {
    mesh.exchange.factory.createComponent('componentName')

      .then(function () {
        // use the new component
        return mesh.exchange.componentName.method();
      })

      .then(function (result) {
        result.should.equal('componentName OK');
      })

      .then(done)
      .catch(done);
  });


  it('can remove components from the mesh including web methods', function (done) {
    mesh._createElement({
        module: {
          name: 'anotherComponent',
          config: {
            instance: {
              method: function (callback) {
                callback(null, 'anotherComponent OK');
              },
              page: function (req, res) {
                res.end('WEB PAGE');
              }
            }
          }
        },
        component: {
          name: 'anotherComponent',
          config: {
            web: {
              routes: {
                page: 'page'
              }
            }
          }
        }
      })

      .then(function () {
        return mesh.exchange.anotherComponent.method()
      })

      .then(function (result) {
        result.should.equal('anotherComponent OK');
      })

      .then(function () {
        return request('http://localhost:55000/anotherComponent/page')
      })

      .then(function (result) {
        result[1].should.equal('WEB PAGE');
      })

      // now remove the component
      .then(function () {
        return mesh._destroyElement('anotherComponent')
      })

      // exchange reference is gone
      .then(function (result) {
        should.not.exist(mesh.exchange.anotherComponent);
      })

      // web route is gone
      .then(function () {
        return request('http://localhost:55000/anotherComponent/page');
      })

      .then(function (result) {
        result[1].should.equal('Cannot GET /anotherComponent/page\n');
      })

      .then(done)
      .catch(done)
  });

  it('emits description change on adding component', function (done) {
    mesh._mesh.data.on('/mesh/schema/description', {count: 1}, function (data, meta) {
      try {
        data.components.component1.methods.should.eql({
          method: {
            parameters: [
              {name: 'callback'}
            ]
          }
        });
        done();
      } catch (e) {
        done(e);
      }
    });

    mesh._createElement({
      module: {
        name: 'component1',
        config: {
          instance: {
            method: function (callback) {
              callback();
            }
          }
        }
      },
      component: {
        name: 'component1',
        config: {}
      }
    }).catch(done);
  });

  it('emits description change on destroying component', function (done) {
    mesh._createElement({
        module: {
          name: 'component2',
          config: {
            instance: {
              method: function (callback) {
                callback();
              }
            }
          }
        },
        component: {
          name: 'component2',
          config: {}
        }
      })

      .then(function () {
        return mesh._mesh.data.on('/mesh/schema/description', {count: 1}, function (data, meta) {
          should.not.exist(data.components.component2);
          done();
        });
      })

      .then(function () {
        return mesh._destroyElement('component2');
      })

      .catch(done);
  });

  it('informs mesh client on create component', function (done) {
    var client = new Happner.MeshClient();
    client.login()

      .then(function () {
        return client.once('components/created', function (array) {
          try {
            array[0].description.name.should.equal('component3');
            done();
          } catch (e) {
            done(e);
          }
        });
      })

      .then(function () {
        return mesh._createElement({
          module: {
            name: 'component3',
            config: {
              instance: {
                method: function (callback) {
                  callback();
                }
              }
            }
          },
          component: {
            name: 'component3',
            config: {}
          }
        })
      })

      .catch(done);
  });

  it('informs mesh client on destroy component', function (done) {
    var client = new Happner.MeshClient();
    return mesh._createElement({
        module: {
          name: 'component4',
          config: {
            instance: {
              method: function (callback) {
                callback();
              }
            }
          }
        },
        component: {
          name: 'component4',
          config: {}
        }
      })

      .then(function () {
        return client.login();
      })

      .then(function () {
        return client.once('components/destroyed', function (array) {
          try {
            array[0].description.name.should.equal('component4');
            done();
          } catch (e) {
            done(e);
          }
        });
      })

      .then(function () {
        return mesh._destroyElement('component4');
      })

      .catch(done);
  });

  xit('what happens to reference still held', function (done) {
    var keepRefToDeletedComponent;
    return mesh._createElement({
        module: {
          name: 'component5',
          config: {
            instance: {
              method: function (callback) {
                callback();
              }
            }
          }
        },
        component: {
          name: 'component5',
          config: {}
        }
      })

      .then(function () {
        keepRefToDeletedComponent = mesh.exchange.component5;
      })

      .then(function () {
        return mesh._destroyElement('component5');
      })

      .then(function () {
        console.log(keepRefToDeletedComponent);
        return keepRefToDeletedComponent.method();
      })

      .then(function (result) {
        console.log(result);
      })

      .then(done)
      .catch(done);
  });

  require('benchmarket').stop();

});
