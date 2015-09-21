grid_app.controller('part_chart_cpu', 
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

	    $scope.colors = ['#00a65a','#f39c12'];
		$scope.labels = [];

		$scope.series = ['CPU %', 'Memory %'];

		$scope.data = [
			[],//calls/sec
			[]
		];

		$scope.lastTime = new Date();

		$scope.range = 200;

		for (var i = 0; i < $scope.range; i++){
			$scope.labels.push('');
			$scope.data[0].push(0);
			$scope.data[1].push(0);
		}

		$scope.onClick = function (points, evt) {
		    console.log(points, evt);
		  };


		$scope.$on('statsChanged', function (event, stats) {
           
          var now = moment(new Date()).format('hh:mm');

          if (now != $scope.lastTime){
          	$scope.labels.unshift(now);
          }
		  else
		  	$scope.labels.unshift('');

    
          var percentageMemory = stats.usage.memoryInfo.rss / stats.usage.memoryInfo.vsize * 100;

          $scope.labels.pop('');

		  $scope.data[0].unshift(stats.usage.cpu);
		  $scope.data[1].unshift(percentageMemory);
		  
		  $scope.data[0].pop();
		  $scope.data[1].pop();
		  
		  $scope.lastTime = now.toString();



		  
        })

	}]
);
