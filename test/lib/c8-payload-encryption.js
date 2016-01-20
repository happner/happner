var Mesh = require('../../lib/mesh');

var config = {
  name: 'theFarawayTree',
  dataLayer: {
    port: 3001,
    secure:true,
    adminPassword:'guessme',
    encryptPayloads:true
  },
  endpoints: {},
  modules: {
    "moonface":{
      path:__dirname + "/c8-payload-encryption-component",
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

var mesh = new Mesh();

mesh.initialize(config, function(err) {

  if (err) {
    console.log(err);
    process.exit(err.code || 1);
    return;
  }

  mesh.start(function(e){

    if (e){
      console.log(e);
      process.exit(e.code || 1);
    }

    console.log('READY');
  });
  

});
