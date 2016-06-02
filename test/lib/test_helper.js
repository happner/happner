var async = require('async');
var Mesh = require('../../');

module.exports = {
  __happnerClients:{},
  __addHappnerClient:function(ctx, client){
    if (!this.__happnerClients[ctx])
      this.__happnerClients[ctx] = [];

    this.__happnerClients[ctx].push(client);
  },
  __happnerInstances:{},
  __addHappnerInstance:function(ctx, instance){
    if (!this.__happnerInstances[ctx])
      this.__happnerInstances[ctx] = [];

    this.__happnerInstances[ctx].push(instance);
  },
  startHappnerInstance:function(ctx, config, callback) {

    var _this = this;

    if (!ctx)
      ctx = 'default';

    if (typeof config == 'function') {
      callback = config;
      config = null;
    }

    Mesh.create(config, function (e, instance) {
      if (e) return callback(e);

      _this.__addHappnerInstance(ctx, instance);

      var client = new Mesh.MeshClient({
        username:'_ADMIN',
        password:config.datalayer.adminPassword?config.datalayer.adminPassword:'happn',
        port:config.datalayer.port?config.datalayer.port:55000
      });

      _this.__addHappnerClient(ctx, client);

      callback(null, instance, client);

    });
  },
  stopHappnerInstances:function(ctx, callback){
    var _this = this;
    var index = 0;

    async.eachSeries(_this.__happnerInstances[ctx], function(instance, stopCallback){
      instance.stop(function(e){
        _this.__happnerInstances[ctx].splice(index, 1);
        _this.__happnerClients[ctx].splice(index, 1);
        if (e) return stopCallback[e];
        index++;
        stopCallback();
      });
    }, callback);
  },
  exec:function(ctx, command, callback){

  },
  kill:function(ctx, callback){

  }
}
