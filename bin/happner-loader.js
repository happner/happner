var LoaderProgress = require('../lib/startup/loader_progress.js');
var args = {};

var __happnerCommand = "happner-daemon --loader";
var __happnerConfig = {};
var __loaderConfig = {};

var conf = false;

process.argv.forEach(function (val, index) {

  if (["happner-loader", "node"].indexOf(val) == -1){

    if (conf){
      __happnerConfig  = require(val);
      conf = false;
    }else{
      if (val == "--conf"){
        conf = true;
      }
    }
    this.__happnerCommand += val;

  }
});

if (__happnerConfig["happner-loader"]){
  __loaderConfig = __happnerConfig["happner-loader"];
}

if (__happnerConfig["port"])
  __loaderConfig["port"] = __happnerConfig["port"];

console.log('starting progress:::', JSON.stringify(__loaderConfig));

var loaderProgress = new LoaderProgress(__loaderConfig);

loaderProgress.listen(function(e){

  if (e){
    console.log(e);
    return process.exit(1);
  }

  console.log('forking happner:::', __happnerCommand);

});







