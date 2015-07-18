var promise = require('when').promise;
var parallel = require('when/parallel');
var should = require('chai').should();

describe('mesh awareness via $happn', function() {

  require('./lib/0-hooks')();

  it('provides correct context via dynamic property', function(done) {

    var meshNo = [1,2,3,4,5,6,7,8,9];
    var componentNo = [1,2,3,4,5,6,7,8,9];
    // var meshes = [];
    var Mesh = this.Mesh;
    var configs = {};
    var all;

    parallel(
      meshNo.map(
        function(i) {
          return function() {
            return promise(
              function(resolve, reject) {
                var mesh = Mesh();
                // meshes.push(mesh = Mesh());

                var components = {};
                componentNo.forEach(
                  function(j) {
                    components['component' + j] = {
                      moduleName: 'module',
                      startMethod: 'start',
                      stopMethod: 'stop',
                      configThing: {
                        mesh: i,
                        component: j
                      }
                    }
                  }
                );

                mesh.initialize({
                  name: 'mesh' + i,
                  dataLayer: {
                    port: 3000 + i,
                    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
                    systemSecret: 'mesh',
                    log_level: 'info|error|warning'
                  },
                  modules: {
                    'module': {
                      path: __dirname + '/lib/11-module.js'
                    }
                  },
                  components: components

                }, function(err) {
                  if (err) return reject(err);
                  mesh.start(function(err) {
                    if (err) return reject(err);
                    resolve(mesh);
                  })
                });
              }
            )
          }
        }
      )
    
    //
    //
    //
    //
    // TODO:    $happn in start and stop
    //
    //
    //
    //

    ).then(function(meshes) {
      all = meshes;
      return parallel( // parallel all meshes
        meshes.map(
          function(mesh) {
            return function() {
              return parallel(  // parallel all componentN's on each mesh
                componentNo.map(
                  function(j) {
                    return function() {
                      return promise(
                        function(resolve, reject) {
                          mesh.api.exchange['component' + j].getThingFromConfig(
                            function(err, config) {
                              if (err) return reject(err);
                              resolve([mesh.config.name + '.component' + j, config]);
                            }
                          )
                        }
                      )
                    }
                  }
                )
              )
            }
          }
        )
      )
    }).then(function(results) {
      
      results.forEach(function(meshResult) {
        meshResult.forEach(function(componentResult) {
          configs[componentResult[0]] = componentResult[1];
        })
      });

    //   return parallel(
    //     all.map(
    //       function(mesh) {
    //         return function() {
    //           return promise(
    //             function(resolve, reject) {

    //               resolve();
    //               mesh.stop();
                  
    //               // function() {
                  
    //               //   console.log('stopped')
    //               // })
    //             }
    //           )
    //         }
    //       }
    //     )
    //   )

    // }).then(function() {

      return promise(function(resolve, reject) {

        configs.should.eql({
          'mesh1.component1': { mesh: 1, component: 1 },
          'mesh1.component2': { mesh: 1, component: 2 },
          'mesh1.component3': { mesh: 1, component: 3 },
          'mesh1.component4': { mesh: 1, component: 4 },
          'mesh1.component5': { mesh: 1, component: 5 },
          'mesh1.component6': { mesh: 1, component: 6 },
          'mesh1.component7': { mesh: 1, component: 7 },
          'mesh1.component8': { mesh: 1, component: 8 },
          'mesh1.component9': { mesh: 1, component: 9 },
          'mesh2.component1': { mesh: 2, component: 1 },
          'mesh2.component2': { mesh: 2, component: 2 },
          'mesh2.component3': { mesh: 2, component: 3 },
          'mesh2.component4': { mesh: 2, component: 4 },
          'mesh2.component5': { mesh: 2, component: 5 },
          'mesh2.component6': { mesh: 2, component: 6 },
          'mesh2.component7': { mesh: 2, component: 7 },
          'mesh2.component8': { mesh: 2, component: 8 },
          'mesh2.component9': { mesh: 2, component: 9 },
          'mesh3.component1': { mesh: 3, component: 1 },
          'mesh3.component2': { mesh: 3, component: 2 },
          'mesh3.component3': { mesh: 3, component: 3 },
          'mesh3.component4': { mesh: 3, component: 4 },
          'mesh3.component5': { mesh: 3, component: 5 },
          'mesh3.component6': { mesh: 3, component: 6 },
          'mesh3.component7': { mesh: 3, component: 7 },
          'mesh3.component8': { mesh: 3, component: 8 },
          'mesh3.component9': { mesh: 3, component: 9 },
          'mesh4.component1': { mesh: 4, component: 1 },
          'mesh4.component2': { mesh: 4, component: 2 },
          'mesh4.component3': { mesh: 4, component: 3 },
          'mesh4.component4': { mesh: 4, component: 4 },
          'mesh4.component5': { mesh: 4, component: 5 },
          'mesh4.component6': { mesh: 4, component: 6 },
          'mesh4.component7': { mesh: 4, component: 7 },
          'mesh4.component8': { mesh: 4, component: 8 },
          'mesh4.component9': { mesh: 4, component: 9 },
          'mesh5.component1': { mesh: 5, component: 1 },
          'mesh5.component2': { mesh: 5, component: 2 },
          'mesh5.component3': { mesh: 5, component: 3 },
          'mesh5.component4': { mesh: 5, component: 4 },
          'mesh5.component5': { mesh: 5, component: 5 },
          'mesh5.component6': { mesh: 5, component: 6 },
          'mesh5.component7': { mesh: 5, component: 7 },
          'mesh5.component8': { mesh: 5, component: 8 },
          'mesh5.component9': { mesh: 5, component: 9 },
          'mesh6.component1': { mesh: 6, component: 1 },
          'mesh6.component2': { mesh: 6, component: 2 },
          'mesh6.component3': { mesh: 6, component: 3 },
          'mesh6.component4': { mesh: 6, component: 4 },
          'mesh6.component5': { mesh: 6, component: 5 },
          'mesh6.component6': { mesh: 6, component: 6 },
          'mesh6.component7': { mesh: 6, component: 7 },
          'mesh6.component8': { mesh: 6, component: 8 },
          'mesh6.component9': { mesh: 6, component: 9 },
          'mesh7.component1': { mesh: 7, component: 1 },
          'mesh7.component2': { mesh: 7, component: 2 },
          'mesh7.component3': { mesh: 7, component: 3 },
          'mesh7.component4': { mesh: 7, component: 4 },
          'mesh7.component5': { mesh: 7, component: 5 },
          'mesh7.component6': { mesh: 7, component: 6 },
          'mesh7.component7': { mesh: 7, component: 7 },
          'mesh7.component8': { mesh: 7, component: 8 },
          'mesh7.component9': { mesh: 7, component: 9 },
          'mesh8.component1': { mesh: 8, component: 1 },
          'mesh8.component2': { mesh: 8, component: 2 },
          'mesh8.component3': { mesh: 8, component: 3 },
          'mesh8.component4': { mesh: 8, component: 4 },
          'mesh8.component5': { mesh: 8, component: 5 },
          'mesh8.component6': { mesh: 8, component: 6 },
          'mesh8.component7': { mesh: 8, component: 7 },
          'mesh8.component8': { mesh: 8, component: 8 },
          'mesh8.component9': { mesh: 8, component: 9 },
          'mesh9.component1': { mesh: 9, component: 1 },
          'mesh9.component2': { mesh: 9, component: 2 },
          'mesh9.component3': { mesh: 9, component: 3 },
          'mesh9.component4': { mesh: 9, component: 4 },
          'mesh9.component5': { mesh: 9, component: 5 },
          'mesh9.component6': { mesh: 9, component: 6 },
          'mesh9.component7': { mesh: 9, component: 7 },
          'mesh9.component8': { mesh: 9, component: 8 },
          'mesh9.component9': { mesh: 9, component: 9 }
        });

        done();


      });



    }).catch(function(err) {

      console.log(err);
      done(err)

    });




  });

});
