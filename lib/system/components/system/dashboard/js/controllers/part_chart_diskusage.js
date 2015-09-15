grid_app.controller('part_chart_diskusage', 
	['$scope', 
    '$modal', 
    function($scope, $modal) {
       
      $scope.colors = ['#00a65a','#f39c12','#00c0ef'];
      $scope.labels = ["Free", "Happner", "System"];
      $scope.data = [0,0,0];

      $scope.onClick = function (points, evt) {
            console.log(points, evt);
      };

      $scope.$on('statsChanged', function (event, stats) {

          var system = (stats.dbfile.disk.total - stats.dbfile.disk.free - stats.dbfile.size) / 1000;
          var dbfile = stats.dbfile.size / 1000;
          var free = stats.dbfile.disk.free / 1000;

          $scope.data = [free, dbfile, system];
      })
        
    }]
);
