/**
 * Created by nomilous on 2016/07/28.
 */

var path = require('path');
var filename = path.basename(__filename);
var should = require('chai').should();
var Happner = require('../');

describe(filename, function() {

  var mesh;

  before('start mesh', function(done) {
    Happner.create({
      modules: {
        'testComponent': {
          instance: {
            unconfiguredMethod: function(optional, callback) {
              if (typeof optional === 'function') {
                callback = optional;
                optional = {
                  some: 'default option'
                }
              }
              callback(null, optional);
            },
            configuredmethod: function(optional, callback) {
              if (typeof optional === 'function') {
                callback = optional;
                optional = {
                  some: 'default option'
                }
              }
              callback(null, optional);
            }
          }
        }
      },
      components: {
        'testComponent': {
          schema: {
            methods: {
              // 'unconfiguredMethod': {},
              'configuredmethod': {
                type: 'async',
                parameters: [
                  {name: 'optional', required: false}, // <-------------- optional argument
                  {name: 'callback', required: true, type: 'callback'}
                ],
                callback: {
                  parameters: [
                    {name: 'error', type: 'error'},
                    {name: 'echoOptional'}
                  ]
                }
              }
            }
          }
        }
      }
    })
      .then(function(_mesh) {
        mesh = _mesh;
        done();
      })
      .catch(done);
  });

  after('stop mesh', function(done) {
    if (!mesh) return done();
    mesh.stop({reconnect: false}, done);
  });


  context('using callback', function() {

    //
    // failing test! remove "x"
    //

    xit('supports call to configuredMethod WITHOUT optional argument', function(done) {
      // this times out...
      this.timeout(300);
      mesh.exchange.testComponent.configuredmethod(function(error, echoOptional) {
        try {
          echoOptional.should.eql({some: 'default option'});
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('supports call to configuredMethod WITH optional argument', function(done) {
      this.timeout(300);
      mesh.exchange.testComponent.configuredmethod({some: 'option'}, function(error, echoOptional) {
        try {
          echoOptional.should.eql({some: 'option'});
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('supports call to unconfiguredMethod WITHOUT optional argument', function(done) {
      this.timeout(300);
      mesh.exchange.testComponent.unconfiguredMethod(function(error, echoOptional) {
        try {
          echoOptional.should.eql({some: 'default option'});
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('supports call to unconfiguredMethod WITH optional argument', function(done) {
      this.timeout(300);
      mesh.exchange.testComponent.unconfiguredMethod({some: 'option'}, function(error, echoOptional) {
        try {
          echoOptional.should.eql({some: 'option'});
          done();
        } catch (e) {
          done(e);
        }
      });
    });

  });

  context('using promise', function() {

    //
    // failing test! remove "x"
    //

    xit('supports call to configuredMethod WITHOUT optional argument', function(done) {
      this.timeout(300);
      mesh.exchange.testComponent.configuredmethod()
        .then(function(echoOptional) {
          echoOptional.should.eql({some: 'default option'});
        })
        .then(done)
        .catch(done);
    });

    it('supports call to configuredMethod WITH optional argument', function(done) {
      this.timeout(300);
      mesh.exchange.testComponent.configuredmethod({some: 'option'})
        .then(function(echoOptional) {
          echoOptional.should.eql({some: 'option'});
        })
        .then(done)
        .catch(done);
    });

    it('supports call to unconfiguredMethod WITHOUT optional argument', function(done) {
      this.timeout(300);
      mesh.exchange.testComponent.unconfiguredMethod()
        .then(function(echoOptional) {
          echoOptional.should.eql({some: 'default option'});
        })
        .then(done)
        .catch(done);
    });

    it('supports call to unconfiguredMethod WITH optional argument', function(done) {
      this.timeout(300);
      mesh.exchange.testComponent.unconfiguredMethod({some: 'option'})
        .then(function(echoOptional) {
          echoOptional.should.eql({some: 'option'});
        })
        .then(done)
        .catch(done);
    });

  });

});
