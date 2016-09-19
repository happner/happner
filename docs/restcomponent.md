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
  
  //you can get a description of the services
  
   restClient.get('http://localhost:10000/rest/describe?happn_token=' + token).on('complete', function(result){

      //the description is in the current format:
      //TODO: update description to show example calls
      
      done();
    });
    
    // or call a component over the exchange, the operation contains the parameters for the method
    // methods are called via the URI /rest/method/[component name]/[method name]
    
     var restClient = require('restler');
    
        var operation = {
          parameters:{
            'opts':{'number':1}
          }
        };
        restClient.postJson('http://localhost:10000/rest/method/testComponent/testMethod', operation).on('complete', function(result){
    
          expect(result).to.be(3);
 
          done();
        });

});

```

*for unsecured meshes, no login is required, see [the test for now](https://github.com/happner/happner/blob/master/test/e3a-rest-component.js)*

