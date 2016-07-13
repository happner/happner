/*// cannot do mocha test/4-mesh-to-mesh.js --watch
 // address already in use for 2nd... runs

 var spawn = require('child_process').spawn
 , sep = require('path').sep
 , remote
 , assert = require('assert')
 , mesh
 , request = require('request');

 var sep = require('path').sep;
 var libFolder = __dirname + sep + 'lib' + sep;

 config = {
 name: 'cloud',
 dataLayer: {
 port: 3002,
 authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
 secret: 'mesh',
 },
 endpoints: {},
 modules: {},
 components: {}
 };

 describe('Proxy component', function() {

 this.timeout(10000);

 before(function(done) {

 var _this = this;


 mesh = new _this.Mesh();

 mesh.initialize(config, function(err) {

 if (err) return done(err);

 // spawn remote mesh in another process
 remote = spawn('node',[libFolder + '14-proxy-mesh']);
 remote.stdout.on('data', function(data) {

 console.log('Remote:',data.toString());
 if (!data.toString().match(/ready/)) return;

 console.log('waiting for remote up');
 setTimeout(done, 3000);
 });

 remote.on('error', function(e) {
 console.log(e);
 });

 remote.on('exit', function() {
 console.log('exit', arguments);
 });

 });

 });

 after(function(done) {
 remote.kill();

 if (mesh)
 return mesh.stop(done);

 done();
 })

 context('testing the proxy', function() {

 it ("can proxy the dashboard page",function(done) {

 request('http://127.0.0.1:3002/Device1/dashboard/page', function (error, response, body) {

 console.log(arguments);

 if (error) return done(error);

 return done();

 });

 });

 it ("can proxy a static resource",function(done) {

 request('http://127.0.0.1:3002/Device1/module-static/controls', function (error, response, body) {

 console.log(arguments);

 if (error) return done(error);

 return done();

 });

 });

 it ('can proxy mesh api requests', function(done) {

 mesh.api.exchange.Device1.getReading('test', function(err, res) {

 console.log(arguments);

 done(err);
 });

 });

 });

 });
 */
