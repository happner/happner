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


  xit('can remove components from the mesh including web methods', function () {


  });

  it('emits description change on adding component');

  it('emits description change on destroying component');

  it('clears messenger subscriptions on remove component');

  require('benchmarket').stop();

});
