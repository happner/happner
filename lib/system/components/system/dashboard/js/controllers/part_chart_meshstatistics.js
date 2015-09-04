grid_app.controller('part_chart_meshstatistics', 
	['$scope', 
	'$modal', 
	'dataService',
	function($scope, $modal, dataService) {
		
		$scope.options = {
	      animation: false,
	      showScale: false,
	      showTooltips: false,
	      pointDot: false,
	      datasetStrokeWidth: 0.5
	    };

		$scope.labels = [];
		$scope.labelsDict = {};

		$scope.series = ['calls/sec', 'emits/sec', 'errors/sec'];

		$scope.data = [
			[],//calls/sec
			[],//emits/sec
			[]//errors/sec
		];

		$scope.$on('statsChanged', function (event, stats) {
           
          $scope.now = moment(new Date()).format('MM dd hh:mm');

          if (!$scope.labelsDict[$scope.now]){
          	$scope.labels.push($scope.now);
          	$scope.labelsDict[$scope.now] = true;
          }else{
          	$scope.labels.push('');
          }

		  $scope.data[0].push(stats.totalCalls);
		  $scope.data[1].push(stats.totalEmits);
		  $scope.data[2].push(stats.totalErrors);

		  $scope.onClick = function (points, evt) {
		    console.log(points, evt);
		  };

        })
	    
	}]
);
