var Mesh = require('../../lib/system/mesh');

var config = {
      name:"testMesh",
      dataLayer: {
        authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
        systemSecret: 'mesh',
        log_level: 'info|error|warning'
      },
      endpoints: {},
      modules: {
      	"happnUI":{
      	  path:"happn-ui-module",
      	  constructor:{
            type:"sync",
            context:"new"//instantiate as a new one
          }
      	}
      },
      components: {
      	"happnUI":{
      		moduleName:"happnUI",
          scope:"module",
      		config:{},
      		schema:{
      			"exclusive":false,//means we dont dynamically share anything else
      			"methods":{}
      		}
      	}
    }
};

var mesh = new Mesh();
mesh.initialize(config, function(err) {

  if (err) console.log(err.stack);

  console.log('doing start');

  //when using an unexclusive schema, we can dynamically call any functions the component instance shares.
  mesh.api.exchange.happnUI.start({"happn-system-secret":"mesh"}, function(err){

  	if (err) console.log(err.stack);

  	console.log('ui component started');

  });

});

