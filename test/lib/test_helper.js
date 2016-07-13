var async = require('async');
var Mesh = require('../../');
var fs = require('fs');

module.exports = {
  __happnerClients: {},
  __addHappnerClient: function (ctx, client) {
    if (!this.__happnerClients[ctx])
      this.__happnerClients[ctx] = [];

    this.__happnerClients[ctx].push(client);
  },
  __happnerInstances: {},
  __addHappnerInstance: function (ctx, instance, config) {
    if (!this.__happnerInstances[ctx])
      this.__happnerInstances[ctx] = [];

    this.__happnerInstances[ctx].push({instance: instance, config: config});
  },
  startHappnerInstance: function (ctx, config, callback) {

    var _this = this;

    if (!ctx)
      ctx = 'default';

    if (typeof config == 'function') {
      callback = config;
      config = null;
    }

    Mesh.create(config, function (e, instance) {
      if (e) return callback(e);

      _this.__addHappnerInstance(ctx, instance, config);

      var client = new Mesh.MeshClient({port: config.datalayer.port ? config.datalayer.port : 55000});
      var loginParams = {

        username: '_ADMIN',
        password: config.datalayer.adminPassword ? config.datalayer.adminPassword : 'happn'

      }

      client.login(loginParams).then(function (e) {
        if (e) return callback(e);
        _this.__addHappnerClient(ctx, client);
        callback(null, instance, client);
      });

    });
  },
  stopHappnerInstances: function (ctx, callback) {
    var _this = this;
    var index = 0;

    async.eachSeries(_this.__happnerInstances[ctx], function (started, stopCallback) {

      started.instance.stop(function (e) {

        if (e) return stopCallback[e];
        if ((started.config && started.config.datalayer && started.config.datalayer.filename) || (started.config && started.config.data && started.config.data.filename)) {

          var dbPath;
          if (started.config.datalayer)
            dbPath = started.config.datalayer.filename;

          if (started.config.data)
            dbPath = started.config.data.filename;

          fs.unlinkSync(dbPath);
        }

        stopCallback();
      });
    }, function (e) {
      if (e) return callback(e);
      _this.__happnerInstances[ctx] = [];
      callback();
    });
  },
  exec: function (ctx, command, callback) {

  },
  kill: function (ctx, callback) {

  }
}
