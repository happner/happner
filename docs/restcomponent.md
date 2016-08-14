## REST component

*the happner exchange can be exposed via a REST component [the test for now](https://github.com/happner/happner/blob/master/test/e3b-rest-component-secure.js)*

*for secure meshes, a rest command for logging in is called - on successful login, a token will be passed back, this token is used in the url for subsequent requests*

```javascript

var restClient = require('restler');

var operation = {
  username:'_ADMIN',
  password:'happn'
};

restClient.postJson('http://localhost:10000/rest/login', operation).on('complete', function(result){

  var token = result.data.token;
  
  //you can get a description o fthe services
  
   restClient.get('http://localhost:10000/rest/describe?happn_token=' + token).on('complete', function(result){

      //the description is in the current format:
      //TODO: update description to show example calls
      
      done();
    });
    
    // or call a component over the exchange, the operation JSON contains a URI
    // for the route to the exchange method, and also contains a set of parameters 
    // that are named to match the parameters of the remote exchange method
    
    var operation = {
        uri:'/remoteMesh/remoteComponent/remoteFunction',
        parameters:{
          'one':'one',
          'two':'two',
          'three':'three'
        }
      };
      

      restClient.postJson('http://localhost:10000/rest/api?happn_token=' + token, operation).on('complete', function(result){

        expect(result.message).to.be("Call successful");
        expect(result.data).to.be({"test":"ok"});

        done();
      });

});

```

*for unsecured meshes, no login is required, see [the test for now](https://github.com/happner/happner/blob/master/test/e3a-rest-component.js)*

