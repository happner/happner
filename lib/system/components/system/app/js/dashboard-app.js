'use strict';

/* App Module */

var mesh_dashboard_app = angular.module('mesh_dashboard_app', [  
  'ui.bootstrap',                                            
  'ngAnimate',
  'happn',
  'JSONedit'
]);

var registerDataService = function (serviceName) {
	mesh_dashboard_app.factory(serviceName, function (happnClient) {
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

mesh_dashboard_app.controller('meshDashBoardController', ['$scope', '$modal', 'dataService', '$window', function($scope, $modal, dataService, $window) {

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
                 },
                 dismissed:function(){
                    
                 }
         };
         
         return $scope.openModal('../templates/' + action + '.html', action.toString(), handler);
     };
    
    $scope.attachStatistics = function(){
      $scope.meshAPIClient.api.event.system.on('stats/system', function(data){

        console.log('system stats update: ', data);

      }, function(e){

        if (!e)
           $scope.meshAPIClient.api.exchange.system.activateStatistics(3000);

        $scope.$apply();

      });
    }

    $scope.authenticate = function(){
        new MeshClient($scope.dburl, $scope.dbport, $scope.dbsecret, function(e, client){
          if (!e){

            $scope.meshAPIClient = client;
            $scope.authenticated = true;
            $scope.selectedData = client.description.components;

            $scope.attachStatistics();

            console.log(client);

          }else{
            //TODO - handle failure here
          }
      });
    }
}]);

