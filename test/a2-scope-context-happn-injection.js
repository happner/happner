

describe('mesh awareness via $happn injection', function() {

  var promise = require('when').promise;
  var parallel = require('when/parallel');
  var should = require('chai').should();
  var request = require('request');
  var Mesh = require('../');

  this.timeout(40000);

  before(function(done) {

    // test against multiple meshes and multiple components

    var _this = this;

    _this.meshNo = [1,2,3,4,5,6,7,8,9];
    _this.componentNo = [1,2,3,4,5,6,7,8,9];

    // ENDPOINTS = [{}];

    // _this.meshNo.map(function(i) {
    //   ENDPOINTS.push({
    //     config: {
    //       port: 3000 + i,
    //       secret: 'mesh',
    //       host: 'localhost'
    //     }
    //   })
    // });

    // var getEndpoints = function(i) {
    //   // return all but i, 
    //   // for connecting mesh to every OTHER mesh

    //   var endpoints = {};
    //   for (var j = 1; j < ENDPOINTS.length; j++) {
    //     if (i == j) continue;
    //     endpoints['mesh'+j] = ENDPOINTS[j];
    //   }
    // }
    //
    //
    // cant spawn more than one mesh in same process and connect
    // them across localhost successfully

    parallel(
      _this.meshNo.map(
        function(i) {
          return function() {
            return promise(
              function(resolve, reject) {
                var mesh = new Mesh();
                // meshes.push(mesh = Mesh());

                var COMPONENTS = {};
                _this.componentNo.forEach(
                  function(j) {
                    COMPONENTS['component' + j] = {
                      moduleName: 'module1',
                      startMethod: 'start',
                      stopMethod: 'stop',
                      configThing: {
                        mesh: i,
                        component: j
                      }
                    };

                    COMPONENTS['webComponent'+ j] = {
                      moduleName: 'module3',
                      web: {
                        routes: {
                          methodWithHappn: 'methodWithHappn',
                          methodWithoutHappn: 'methodWithoutHappn',
                          methodWithHappnInFront: 'methodWithHappnInFront',
                          methodWithHappnInMiddle: 'methodWithHappnInMiddle',
                          methodWithHappnInEnd: 'methodWithHappnInEnd',
                        }
                      }
                    }

                    COMPONENTS['special-component' + j] = {
                      moduleName: 'module2',
                      schema: {
                        exclusive: true,
                        methods: {
                          getThingFromConfig: {},
                          methodNameFront: {
                            type: 'async',
                            parameters: [
                              {name: 'arg1'},
                              {name: 'callback'}
                            ]
                          },
                          methodNameMiddle: {
                            type: 'async',
                            parameters: [
                              {name: 'arg1'},
                              {name: 'callback'}
                            ]
                          },
                          methodNameEnd: {
                            type: 'async',
                            parameters: [
                              {name: 'arg1'},
                              {name: 'callback'}
                            ]
                          },
                          methodWithoutHappn: {
                            type: 'async',
                            parameters: [
                              {name: 'arg1'},
                              {name: 'callback'}
                            ]
                          },
                          callOnwardWithoutHappn: {},
                          callOnwardWithHappn: {},
                          methodWithHappn: {}

                        }
                      },
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
                  // endpoints: getEndpoints(i),
                  modules: {
                    'module1': {
                      path: __dirname + '/lib/11-module1.js'
                    },
                    'module2': {
                      path: __dirname + '/lib/11-module2.js'
                    },
                    'module3': {
                      path: __dirname + '/lib/11-module3.js'
                    }
                  },
                  components: COMPONENTS

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
    ).then(function(meshes) {
      _this.meshes = meshes;
      done()
    }).catch(function(err) {
      // console.log(err);
      done(err)
    });
  });

  
  it('leaves happn out of the description when defaulting method parameters', function(done) {
    var meshes = this.meshes;
    meshes[0]._mesh.description.components.component1.methods.getThingFromConfig.should.eql [
      {name: 'callback'}
    ]
    done()
  });

  xit('leaves happn out of the description when specifying method parameters', function(done) {
    var meshes = this.meshes;
    meshes[0]._mesh.description.components['special-component1'].should.eql({
      "methods": {
        "getThingFromConfig": {
          "parameters": [
            {
              "name": "callback"
            }
          ]
        },
        "methodNameFront": {
          "parameters": [
            {
              "name": "arg1"
            },
            {
              "name": "callback"
            }
          ],
          type: 'async'
        },
        "methodNameMiddle": {
          "parameters": [
            {
              "name": "arg1"
            },
            {
              "name": "callback"
            }
          ],
          type: 'async'
        },
        "methodNameEnd": {
          "parameters": [
            {
              "name": "arg1"
            },
            {
              "name": "callback"
            }
          ],
          type: 'async'
        },
        "methodWithoutHappn": {
          "parameters": [
            {
              "name": "arg1"
            },
            {
              "name": "callback"
            }
          ],
          type: 'async'
        },
        "callOnwardWithHappn": {
          "parameters": [
            {
              "name": "arg1"
            },
            {
              "name": "callback"
            }
          ]
        },
        "callOnwardWithoutHappn": {
          "parameters": [
            {
              "name": "arg1"
            },
            {
              "name": "callback"
            }
          ]
        },
        "methodWithHappn": {
          "parameters": [
            {
              "name": "arg1"
            },
            {
              "name": "callback"
            }
          ]
        },
      }
    });
    done()
  });


  it('calls multiple components on multiple modules on multiple meshes', function(done) {
    // ensure each module call got $happn correctly
    var meshes = this.meshes;
    var componentNo = this.componentNo;
    var meshNo = this.meshNo;
    return parallel( // parallel each mesh calls every mesh's every component
      meshes.map(
        function(mesh) {
          return function() {
            // return parallel(  // parallel all meshes
            //   meshNo.map(
            //     function(i) {
            //       return function() {
                    return parallel( // parallel every component
                      componentNo.map(
                        function(j) {
                          return function() {
                            return promise(
                              function(resolve, reject) {
                                var results = [];

                                // console.log('mesh'+i, 'component'+j)
                                // mesh.api.exchange['mesh'+i]['component'+j]

                                mesh.exchange['component'+j]
                                .getThingFromConfig(function(err, thing) {
                                  if (err) return reject(err);
                                  results.push(thing);

                                  mesh.exchange['special-component'+j]
                                  .getThingFromConfig(function(err, thing) {
                                    if (err) return reject(err);
                                    results.push(thing);
                                    resolve([mesh._mesh.config.name + '.component' + j,results]);
                                  });
                                });
                              }
                            )
                          }
                        }
                      )
                    )
            //       }
            //     }
            //   )
            // )
          }
        }
      )
    ).then(function(results){

      var formatted = {};
      results.forEach(function(meshResult) {
        meshResult.forEach(function(componentResults) {
          formatted[componentResults[0]] = componentResults[1];
        })
      });

      formatted.should.eql({ 
        'mesh1.component1': [ { mesh: 1, component: 1 }, { mesh: 1, component: 1 } ],
        'mesh1.component2': [ { mesh: 1, component: 2 }, { mesh: 1, component: 2 } ],
        'mesh1.component3': [ { mesh: 1, component: 3 }, { mesh: 1, component: 3 } ],
        'mesh1.component4': [ { mesh: 1, component: 4 }, { mesh: 1, component: 4 } ],
        'mesh1.component5': [ { mesh: 1, component: 5 }, { mesh: 1, component: 5 } ],
        'mesh1.component6': [ { mesh: 1, component: 6 }, { mesh: 1, component: 6 } ],
        'mesh1.component7': [ { mesh: 1, component: 7 }, { mesh: 1, component: 7 } ],
        'mesh1.component8': [ { mesh: 1, component: 8 }, { mesh: 1, component: 8 } ],
        'mesh1.component9': [ { mesh: 1, component: 9 }, { mesh: 1, component: 9 } ],
        'mesh2.component1': [ { mesh: 2, component: 1 }, { mesh: 2, component: 1 } ],
        'mesh2.component2': [ { mesh: 2, component: 2 }, { mesh: 2, component: 2 } ],
        'mesh2.component3': [ { mesh: 2, component: 3 }, { mesh: 2, component: 3 } ],
        'mesh2.component4': [ { mesh: 2, component: 4 }, { mesh: 2, component: 4 } ],
        'mesh2.component5': [ { mesh: 2, component: 5 }, { mesh: 2, component: 5 } ],
        'mesh2.component6': [ { mesh: 2, component: 6 }, { mesh: 2, component: 6 } ],
        'mesh2.component7': [ { mesh: 2, component: 7 }, { mesh: 2, component: 7 } ],
        'mesh2.component8': [ { mesh: 2, component: 8 }, { mesh: 2, component: 8 } ],
        'mesh2.component9': [ { mesh: 2, component: 9 }, { mesh: 2, component: 9 } ],
        'mesh3.component1': [ { mesh: 3, component: 1 }, { mesh: 3, component: 1 } ],
        'mesh3.component2': [ { mesh: 3, component: 2 }, { mesh: 3, component: 2 } ],
        'mesh3.component3': [ { mesh: 3, component: 3 }, { mesh: 3, component: 3 } ],
        'mesh3.component4': [ { mesh: 3, component: 4 }, { mesh: 3, component: 4 } ],
        'mesh3.component5': [ { mesh: 3, component: 5 }, { mesh: 3, component: 5 } ],
        'mesh3.component6': [ { mesh: 3, component: 6 }, { mesh: 3, component: 6 } ],
        'mesh3.component7': [ { mesh: 3, component: 7 }, { mesh: 3, component: 7 } ],
        'mesh3.component8': [ { mesh: 3, component: 8 }, { mesh: 3, component: 8 } ],
        'mesh3.component9': [ { mesh: 3, component: 9 }, { mesh: 3, component: 9 } ],
        'mesh4.component1': [ { mesh: 4, component: 1 }, { mesh: 4, component: 1 } ],
        'mesh4.component2': [ { mesh: 4, component: 2 }, { mesh: 4, component: 2 } ],
        'mesh4.component3': [ { mesh: 4, component: 3 }, { mesh: 4, component: 3 } ],
        'mesh4.component4': [ { mesh: 4, component: 4 }, { mesh: 4, component: 4 } ],
        'mesh4.component5': [ { mesh: 4, component: 5 }, { mesh: 4, component: 5 } ],
        'mesh4.component6': [ { mesh: 4, component: 6 }, { mesh: 4, component: 6 } ],
        'mesh4.component7': [ { mesh: 4, component: 7 }, { mesh: 4, component: 7 } ],
        'mesh4.component8': [ { mesh: 4, component: 8 }, { mesh: 4, component: 8 } ],
        'mesh4.component9': [ { mesh: 4, component: 9 }, { mesh: 4, component: 9 } ],
        'mesh5.component1': [ { mesh: 5, component: 1 }, { mesh: 5, component: 1 } ],
        'mesh5.component2': [ { mesh: 5, component: 2 }, { mesh: 5, component: 2 } ],
        'mesh5.component3': [ { mesh: 5, component: 3 }, { mesh: 5, component: 3 } ],
        'mesh5.component4': [ { mesh: 5, component: 4 }, { mesh: 5, component: 4 } ],
        'mesh5.component5': [ { mesh: 5, component: 5 }, { mesh: 5, component: 5 } ],
        'mesh5.component6': [ { mesh: 5, component: 6 }, { mesh: 5, component: 6 } ],
        'mesh5.component7': [ { mesh: 5, component: 7 }, { mesh: 5, component: 7 } ],
        'mesh5.component8': [ { mesh: 5, component: 8 }, { mesh: 5, component: 8 } ],
        'mesh5.component9': [ { mesh: 5, component: 9 }, { mesh: 5, component: 9 } ],
        'mesh6.component1': [ { mesh: 6, component: 1 }, { mesh: 6, component: 1 } ],
        'mesh6.component2': [ { mesh: 6, component: 2 }, { mesh: 6, component: 2 } ],
        'mesh6.component3': [ { mesh: 6, component: 3 }, { mesh: 6, component: 3 } ],
        'mesh6.component4': [ { mesh: 6, component: 4 }, { mesh: 6, component: 4 } ],
        'mesh6.component5': [ { mesh: 6, component: 5 }, { mesh: 6, component: 5 } ],
        'mesh6.component6': [ { mesh: 6, component: 6 }, { mesh: 6, component: 6 } ],
        'mesh6.component7': [ { mesh: 6, component: 7 }, { mesh: 6, component: 7 } ],
        'mesh6.component8': [ { mesh: 6, component: 8 }, { mesh: 6, component: 8 } ],
        'mesh6.component9': [ { mesh: 6, component: 9 }, { mesh: 6, component: 9 } ],
        'mesh7.component1': [ { mesh: 7, component: 1 }, { mesh: 7, component: 1 } ],
        'mesh7.component2': [ { mesh: 7, component: 2 }, { mesh: 7, component: 2 } ],
        'mesh7.component3': [ { mesh: 7, component: 3 }, { mesh: 7, component: 3 } ],
        'mesh7.component4': [ { mesh: 7, component: 4 }, { mesh: 7, component: 4 } ],
        'mesh7.component5': [ { mesh: 7, component: 5 }, { mesh: 7, component: 5 } ],
        'mesh7.component6': [ { mesh: 7, component: 6 }, { mesh: 7, component: 6 } ],
        'mesh7.component7': [ { mesh: 7, component: 7 }, { mesh: 7, component: 7 } ],
        'mesh7.component8': [ { mesh: 7, component: 8 }, { mesh: 7, component: 8 } ],
        'mesh7.component9': [ { mesh: 7, component: 9 }, { mesh: 7, component: 9 } ],
        'mesh8.component1': [ { mesh: 8, component: 1 }, { mesh: 8, component: 1 } ],
        'mesh8.component2': [ { mesh: 8, component: 2 }, { mesh: 8, component: 2 } ],
        'mesh8.component3': [ { mesh: 8, component: 3 }, { mesh: 8, component: 3 } ],
        'mesh8.component4': [ { mesh: 8, component: 4 }, { mesh: 8, component: 4 } ],
        'mesh8.component5': [ { mesh: 8, component: 5 }, { mesh: 8, component: 5 } ],
        'mesh8.component6': [ { mesh: 8, component: 6 }, { mesh: 8, component: 6 } ],
        'mesh8.component7': [ { mesh: 8, component: 7 }, { mesh: 8, component: 7 } ],
        'mesh8.component8': [ { mesh: 8, component: 8 }, { mesh: 8, component: 8 } ],
        'mesh8.component9': [ { mesh: 8, component: 9 }, { mesh: 8, component: 9 } ],
        'mesh9.component1': [ { mesh: 9, component: 1 }, { mesh: 9, component: 1 } ],
        'mesh9.component2': [ { mesh: 9, component: 2 }, { mesh: 9, component: 2 } ],
        'mesh9.component3': [ { mesh: 9, component: 3 }, { mesh: 9, component: 3 } ],
        'mesh9.component4': [ { mesh: 9, component: 4 }, { mesh: 9, component: 4 } ],
        'mesh9.component5': [ { mesh: 9, component: 5 }, { mesh: 9, component: 5 } ],
        'mesh9.component6': [ { mesh: 9, component: 6 }, { mesh: 9, component: 6 } ],
        'mesh9.component7': [ { mesh: 9, component: 7 }, { mesh: 9, component: 7 } ],
        'mesh9.component8': [ { mesh: 9, component: 8 }, { mesh: 9, component: 8 } ],
        'mesh9.component9': [ { mesh: 9, component: 9 }, { mesh: 9, component: 9 } ] 
      });
      done();

    }).catch(done);
  });

  it('injects happn into first position', function(done) {
    var mesh = this.meshes[0];

    mesh.exchange['special-component2'].methodNameFront('ARG1', function(err, res) {
      if (err) return done(err);
      res.should.eql([ 'ARG1', { mesh: 1, component: 2 } ]);
      done()
    });

  });

  it('injects happn into last position', function(done) {
    var mesh = this.meshes[0];

    mesh.exchange['special-component3'].methodNameEnd('ARG1', function(err, res) {
      if (err) return done(err);
      res.should.eql([ 'ARG1', { mesh: 1, component: 3 } ]);
      done()
    });
  });

  it('injects happn into middle position', function(done) {
    var mesh = this.meshes[0];

    mesh.exchange['special-component4'].methodNameMiddle('ARG1', function(err, res) {
      if (err) return done(err);
      res.should.eql([ 'ARG1', { mesh: 1, component: 4 } ]);
      done()
    });
  })

  it('runs method without happn ok', function(done) {
    var mesh = this.meshes[0];

    mesh.exchange['special-component5'].methodWithoutHappn('ARG1', function(err, res) {
      if (err) return done(err);
      res.should.eql([ 'ARG1' ]);
      done()
    });
  });


  it('injects happn into webmethods', function(done) {

    request('http://localhost:3001/mesh1/webComponent1/methodWithHappn', function(err, res) {

      // console.log(JSON.stringify(JSON.parse(res.body),null,2));

      JSON.parse(res.body).should.eql({
        "moduleName": "module3",
        "web": {
          "routes": {
            "methodWithHappn": "methodWithHappn",
            "methodWithoutHappn": "methodWithoutHappn",
            "methodWithHappnInEnd": "methodWithHappnInEnd",
            "methodWithHappnInFront": "methodWithHappnInFront",
            "methodWithHappnInMiddle": "methodWithHappnInMiddle"
          }
        }
      })
      done()
    })
  });

  it('injects happn into front of webmethod args', function(done) {

    request('http://localhost:3001/mesh1/webComponent1/methodWithHappnInFront', function(err, res) {
      var response = JSON.parse(res.body);
      response.config.moduleName.should.equal('module3');
      response.next.slice(0,8).should.equal('function');
      done()
    })
  });

  it('injects happn into middle of webmethod args', function(done) {

    request('http://localhost:3001/mesh1/webComponent1/methodWithHappnInMiddle', function(err, res) {
      var response = JSON.parse(res.body);
      response.config.moduleName.should.equal('module3');
      response.next.slice(0,8).should.equal('function');
      done()
    })
  });

  it('injects happn into middle of webmethod args', function(done) {

    request('http://localhost:3001/mesh1/webComponent1/methodWithHappnInEnd', function(err, res) {
      var response = JSON.parse(res.body);
      response.config.moduleName.should.equal('module3');
      response.next.slice(0,8).should.equal('function');
      done()
    })
  });


  it('runs webmethod ok without $happn', function(done) {

    request('http://localhost:3001/mesh1/webComponent1/methodWithoutHappn', function(err, res) {
      res.body.should.eql('ok')
      done()
    })

  })

});
