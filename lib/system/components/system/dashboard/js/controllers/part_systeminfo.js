grid_app.controller('part_systeminfo', 
	['$scope', 
	'$modal', 
	'dataService', 
	function($scope, $modal, dataService) {
		
		$scope.$on('statsChanged', function (event, stats) {
          var now = moment(new Date()).format('hh:mm');

          $scope.data = stats;

       		console.log('doing system logs: ', stats);
       		$scope.$apply();
        });

	}]
);
