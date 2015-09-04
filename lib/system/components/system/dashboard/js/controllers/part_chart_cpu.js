grid_app.controller('part_chart_cpu', 
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

	    $scope.colors = ['#00a65a','#f39c12'];
		$scope.labels = [];

		$scope.series = ['CPU %', 'Memory %'];

		$scope.data = [
			[],//calls/sec
			[]
		];

		$scope.$on('statsChanged', function (event, stats) {
           
          
          $scope.labels.push('');

        

          var percentageMemory = stats.usage.memoryInfo.rss / stats.usage.memoryInfo.vsize * 100;

		  $scope.data[0].push(stats.usage.cpu);
		  $scope.data[1].push(percentageMemory);
		 
		  console.log('percentageMemory', percentageMemory);

		  $scope.onClick = function (points, evt) {
		    console.log(points, evt);
		  };

        })

	}]
);
