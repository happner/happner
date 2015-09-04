grid_app.controller('part_chart_cpu', 
	['$scope', 
	'$modal', 
	'dataService', 
	function($scope, $modal, dataService) {

		$scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
		$scope.series = ['Series A', 'Series B'];

		$scope.data = [
		    [65, 59, 90, 81, 56, 55, 40],
		    [28, 48, 20, 19, 80, 27, 100]
		];

		$scope.$on('statsChanged', function (event, stats) {
           
		  $scope.data = [
		    [65, 59, 80, 81, 56, 55, 40],
		    [28, 48, 40, 19, 86, 27, 90]
		  ];

		  $scope.onClick = function (points, evt) {
		    console.log(points, evt);
		  };

        })
	    
	}]
);
