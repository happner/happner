var async = require('async');
var MeshError = require('../../system/error');
var moment = require('moment');
var os = require('os');
var procStats = require('proc-stats');
var fs = require('fs-extra');
var diskspace = require('diskspace');
var Logger = require('happn-logger');

module.exports = function () {
  return new System();
};

function System() {
	var _this = this;

	_this.__systemUp = moment.utc();
	_this.__lastMeasurement = null;

	_this.initialize = function($happn, callback){		
		callback(null);
	}

	_this.activateStatistics = function($happn, interval){

		_this.deactivateStatistics();

		if (!interval)
			interval = 3000;

		_this.__statsInterval = interval;
		_this.__statsIntervalPointer = setInterval(function(){
			var stats = _this.getStats($happn, true, function(e, stats){
				if (e) return $happn.log.error("failure to produce stats", e);

				$happn.emit('stats/system', stats);
			});

		}, 
		_this.__statsInterval);

	}

	_this.deactivateStatistics = function($happn){
		if (_this.__statsIntervalPointer)
			clearInterval(_this.__statsIntervalPointer);
	}

	_this.getDBFileInfo = function($happn, callback){

		 // $happn.info.datalayer... (would be better)
		if ($happn._mesh.data.context.services.data.config && $happn._mesh.data.context.services.data.config.dbfile)
			fs.stat($happn._mesh.data.context.services.data.config.dbfile, function(e, filestats){
			
				if (e) return callback(e);

				filestats.filename = $happn._mesh.data.context.services.data.config.dbfile;

				diskspace.check('/', function (e, total, free, status){
				   if (e) return callback(e);

				   filestats.disk = {};
				   filestats.disk.total = total;
				   filestats.disk.status = status;
				   filestats.disk.free = free;
				  
				   callback(null, filestats);

				});

			});
		else callback();
	}

	_this.getStats = function($happn, measureInterval, callback){

		try{
			var _this = this;
			var upTime = moment.utc() - _this.__systemUp;
			var statistics = JSON.parse(JSON.stringify($happn.stats));

			statistics.system = _this.systemInfo($happn);
			statistics.system.upTime = upTime;
			statistics.system.meshName = $happn.info.mesh.name;
			statistics.timestamp = moment.utc();

			statistics.totalCalls = 0;
			statistics.totalEmits = 0;
			statistics.totalErrors = 0;

			statistics.logs = Logger.cache;

			var pid = process.pid;

			

			this.getDBFileInfo($happn, function(e, fileinfo){

				if (e) return $happn.log.error("Failure to fetch db file stats: ", e);

				if (fileinfo)
					statistics.dbfile = fileinfo;

				procStats.stats(function(e, result){

					if (e) return $happn.log.error("Failure to fetch cpu usage stats: ", e);

					if (measureInterval){
						if (_this.__lastMeasurement){
							statistics.measurementInterval = (statistics.timestamp - _this.__lastMeasurement.timestamp) / 1000;
						}else{
							statistics.measurementInterval = _this.__statsInterval / 1000;
						}
					}

					for (var componentName in statistics.component){

						var currentComponent = statistics.component[componentName];

						statistics.totalCalls += currentComponent.calls;
						statistics.totalEmits += currentComponent.emits;
						statistics.totalErrors += currentComponent.errors;

						if (measureInterval){
							if (_this.__lastMeasurement){

								var lastComponent = _this.__lastMeasurement.component[componentName];

								statistics.component[componentName].callsPerSec = (currentComponent.calls - lastComponent.calls) / statistics.measurementInterval;
								statistics.component[componentName].emitsPerSec = (currentComponent.emits - lastComponent.emits) / statistics.measurementInterval;
								statistics.component[componentName].errorsPerSec = (currentComponent.errors - lastComponent.errors) / statistics.measurementInterval;

							}else{

								statistics.component[componentName].callsPerSec = currentComponent.calls / statistics.measurementInterval;
								statistics.component[componentName].emitsPerSec = currentComponent.emits / statistics.measurementInterval;
								statistics.component[componentName].errorsPerSec = currentComponent.errors / statistics.measurementInterval;

							}
						}
					}

					if (measureInterval){
						if (_this.__lastMeasurement){
							statistics.callsPerSec = (statistics.totalCalls - _this.__lastMeasurement.totalCalls) / statistics.measurementInterval;
							statistics.emitsPerSec = (statistics.totalEmits - _this.__lastMeasurement.totalEmits) / statistics.measurementInterval;
							statistics.errorsPerSec = (statistics.totalErrors - _this.__lastMeasurement.totalErrors) / statistics.measurementInterval;
						}else{
							statistics.callsPerSec = statistics.callsPerSec / statistics.measurementInterval;
							statistics.emitsPerSec = statistics.emitsPerSec / statistics.measurementInterval;
							statistics.errorsPerSec = statistics.errorsPerSec / statistics.measurementInterval;
						}
					}

					statistics.usage = result;
					_this.__lastMeasurement = statistics;

					callback(null, statistics);

				});
			});

			
		}catch(e){
			callback(e);
		}
	}

	//_this.systemInfoCached;
	_this.systemInfo = function($happn){

		return {
				host:os.hostname(),
				type:os.type(),
				platform:os.platform(),
				arch:os.arch(),
				release:os.release(),
				totalmem:os.totalmem(),
				freemem:os.freemem(),
				cpus:os.cpus()
			};

		/*
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
		*/
	}

};