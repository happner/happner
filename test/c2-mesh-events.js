// describe('c2-mesh-events', function() {

//   var should = require('chai').should();
//   var Mesh = require('../');
//   var  meshInstance;
//   var dataEvents;
//   var config;

//   var TestModule1 = {
//     setSharedData: function($happn, path, data, callback) {
//       $happn.exchange.data.set(path, data, callback);
//     }
//   }

//   var TestModule2 = {
//     getSharedData: function($happn, path, callback) {
//       $happn.exchange.data.get(path, callback);
//     }
//   }

//   before(function(done) {
//     var _this = this;
//     Mesh.create(config = {
//       port:9898,
//       modules: {
//         'module1': {
//           instance: TestModule1
//         },
//         'module2': {
//           instance: TestModule2
//         }
//       },

//       components: {
//         'data': {},
//         'module1': {},
//         'module2': {},
//       }


//     }).then(function(mesh) {
//       meshInstance = mesh;
//       dataComponent = mesh.exchange.data;
//       dataEvents = mesh.event.data;
//       done();
//     }).catch(done);
//   });

//   after(function(done) {
//     meshInstance.stop(done);
//   });

//   context('direct use', function() {

//     it('can set and get with opts', function(done) {
//       dataComponent.set('some/path/one', {key: 'value'}, {}, function(e, result) {
//         if (e) return done(e);
//         dataComponent.get('some/path/one', {}, function(e, result) {
//           if (e) return done(e);
//           result.key.should.equal('value');
//           done();
//         });
//       });
//     });

//   });

//    context('client use', function() {

//     it('can set and get with opts', function(done) {
//       dataComponent.set('some/path/one', {key: 'value'}, {}, function(e, result) {
//         if (e) return done(e);
//         dataComponent.get('some/path/one', {}, function(e, result) {
//           if (e) return done(e);
//           result.key.should.equal('value');
//           done();
//         });
//       });
//     });

//   });

// });

