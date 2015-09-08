grid_app.controller('part_chart_meshstatistics', 
	['$scope', 
	'$modal', 
	function($scope, $modal) {
		
		$scope.options = {
	      animation: false,
	      showScale: true,
	      showTooltips: false,
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

		$scope.lastTime = null;

		$scope.range = 200;

		$scope.onClick = function (points, evt) {
		    console.log(points, evt);
		};
		
		for (var i = 0; i < $scope.range; i++){
			$scope.labels.push('');
			$scope.data[0].push(0);
			$scope.data[1].push(0);
			$scope.data[2].push(0);
		}

		 console.log('$scope.data start', $scope.data);

		$scope.$on('statsChanged', function (event, stats) {
           
          //we push a lable in every minute

          var now = moment(new Date()).format('hh:mm');

          if (now != $scope.lastTime)
		  	$scope.labels.unshift(now);
		  else
		  	$scope.labels.unshift('');

		  $scope.labels.pop('');

		  $scope.data[0].unshift(stats.callsPerSec);
		  $scope.data[1].unshift(stats.emitsPerSec);
		  $scope.data[2].unshift(stats.errorsPerSec);

		  $scope.data[0].pop();
		  $scope.data[1].pop();
		  $scope.data[2].pop();
          
         
		 
		  $scope.lastTime = now.toString();

		  $scope.$apply();

        });
	    
	}]
);
