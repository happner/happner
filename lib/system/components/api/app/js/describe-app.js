'use strict';

/* App Module */

//var ideControllers = angular.module('ideControllers', []);

//////console.log('registering app');

var mesh_api_describe = angular.module('mesh_api_describe', [  
  'ui.bootstrap',                                            
  'ngAnimate',
  'happn',
  'JSONedit'
]);

var registerDataService = function (serviceName) {
  mesh_api_describe.factory(serviceName, function (happnClient) {
        var _happn = null;
        
        return {
            instance:happnClient,
            init: function (host, port, secret, done) {
              happnClient.connect(host, port, secret, done);
            },
            traverse:function(data, path, done){
              try
              {
                var currentNode = data;
                var found = false;
                
                if (path[0] = '/')
                  path = path.substring(1, path.length);
              
                  path.split('/').map(function(current, index, arr){
                    currentNode = currentNode[current];
                    if (index + 1 == arr.length && currentNode){
                      found = true;
                      done(null, currentNode);
                    }
                  });
                  
                  if (!found)
                    done(null, null);
              }catch(e){
                done(e);
              }
              
            }
        };
    });
};

registerDataService('dataService');

mesh_api_describe.controller('meshAPIDescribeController', ['$scope', '$modal', 'dataService', '$window', function($scope, $modal, dataService, $window) {

    $scope.rootPaths = [];
    $scope.selectedPath = "";
    $scope.selectedData = null;
    $scope.pathFilter = "/*";
    $scope.authenticated = false;
    $scope.dburl = "127.0.0.1";

    $scope.dbport = window.location.port.toString();
    $scope.dbsecret = "mesh";

    $scope.openModal = function (templatePath, controller, handler, args) {
            var modalInstance = $modal.open({
              templateUrl: templatePath,
              controller: controller,
              resolve: {
                data: function () {
                  return $scope.data;
                },
                args: function () {
                  return args;
                }
              }
            });

      if (handler)
          modalInstance.result.then(handler.saved, handler.dismissed);
     };
          
     $scope.openNewModal = function (type, action) {
         
         var handler = {
                 saved:function(result){
                    //////console.log('result');
                    //////console.log(result);
                 },
                 dismissed:function(){
                    
                 }
         };
         
         return $scope.openModal('../templates/' + action + '.html', action.toString(), handler);
     };
     
    $scope.to_trusted = function(html_code) {
          return $sce.trustAsHtml(html_code);
    };
     
    $scope.toArray = function(items){
        var returnArray = [];
        for (var item in items)
            returnArray.push(item);
        return returnArray;
    };

    $scope.authenticate = function(){

     new MeshClient($scope.dburl, $scope.dbport, $scope.dbsecret, function(e, client){
        if (!e){

          $scope.meshAPIClient = client;
          $scope.authenticated = true;
          $scope.selectedData = client._mesh.description.components;

          client.api.exchange.api.test('testing api', function(e, result){

            if (e || result != 'testing api tested ok')
              $scope.api_test_failed = true;
            else
              $scope.api_tested = true;

            $scope.$apply();
          });

        }else{
          //TODO - handle failure here
        }
      });
    }

}]);

