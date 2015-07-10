var Mesh = require('../../lib/system/mesh');

var config = {
  name: 'theFarawayTree',
  dataLayer: {
    port: 3001,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  endpoints: {},
  modules: {
    "moonface":{
      path:__dirname + "/4-moonface",
      constructor:{
        type:"sync",
        parameters:[]
      }
    }
  },
  components: {
    "moonface":{
      moduleName:"moonface",
      schema:{
        "exclusive":false,
        "methods":{
          "rideTheSlipperySlip": {
            parameters: [
              {name:'one',required:true},
              {name:'two',required:true},
              {name:'three',required:true},
              {name:'callback', type:'callback', required:true}
            ]
          }
          ,
          "haveAnAccident": {
            parameters: [
              {name:'callback', type:'callback', required:true}
            ]
          }
        }
      }
    }
  }
};

Mesh().initialize(config, function(err) {

  if (err) {
    console.log(err);
    process.exit(err.code || 1);
  }

  console.log('READY');

});
