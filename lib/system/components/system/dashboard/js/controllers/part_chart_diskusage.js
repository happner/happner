grid_app.controller('part_chart_diskusage', 
	['$scope', 
    '$modal', 
    'dataService', 
    function($scope, $modal, dataService) {
       
       $scope.labels = ["Free", "Happner", "System"];
       $scope.data = [10, 30, 60];

       $scope.onClick = function (points, evt) {
            console.log(points, evt);
        };

       $scope.$on('statsChanged', function (event, stats) {
            $scope.data = [5, 35, 60];
        })
        
    }]
);
