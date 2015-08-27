var async = require('async');
var MeshError = require('../../error');
var moment = require('moment');
var os = require('os');
var usage = require('usage');

module.exports = function () {
  return new System();
};

function System() {
	var _this = this;

	_this.activateStatistics = function($happn, interval){

		if (!interval)
			interval = 5000;

		console.log('in activateStatistics', $happn);

		var stats = function(){

			var upTime = moment.utc() - _this.__systemUp;
			var statistics = JSON.parse(JSON.stringify($happn.stats));
			statistics.system = _this.systemInfo($happn);

			var pid = process.pid // you can use any valid PID instead
			usage.lookup(pid, function(err, result) {

				if (err) return $happn.log.error("Failure to fetch cpu usage stats: ", e);

				statistics.usage = result;
				$happn.emit('stats/system', statistics);
			});

			/*
			{
				proc:{
					upTime:upTime
				},
				components:{},

			};
			*/



			/*
			for (var componentName in $happn.api.exchange){
				if (componentName != 'system'){
					statistics[componentName] = $happn.api.exchange[componentName].stats();
				}
			}
			*/

	       
		}

		_this.statsInterval = setInterval(stats, interval)

	}

	_this.deactivateStatistics = function($happn){

	}

	_this.systemInfoCached;
	_this.systemInfo = function($happn){

		if (!_this.systemInfoCached){
			_this.systemInfoCached = {
				host:os.hostname(),
				type:os.type(),
				platform:os.platform(),
				arch:os.arch(),
				release:os.release(),
				totalmem:os.totalmem(),
				freemem:os.freemem(),
				cpus:os.cpus()
			}
		}

		return _this.systemInfoCached;
	}

};