happngin:
==========
*The mesh application framework wraps a local happn instance, and connects to other Meshes by configuration, Happn and therefore websockets is the transport layer from Mesh to Mesh, methods on components shared by remote meshes can be accesses as if they were local. Modules can be consumed by the mesh and shared as components by configuration.*

For example, this is how one would consume the happn-ui-component module in a mesh, and start it:

```js
var Mesh = require('happngin');

var config = {
      name:"testMesh",
      dataLayer: {//How the meshes instance of happn runs
        authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
        systemSecret: 'mesh',
        log_level: 'info|error|warning'
      },
      endpoints: {},
      modules: {
      	"happnUI":{//How to consume a module
          scope:"api", //can be local, api, mesh
      	  path:"happn-ui-module",
      	  constructor:{//How to construct a module
            type:"sync",
            context:"new"//instantiate as a new one
          }
      	}
      },
      components: {
      	"happnUI":{//How to expose a module's methods
      		moduleName:"happnUI",
      		config:{},
      		schema:{
      			"exclusive":false,//means we dynamically share any method that doesnt start with _
      			"methods":{}
      		}
      	}
    }
};

var mesh = Mesh();
mesh.initialize(config, function(err) {

  if (err) console.log(err.stack);

  console.log('doing start');

  //when using an unexclusive schema, we can dynamically call any functions the component instance shares.
  mesh.api.exchange.happnUI.start({"happn-system-secret":"mesh"}, function(err){

  	if (err) console.log(err.stack);

  	console.log('ui component started');

  });

});
```

And this is how we share a happn client, and apply aliases to its methods:
```js
var config = {
  name:"testMesh",
  dataLayer: {
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  endpoints: {},
  modules: {
  	"happnClient":{
      scope:{
        variableName:"scope",
        depth:"api" //can be local, api, mesh TODO
      },
  		path:"@smc/happn",
  		constructor:{
  			type:"async",
  			name:"client",//if blank or null we just do new require
  			parameters:[
  			 {"name":"config", "required":true, "value":{config:{"host":"127.0.0.1", "port":8000, "secret":"mesh"}}},
					 {"name":"callback", "parameterType":"callback"},    
  			],
  			callback:{
					parameters:[
						{"name":"error", "parameterType":"error"},
	  					{"name":"client", "parameterType":"instance"}
					]
				  }
  		},
      start:{//where we define a method that starts this module, ie. like for the emitter TODO

      },
      shutdown:{

      }
  	}
  },
  components: {
  	"happnClient":{
  		moduleName:"happnClient",
  		config:{

  		},
  		schema:{
  			"exclusive":true,//means we dont dynamically share any other methods on the mesh
  			"methods":{
  				"get":{
      				"alias":"GET",//how you alias the method
      				"parameters":[
      					{"name":"path", "required":true},
      					{"name":"options"},
      					{"name":"callback", "type":"callback", "required":true}
      				],
      				"callback":{
      					"parameters":[
	  						{"name":"error", "type":"error"},
	  						{"name":"response"}
	  					]
      				}
      			},
      			"set":{
      			  "alias":"PUT",
  				    "parameters":[
  				   		{"name":"path", "required":true},
  				   		{"name":"data", "required":true},
  				   		{"name":"options"},
              			{"name":"callback", "type":"callback", "required":true}
  				   		
  				   	],
      				"callback":{
      					"parameters":[
	  						{"name":"error", "type":"error"},
	  						{"name":"response"}
	  					]
      				}
      			},
      			"remove":{
      				"alias":"DELETE",
  				    "parameters":[
  				    	{"name":"path", "required":true},
  				    	{"name":"options"},
  				    	{"name":"callback", "type":"callback", "required":true}
  				    ],
      				"callback":{
      					"parameters":[
	  						{"name":"error", "type":"error"},
	  						{"name":"response"}
	  					]
      				}
      			}
      		}
  		}
  	}
  },
};

var mesh = Mesh();

mesh.initialize(config, function(err) {

    if (err) {
        console.log('failure in init of mesh')
        return console.log(err.stack)
    }

    //now we can access the happn client on the mesh, like so:
    _this.mesh.api.exchange.testMesh.happnClient.PUT('/mytest/678687', {"test":"test1"}, {}, function(e, response){

         

         
    });

});
```

Installation:
==========
```bash
	git clone "https://github.com/southbite/happngin.git" && cd happngin
	npm install
```
UI component test
---------------
*The happn-ui-component gets consumed by the mesh and started by a call to the mesh api*
```bash
	node test/ui-component/ui-component-test
```
*NB: the component ui is started, and is pointing to the local meshes instance of happn, you can then navigate to the UI in your browser http://localhost:9999 - log in - remeber to change the password to "mesh" - now when you list all the items in the mesh, you would see the mesh decription saved as json in happn*



