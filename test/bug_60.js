var should = require('chai').should();
var path = require('path');

var meshpath = path.join(__dirname, '../lib/mesh');

var happner = require(meshpath);

var testComponentPath = path.join(__dirname, 'lib/bug_60_component.js');


var config = {
  dataLayer: {
    secure: true
  },

  modules:{
    testComponent:{
      path:testComponentPath
    }
  },
  components:{
    testComponent:{
      name:'testComponent',
      moduleName: 'testComponent',
      startMethod: "start",
      schema: {
        "exclusive": false,
        "methods": {
          "start": {
            type: "async"
          }
        }
      }
    }
  }
};


describe('bug #60 - security layer should be initialized before user components are started', function(){

  it('should start a user component that expects the security layer to be initialized', function(done){
    var mesh = new happner();
    mesh.initialize(config, function(err){
      if(err) console.log(err);
      should.not.exist(err);

      mesh.start(function(err){
        if(err) console.log(err);
        should.not.exist(err);
      });
    });
  });

});