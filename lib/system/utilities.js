var shortId = require('shortid');
var util = require('util');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var glob = Promise.promisify(require("glob"));
var Logger = require('happn-logger');

var depwarned0 = false;
var depwarned1 = false;
var depwarned2 = false;
var depwarned3 = false;

Object.defineProperty(global, 'UTILITIES', {
  get: function() {
    if (depwarned0) return module.exports;
    console.warn('use of global UTILITIES is deprecated');
    depwarned0 = true;
    return module.exports;
  }
});

Object.defineProperty(module.exports, 'createContext', {
  get: function() {
    if (depwarned1) return Logger.createContext;
    console.warn('use of global UTILITIES.createContext is deprecated');
    depwarned1 = true;
    return Logger.createContext;
  }
});

Object.defineProperty(module.exports, 'createLogger', {
  get: function() {
    if (depwarned2) return Logger.createLogger;
    console.warn('use of global UTILITIES.createLogger is deprecated');
    depwarned2 = true;
    return Logger.createLogger;
  }
});

var log = Logger.createLogger();

Object.defineProperty(module.exports, 'log', {
  get: function() {
    if (depwarned3) return log;
    console.warn('use of global UTILITIES.log is deprecated');
    depwarned3 = true;
    return log;
  }
});

module.exports.getFunctionParameters = function(fn){
  var args = [];
  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  if (typeof fn == 'function') {
    fnText = fn.toString().replace(STRIP_COMMENTS, '');
    argDecl = fnText.match(FN_ARGS);
    argDecl[1].split(FN_ARG_SPLIT).map(function(arg) {
      arg.replace(FN_ARG, function(all, underscore, name) {
        args.push(name);
      });
    });
    return args;
  } else return null;
};

module.exports.node = util;

module.exports.generateID = function(){
  return shortId.generate();
}

module.exports.findInModules = function(filename, modulePaths, callback) {
  if (typeof modulePaths == 'function') {
    callback = modulePaths;
    modulePaths = module.paths;
  }

  var results = [];

  var readdir = Promise.promisify(fs.readdir);
  var lstat = Promise.promisify(fs.lstat);
  var readFile = Promise.promisify(fs.readFile);

  var recurse = function(paths, callback) {

    Promise.all(paths.map(function(modulePath) {

      var isBaseModule = modulePaths.indexOf(modulePath) >= 0;

      return new Promise(function(resolve, reject) {

        readdir(modulePath).then(function(modulesDirs) {

          return Promise.all(modulesDirs.map(function(moduleName) {

            if (moduleName == '.bin') return;

            var targetFile = modulePath + path.sep + moduleName + path.sep + filename;
            var packageFile = modulePath + path.sep + moduleName + path.sep + 'package.json';

            return new Promise(function(resolve, reject) {

              var result = {};

              lstat(targetFile)

              .then(function() {

                // console.log('GOT', target);

                result.moduleName = moduleName;
                result.filename = targetFile;
                result.base = modulePaths.indexOf(modulePath) >= 0;
                result.modulePath = modulePath;

                results.push(result);

                return readFile(packageFile);
              })

              .then(function(packageJson) {

                var version = JSON.parse(packageJson).version;

                result.version = version;

                // Recurse into target's node_modules for more

                recurse([modulePath + path.sep + moduleName + path.sep + 'node_modules'], resolve);

              })

              .catch(resolve); // ignore not got target

            });

          }));

        }).then(resolve).catch(resolve); // ignore readdir error - can't readdir, 
                                        // so can't load modules from there...
      });

    }))

    .then(function(result) {
      callback();
    })

    .catch(callback);
  }

  recurse(modulePaths, function(e) {

    // Sort from longest to shortest
    // Shallowest will win in iteration overwrites

    results = results.sort(function(a, b) {
      if (a.filename.length < b.filename.length) return  1;
      if (a.filename.length > b.filename.length) return -1;
      return 0;
    });

    callback(null, results);
  })

}

module.exports.findFiles = function(patterns, opts, callback){

  Promise.all(patterns.map(function(pattern){
    return glob(pattern, opts)
  })).then(function(matches){

    var result = matches[0];

    for (var i = 1; i < matches.length; i++){
      result = result.concat(matches[i]);
    }

    callback(null, result);

  }).catch(callback);

}