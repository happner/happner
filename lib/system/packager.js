// A preliminary work toward asset packaging (minify, gzip, etag, etc.)
// The ideal would be a per component widget assembly line.
// Allows for serving individual scripts development. 
// This one packages only the core /client/api script from ./api.js and it's dependancies

module.exports = Packager;

var fs = require('fs')
  , zlib = require('zlib')
  , md5 = require('md5')
  , Promise = require('bluebird')
  , minifyJS = require('uglify-js').minify
  ;


function Packager(mesh) {

  this.log = mesh.log.createLogger('Packager');
  mesh.tools.packages = this.packages = {};

  this.scripts = [
    { watch: false, min: false, file: __dirname + '/../../resources/bower/bluebird/js/browser/bluebird.js' },
    { watch: false, min: false, file: process.env.PRIMUS_SCRIPT || mesh._mesh.datalayer.server.services.pubsub.script },
    { watch: true,  min: false, file: __dirname + '/../../node_modules/happn/lib/client/base.js'},
    { watch: true,  min: false, file: __dirname + '/api.js' },
              //
             // When not running NODE_ENV=production the package is re-assembled
            // when this file changes.
  ]

  this.merged = {}; // final product, merges scripts

}

Packager.prototype.initialize = function(callback) {

  this.log.$$DEBUG('Building /api/client package');

  var readFile = Promise.promisify(fs.readFile);
  var lstat = Promise.promisify(fs.lstat);
  var gzip = Promise.promisify(zlib.gzip);
  var _this = this;



  // if (process.env.NODE_ENV == 'production') { /*   */ }


  return Promise.all(

    _this.scripts.map(function(script) {

      return new Promise(function(resolve, reject) {

        // handle each script object

        if (process.env.NODE_ENV == 'production' && !script.min) {

          var gotMinFile = script.file.replace(/\.js$/, '.min.js');

          lstat(gotMinFile)

          .then(function() {
            script.file = gotMinFile;
            script.min = true;
            resolve(script);
          })

          .catch(function() {
            resolve(script);
          });

          return
        }

        // Not production
        resolve(script);
      });
    })
  )

  // Read the files

  .then(function(scripts) {
    return Promise.all(
      scripts.map(function(script) {
        return readFile(script.file);
      })
    );
  })

  // Load the buffer data onto the scripts array

  .then(function(buffers) {
    return new Promise(function(resolve, reject) {
      buffers.forEach(function(buf, i) {
        _this.scripts[i].buf = buf;
      });
      resolve();
    });
  })

  // TODO: Watch where necessary...
  //   In non production mode, it would 
  //   be ideal if changes to the component scripts
  //   were detected, averting the need to restart the
  //   server to get the updated script to the browser.

  // Minifi if production

  .then(function() {
    return new Promise(function(resolve, reject) {
      _this.scripts.forEach(function(script) {
        if (process.env.NODE_ENV == 'production' && !script.min) {
          script.buf = minifyJS(script.buf.toString(), {fromString: true}).code;
        }
      });
      resolve();
    });
  })

  // Assemble the package.

  .then(function() {
    return new Promise(function(resolve, reject) {

      _this.merged.script = '';
      _this.scripts.forEach(function(script) {
        _this.merged.script += script.buf.toString() + '\n';
      });
      _this.merged.md5 = md5(_this.merged.script);

      gzip(_this.merged.script)

      .then(function(zipped) {
        _this.merged.data = zipped;
        _this.merged.gzip = true;
        resolve();
      })

      .catch(function(){

         _this.merged.data = _this.merged.script
         _this.merged.gzip = false;
         resolve();
      })
    });
  })
    

  .then(function() { 

    Object.defineProperty(_this.packages, 'api', {
      value: _this.merged
    });

    _this.log.$$DEBUG('done');

    callback(null);
  })

  .catch(callback);

}
