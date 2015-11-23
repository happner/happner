describe('passes data between component APIs, also works with events', function(done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;
  var maximumPings = 1000;
  var libFolder ;
  var Mesh = require('../');
  var test_id = Date.now() + '_' + require('shortid').generate();
  var should = require('chai').should();


  this.timeout(5000);

  // var mesh = require('../lib/mesh')();

  var config = {
    name:"testProtectedDataAPI",
    // dataLayer: {
    //   authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    //   systemSecret: 'mesh',
    //   log_level: 'info|error|warning',
    //   //setOptions:{}
    // },
    // endpoints: {},
    modules: {
      "module1":{
        path:libFolder + "a9-module1",
        construct:{
          type:"sync",
          parameters:[
            {value:{maximumPings:maximumPings}}
          ]
        }
      },
      "module2":{
        path:libFolder + "a9-module2",
        construct:{
          type:"sync"
        }
      }
    },
    components: {
      "component1":{
        moduleName:"module1",
        startMethod:"start",
        schema:{
          "exclusive":false,//means we dont dynamically share anything else
          "methods":{
            "start":{
              type:"async",
              parameters:[
               {"required":true, "value":{"message":"this is a start parameter"}}  
              ]
            }
          }
        }
      },
      "component2":{
        moduleName:"module2",
        schema:{
          "exclusive":false
        }
      }
    }
  };

  after(function(done){
    this.mesh.stop(done);
  });

  before(function(done){
    var _this = this;
    Mesh.create(config).then(function(mesh) {
      _this.mesh = mesh;
      done();
    }).catch(done);
    // mesh = new Mesh();
    // mesh.initialize(config, function(err) {
    //   if (err) {
    //     console.log(err.stack);
    //     done(err);
    //   } else mesh.start(done);
    // });
  });

  it('stores some data on component1, we look at the output from happn', function(done) {

    this.mesh.exchange.component1.storeData('/test/a9-api-data', {"testprop1":"testval1"}, {}, function(e, result){

      result._meta.path.should.equal('/_data/component1/' + 'test/a9-api-data');

      setTimeout( done, 2000);//so the on picks something up?
     
    });

  });

  it('checks the on count on component1 must be greater than 0', function(done) {

    this.mesh.exchange.component1.getOnCount(function(e, result){
      
      if (!result || result == 0)
        return done(new Error('result should be greater than 0'));

      done();
    });

  });

  /*

  it('stores some data on component2, we look at the output from happn', function(done) {

     this.mesh.exchange.component2.storeData(test_id, {"testprop2":"testval2"}, {}, function(e, result){
      result._meta.path.should.equal('/_data/component2/' + test_id);
      done();

    });

  });

  it('uses component2 to inspect $happn for forbidden data methods', function(done) {

    this.timeout(10000);

    this.mesh.exchange.component2.lookForForbiddenMethods(function(e, result){

      result.length.should.equal(0);
      done();

    });

  });

  it('checks that it can find the happn class paths in the mesh, negative test', function(done){

    this.timeout(10000);

    var traverse = require('traverse');
    var permittedFruit = ['_remoteOff'];
    var appetiteSated = [];

    traverse(this.mesh).map(function(){

      if (permittedFruit.indexOf(this.key) >= 0)
        appetiteSated.push(this.path);

    });

    if (appetiteSated.length == 0)
      return done(new Error('couldnt find happn methods'));

    done();

  });

  it('should subscribe to data', function(done) {
    var _this = this;
    this.mesh.exchange.component2.subscribeToData(
      {
        path:'/testSub',
        callback:function(err){
          should.not.exist(err);
          
          _this.mesh.exchange.component2.setData(
            {
              path:'/testSub',
              value:10,
              callback:function(){}
            }
          )

        },
        handler:function(){
          done();
        }
      }
    )
  });

  it('should unsubscribe from data', function(done) {
    var _this = this;
    this.mesh.exchange.component2.subscribeToData(
      {
        path:'/testUnsub',
        callback:function(err){
          should.not.exist(err);
          _this.mesh.exchange.component2.unsubscribeFromData(
            {
              path:'/testUnsub',
              callback:function(err) {
                should.not.exist(err);
                _this.mesh.exchange.component2.setData(
                  {
                    path:'/testUnsub',
                    value:10,
                    callback:function(){
                      done();
                    }
                  }
                )
              }
            }
          )
        },
        handler:function(){
          done('Should not be called');
        }
      }
    )
  });

*/

});









