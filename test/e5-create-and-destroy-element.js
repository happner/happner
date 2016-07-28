/**
 * Created by nomilous on 2016/07/28.
 */

var path = require('path');
var filename = path.basename(__filename);
var should = require('chai').should();
var Happner = require('../');

describe(filename, function () {

  var mesh;

  before(function (done) {
    Happner.create({})
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
            method: function(callback) {
              callback(null, 'newComponent OK');
            }
          }
        }
      },
      component: {
        name: 'newComponent',
        config: {}
      }
    })

      .then(function () {
        // use the new component
        return mesh.exchange.newComponent.method();
      })

      .then(function (result) {
        result.should.equal('newComponent OK');
      })

      .then(done)
      .catch(done);
  });


  xit('can add a new component to the mesh (from another component via _mesh)', function (done) {


  });

  xit('can remove components from the mesh', function () {


  });

});
