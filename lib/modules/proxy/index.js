var async = require('async');
var MeshError = require('../../system/error');
// var ComponentInstance = require('../../componentInstance');
var http = require('http');
// var proxyMiddleware = require('http-proxy-middleware'); // <-------------- removed from package.json

module.exports = function () {
  return new Proxy();
};

function Proxy() {
	var _this = this;

	_this.__proxied = {};

	_this.addProxy = function($happn, url, target){
		var options = {
	        "target": target, // target host
	        changeOrigin: true,               // needed for virtual hosted sites
	        ws: true // proxy websockets                         
	        // pathRewrite: {
	        //     '^/old/api' : '/new/api'      // rewrite paths
	        // }
	    };

		// create the proxy
		var proxy = proxyMiddleware(url, options);
		$happn.mesh.data.context.connect.use(proxy);
	}

	/*

	_this.__proxyModules = {};
	_this.__proxyComponents = {};

	_this.__proxyWebRequest = function(req, res, next){
		console.log('handling proxy request: ', req.uri.path);
		next();
	}

	_this.__addProxyModule = function(proxyComponentName, proxyComponentConfig, proxyEndpointConfig, proxyEndpointDescription){

		var proxyModule = {instance:{}};
		var methodsToProxy = proxyEndpointDescription.components[proxyComponentName].methods;

		////console.log('creating proxy methods', methodsToProxy);
		for (var methodName in methodsToProxy){
			proxyModule.instance[methodName] = function(){
				console.log('doing proxy...')
			}
		}

		if (proxyComponentConfig.web){
	      try{
	        for (var route in proxyComponentConfig.web.routes){

	          	var routeTarget = proxyComponentConfig.web.routes[route];

                                                                     // see $happn.info.mesh.name
	          	                                                      //
	          	                                                     //
	          	                                                    //
	          	                                                   //
	          	                                                  //  
	          	var meshRoutePath = '/' + proxyComponentConfig.meshName+'/'+proxyComponentName+'/'+route;
	          	
	          	//console.log('route stuff:::',routeTarget, meshRoutePath);

	      		if (!UTILITIES.node.isArray(routeTarget))
	      			routeTarget = [routeTarget];

      		 	routeTarget.map(function(targetMethod){
		          //console.log('mapping target method: ' + targetMethod);

		          if (targetMethod == 'static')
		          	targetMethod = 'staticProxied'

	              proxyModule.instance[targetMethod] = _this.__proxyWebRequest;
	            });
				       
	        }
	      }catch(e){
	        UTILITIES.log("Failure to attach modules web methods to component: " + _this.name, "error", _this.name);
	        return callback(e);
	      }
	    }
	
		_this.__proxyModules[proxyComponentConfig.moduleName] = proxyModule;
		return proxyModule;
	}


	_this.__addProxyComponent = function($happn, proxyComponentName, proxyComponentConfig, proxyEndpointConfig, proxyEndpointDescription, callback){

      var componentInstance = new ComponentInstance();
      
      componentInstance.mesh = $happn.mesh;
      componentInstance.name = proxyComponentName;
      proxyComponentConfig.meshName = proxyEndpointDescription.name;

																					

      // proxyComponentConfig.setOptions = $happn.setOptions;

      // see $happn.info.datalayer.options
      //     - keep the component config pristine...
      


      proxyComponentConfig.isProxy = true;

      var proxyModule = _this.__addProxyModule(proxyComponentName, proxyComponentConfig, proxyEndpointConfig, proxyEndpointDescription);

      //console.log('proxy mod', proxyModule);

	  componentInstance.initialize(
	        proxyModule,
	        proxyComponentConfig,
	        function(e){

	        	//console.log('init error:', e);

	          if (e) return callback(e);

	          _this.__proxyComponents[proxyComponentName] = {"instance":componentInstance, "config":proxyComponentConfig};
	          callback();
		    }
	  	);
    }

	_this.__addProxyComponent = function($happn, proxyComponentName, proxyComponentConfig, proxyEndpointConfig, proxyEndpointDescription, callback){

      var componentInstance = new ComponentInstance();
      
      componentInstance.mesh = $happn.mesh;
      componentInstance.name = proxyComponentName;
      proxyComponentConfig.meshName = proxyEndpointDescription.name;
      proxyComponentConfig.setOptions = $happn.setOptions;
      proxyComponentConfig.isProxy = true;

      var proxyModule = _this.__addProxyModule(proxyComponentName, proxyComponentConfig, proxyEndpointConfig, proxyEndpointDescription);

      //console.log('proxy mod', proxyModule);

	  componentInstance.initialize(
	        proxyModule,
	        proxyComponentConfig,
	        function(e){

	        	//console.log('init error:', e);

	          if (e) return callback(e);

	          _this.__proxyComponents[proxyComponentName] = {"instance":componentInstance, "config":proxyComponentConfig};
	          callback();
		    }
	  	);
    }

    _this.register = function($happn, targetConfig, targetDescription, callback){

		////console.log('registering proxy, targetConfig: ', targetConfig);
		////console.log('registering proxy, targetDescription: ', targetDescription);

		var proxyEndpointConfig = targetConfig.endpoints[$happn.config.meshName];
		var componentsFilter = proxyEndpointConfig.proxy.components?proxyEndpointConfig.proxy.components:'*';

		if (componentsFilter != '*' && !UTILITIES.node.isArray(componentsFilter))
			componentsFilter = [componentsFilter];

		var componentsToProxy = {};

		for (var componentName in targetConfig.components){
			if (componentsFilter == '*')
				componentsToProxy[componentName] = targetConfig.components[componentName];
			else{
				componentsFilter.map(function(componentFilter){
					if (componentFilter.indexOf('*') >= 0 && componentName.indexOf(componentFilter.replace('*', '')) == 0){
						componentsToProxy[componentName] = targetConfig.components[componentName];
					}else if (componentFilter == componentName){
						componentsToProxy[componentName] = targetConfig.components[componentName];
					}
				});
			}
		}



		async.eachSeries(Object.keys(componentsToProxy), function(componentName, eachCallback){
			var proxyComponentConfig = componentsToProxy[componentName];

			_this.__addProxyComponent($happn, componentName, proxyComponentConfig, proxyEndpointConfig, targetDescription, eachCallback);
		},
		function(e){
			if (e) return callback(e);

			$happn.emit('proxy-registered', config, function(e, response){
				if (!e){
					//console.log('proxy was registered ok, config: ', config);
					//console.log('proxy was registered ok, $happn:', $happn);
				}
				callback(e);
	        });
		});

		
	}

    */

	_this.register = function($happn, targetConfig, targetDescription, callback){

		////console.log('registering proxy, targetConfig: ', targetConfig);
		////console.log('registering proxy, targetDescription: ', targetDescription);

		var proxyEndpointConfig = targetConfig.endpoints[$happn.info.mesh.name];
		var componentsFilter = proxyEndpointConfig.proxy.components?proxyEndpointConfig.proxy.components:'*';

		if (componentsFilter != '*' && !UTILITIES.node.isArray(componentsFilter))
			componentsFilter = [componentsFilter];

		var componentsToProxy = {};

		for (var componentName in targetConfig.components){
			if (componentsFilter == '*')
				componentsToProxy[componentName] = targetConfig.components[componentName];
			else{
				componentsFilter.map(function(componentFilter){
					if (componentFilter.indexOf('*') >= 0 && componentName.indexOf(componentFilter.replace('*', '')) == 0){
						componentsToProxy[componentName] = targetConfig.components[componentName];
					}else if (componentFilter == componentName){
						componentsToProxy[componentName] = targetConfig.components[componentName];
					}
				});
			}
		}

		for (var componentName in componentsToProxy){

		}

		
	}

};