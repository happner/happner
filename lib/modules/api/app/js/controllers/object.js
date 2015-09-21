mesh_api_describe.controller('new_object', ['$scope', '$modalInstance', 'dataService', function($scope, $modalInstance, dataService) {

	  $scope.message = {type:'alert-warning', message:'', display:'none'};
	  $scope.data = {path:'', data:[]}; 

	  $scope.settings = {template:{path:'None'}, typ:'object', types:['object','array'], json:null};


	  var cleanTemplate = function(templateData){

	  	if (templateData instanceof Array)
	  	templateData.map(function(item, index, array){

	  		console.log('templateData cleaning');
	  		console.log(item);
	  		console.log(item['data']);

	  		if (item['_id'])
	  			delete item['_id'];

	  		if (item['data'])
	  			item = item['data'];

	  		console.log('item cleaned');
	  		console.log(item);

	  		array.splice(index, 1, item);

		  });
		  else{
		  	if (templateData['_id'])
	  			delete templateData['_id'];

	  		if (templateData['data'])
	  			templateData = templateData['data'];
		  }

		console.log('templateData cleaned');
	  	console.log(templateData);

	  	return templateData;

	  }

	  var checkPath = function(path){

	  				if (path == '' || path.length < 10)
	  					return 'Path must be at least 10 characters long';

					if (path.match(/[.\\:@]$/))
						return 'Bad path, cannot contain characters .\\:@';

					return 'ok';
		
	  };

	   dataService.client.get('/happn/templates/*', null, function(e, results){

	   	   results.payload.push({path:'None'});

           $scope.templates = results.payload;
           $scope.$apply();

           $scope.ok = function () {
				var okToSave = false;

				var pathCheck = checkPath($scope.data.path);

				if (pathCheck != 'ok')
					showMessage('alert-warning', pathCheck);
				else
					okToSave = true;

				if (okToSave){
					console.log($scope);
					
					if ($scope.settings.template && $scope.settings.template.path != 'None')
						$scope.data.data = cleanTemplate($scope.settings.template.data);
					else if ($scope.settings.json != '' && $scope.settings.json != null){
						try{
							$scope.data.data = JSON.parse($scope.settings.json);
						}catch(e){
							okToSave = false;
							showMessage('alert-warning', 'BAD JSON: ' + e);
						}
					}
					else{
						if ($scope.settings.typ == 'object')
							$scope.data.data = {};
						else 
							$scope.data.data = [];
					}

					console.log('$scope.data.data');
					console.log($scope.data.data);

					dataService.client.set($scope.data.path, $scope.data.data, null, function(e, result){

						console.log('did set');
						console.log($scope.data);
						console.log([e, result]);


						if (!e){
							$modalInstance.close(result.payload);
						}else
							showMessage('alert-warning', 'Failed saving new array: ' + e);

					});
				}
		  };

		  $scope.cancel = function () {
		    $modalInstance.dismiss('cancel');
		  };

        });

	  var showMessage = function(type, message){
		  $scope.message.type = type;
		  $scope.message.message = message;
		  $scope.message.display = 'block';
	  };
	  
	  
	  
	  
}]);