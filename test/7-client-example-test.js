// describe('Client example', function() {

//   require('./lib/0-hooks')();

//   var Browser = require('zombie');
//   var spawn = require('child_process').spawn;
//   var sep = require('path').sep;
//   var remote;
//   var assert = require('assert');
//   var origConsoleLog = console.log;

//   var sep = require('path').sep;
//   var libFolder = __dirname + sep + 'lib' + sep;

//   // Spawn mesh in another process.
//   before(function(done) {
//     remote = spawn('node',[libFolder + '7-client-example-process.js']);
//     remote.stdout.on('data', function(data) {
//       console._stdout.write(data.toString());
//       if (!data.toString().match(/READY/)) return;
//       done();
//     });
//   });
//   after(function(done) {
//     console.log = origConsoleLog;
//     remote.kill();
//     done();
//   })

//   // zombie problem
//   // it('accesses the clientside api', function(done) {

//   //   this.timeout(100000);
//   //   var browser = new Browser();
//   //   console.log = function(msg) {
//   //     if (msg && msg.match && msg.match(/CLIENT DONE/)) return done()
//   //     origConsoleLog.apply(this, arguments);
//   //   }

//   //   browser.visit(
//   //     'http://localhost:3001/ExampleMesh/ExampleComponent/staticContent/test.html', 
//   //     function(e) {
//   //       if (e) return done(e);
//   //     }
//   //   );
//   // });



// })
