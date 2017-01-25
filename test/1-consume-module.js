describe('1 - Consumes an external module', function () {

  this.timeout(120000);

  var should = require('chai').should();
  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;
  var Mesh = require('../');

  var config = {
    name: "testMesh",
    modules: {
      "happnClient": {
        path: "happn.client",
        create: {
          type: "async",
          name: "create",//if blank or null we just do new require
          parameters: [
            {"name": "config", "required": true, "value": {config: {"host": "localhost", "secret": "mesh"}}},
            {"name": "callback", "parameterType": "callback"},
          ],
          callback: {
            parameters: [
              {"name": "error", "parameterType": "error"},
              {"name": "client", "parameterType": "instance"}
            ]
          }
        }
      }
    },
    components: {
      "happnClient": {
        moduleName: "happnClient",
        // scope:"module", //"either component or module, module by default"
        schema: {
          "exclusive": true,//means we dont dynamically share anything else
          "methods": {
            "get": {
              "alias": "GET",
              "parameters": [
                {"name": "path", "required": true},
                {"name": "options"},
                {"name": "callback", "type": "callback", "required": true}
              ],
              "callback": {
                "parameters": [
                  {"name": "error", "type": "error"},
                  {"name": "response"}
                ]
              }
            },
            "set": {
              "alias": "PUT",
              "parameters": [
                {"name": "path", "required": true},
                {"name": "data", "required": true},
                {"name": "options"},
                {"name": "callback", "type": "callback", "required": true}

              ],
              "callback": {
                "parameters": [
                  {"name": "error", "type": "error"},
                  {"name": "response"}
                ]
              }
            },
            "remove": {
              "alias": "DELETE",
              "parameters": [
                {"name": "path", "required": true},
                {"name": "options"},
                {"name": "callback", "type": "callback", "required": true}
              ],
              "callback": {
                "parameters": [
                  {"name": "error", "type": "error"},
                  {"name": "response"}
                ]
              }
            }
          }
        }
      }
    },
  };

  after(function (done) {
    mesh.stop({reconnect: false}, done);
  });

  it('starts a local mesh', function (done) {

    mesh = new Mesh();

    mesh.initialize(config, function (err) {

      if (err) {
        // console.log('failure in init')
        // console.log(err.stack)
      }
      ;

      done(err);

    });

  });

  it('starts a local mesh, with a single component that wraps the happn client module and compares the response with a happn client instantiated outside of the mesh', function (done) {

    var _this = this;

    //we require a 'real' happn client
    require('happn').client.create({config: {"host": "localhost", "secret": "mesh"}}, function (e, client) {

      if (e) {
        // console.log('real client init failure');
        done(e);
      }

      client.set('/mytest/678687', {"test": "test1"}, {}, function (e, directClientResponse) {
        //calling a local component
        mesh.exchange.happnClient.set('/mytest/678687', {"test": "test1"}, {}, function (e, response) {

          response.test.should.eql(directClientResponse.test);

          if (e)
            return done(e);

          //calling a local component as if it was on another mesh
          mesh.exchange.testMesh.happnClient.set('/mytest/678687', {"test": "test1"}, {}, function (e, response) {

            response.test.should.eql(directClientResponse.test);

            if (e) return done(e);

            //doing the same call using a post to the api
            mesh.post('/happnClient/set', '/mytest/678687', {"test": "test1"}, {}, function (e, response) {

              response.test.should.eql(directClientResponse.test);
              //console.log({response: response});
              //test aliases
              mesh.exchange.testMesh.happnClient.PUT('/mytest/678687', {"test": "test1"}, {}, function (e, response) {

                response.test.should.eql(directClientResponse.test);

                return done(e);
              });
            });
          });
        });
      });
    });
  });
});
