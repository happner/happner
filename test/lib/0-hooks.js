var http = require('http');

module.exports = function() {

  // this runs once per calling testfile before all its tests

  before(function() {

    // flush require cache, means that subsequent requiring of
    // modules will reload entirely - forcing internal scope vars
    // to also be refreshed, eg. happn is reloaded inside mesh.js

    Object.keys(require.cache).forEach(function(key) {
      delete require.cache[key]
    });

    // new mesh object for use in tests

    this.Mesh = require('../../lib/mesh');

    // stub http create server to get a copy of all created servers
    // so that we can stop them in the after hook and get rid of all
    // EADDRINUSE errors
    //
    // TODO: mesh.stop() would be better!!

  //   this.servers = [];
  //   this.origCreateServer = http.createServer;
  //   var _this = this;

  //   http.createServer = function() {
  //     // intercept server creation to get ref to it
  //     var server;
  //     _this.servers.push(server = _this.origCreateServer.apply(null, arguments));

  //     // return server to whoever was calling http.createServer()
  //     return server;
  //   }

  });




  // this runs once per calling testfile after all its tests

  after(function() {

    // stop all servers created

    // this.servers.forEach(function(server) {
    //   server.close();
    // });

    // // restore original http.createServer()
    // // not really necessary since we're flushing the require cache
    // http.createServer = this.origCreateServer;

  });

}