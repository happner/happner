grid_app.controller('part_chart_meshstatistics', 
	['$scope', 
	'$modal', 
	'dataService',
	function($scope, $modal, dataService) {
		
		$scope.options = {
	      animation: false,
	      showScale: false,
	      showTooltips: true,
	      pointDot: false,
	      datasetStrokeWidth: 1.5
	    };

	    $scope.colors = ['#00a65a','#f39c12','#dd4b39'];
		$scope.labels = [];
		$scope.series = ['calls/sec', 'emits/sec', 'errors/sec'];

		$scope.data = [
			[],//calls/sec
			[],//emits/sec
			[]//errors/sec
		];

		$scope.$on('statsChanged', function (event, stats) {
           
		  $scope.labels.push('');
          
		  $scope.data[0].push(stats.callsPerSec);
		  $scope.data[1].push(stats.emitsPerSec);
		  $scope.data[2].push(stats.errorsPerSec);

		  $scope.onClick = function (points, evt) {
		    console.log(points, evt);
		  };

        })
	    
	}]
);
