'use strict';

/* App Module */

var grid_app = angular.module('grid_app', [  
  'ui.bootstrap',                                            
  'ngAnimate',
  'happn',
  'chart.js',
  'angularMoment'
]);

grid_app.config(['ChartJsProvider', function (ChartJsProvider) {

    // Configure all charts
    ChartJsProvider.setOptions({
      colours: ['#FF5252', '#FF8A80'],
      responsive: false
    });
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {
      datasetFill: false
    });

}]);


var registerDataService = function (serviceName) {
	grid_app.factory(serviceName, function (happnClient) {
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

grid_app.controller('meshDashBoardController', ['$scope', '$modal', 'dataService', '$window', function($scope, $modal, dataService, $window) {

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
    

    $scope.dataBindInformation = function(sysInfo){
      if (!$scope.managed)
         $scope.managed = {components:[]};

      $scope.managed.name = sysInfo.system.meshName;
      
      for (var componentName in $scope.meshAPIClient._mesh.config.components){

        var componentConfig = $scope.meshAPIClient._mesh.description.components[componentName];
        componentConfig.name = componentName;

        $scope.managed.components.push(componentConfig);
      }

      $scope.$apply();
    }

    $scope.dataBindStatistics = function(stats){
      $scope.stats = stats;
      $scope.$broadcast('statsChanged', stats);
      $scope.$apply();
    }

    $scope.attachStatistics = function(){

      $scope.meshAPIClient.api.event.system.on('stats/system', function(emitted){

        console.log('system stats update: ', emitted);
        $scope.dataBindStatistics(emitted.payload.data);

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
            $scope.selectedData = client._mesh.description.components;

             $scope.meshAPIClient.api.exchange.system.getStats(false, function(e, systemInfo){
              $scope.dataBindInformation(systemInfo);
              $scope.attachStatistics();
            });

          }else{
            //TODO - handle failure here
          }
      });
    }
}]);

