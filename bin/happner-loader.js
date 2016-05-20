var LoaderProgress = require('../lib/startup/loader_progress.js');
var args = {};

var __happnerCommand = "./bin/happner-loader-daemon";
var __happnerCommandArguments = [];
var __happnerConfig = {};
var __loaderConfig = {};
var conf = false;
var loglevel = "info";

for (var argIndex in process.argv){
  var val = process.argv[argIndex];

  if (val != "node" && val.indexOf("happner-loader") == -1){

    if (conf){
      __happnerConfig  = require(val);
      conf = false;
    }else{

      if (val == "--conf"){
        conf = true;
      }

      if (val == "--trace"){
        loglevel = "trace";
      }

      if (val == "--debug"){
        loglevel = "debug";
      }

      if (val == "--warn"){
        loglevel = "warn";
      }
    }

    __happnerCommandArguments.push(val);
  }
}

if (__happnerConfig["happner-loader"]){
  __loaderConfig = __happnerConfig["happner-loader"];
}

if (__happnerConfig["port"])
  __loaderConfig["port"] = __happnerConfig["port"];

console.log('starting progress:::', JSON.stringify(__loaderConfig));

var loaderProgress = new LoaderProgress(__loaderConfig);

loaderProgress.listen(function(e){

  Logger = require('happn-logger');
  Logger.configure({logLevel:loglevel});

  var log = Logger.createLogger();

  if (e){
    log.fatal('failed to start proxy listener', e);
    return process.exit(1);
  }

  log.info('forking happner: ' + __happnerCommand + __happnerCommandArguments.join(' '));

  var fork = require('child_process').fork;

  var __remote = fork(__happnerCommand, __happnerCommandArguments);

  __remote.on('message', function(data) {

    var message = data.toString();
    var code  = message.substring(0, 8);
    var messageData = null;

    if (message.indexOf(":::") > -1)
      messageData = message.split(":::")[1];

    if (code == "mesh-log"){
      messageData = JSON.parse(messageData);
      return log[messageData.level](messageData.message);
    }

    if (code == "strt-prg"){
      messageData = JSON.parse(messageData);
      return loaderProgress.progress(messageData.log, messageData.progress);
    }

    if (code == "list-err")
      return log.error("listening error", messageData);


    if (code == "strt-rdy"){
      loaderProgress.stop();
      return __remote.send("listen");
    }

    if (code == "strt-err"){
      log.error("startup error", messageData);
      return __remote.kill();
    }

    if (code == "listenin"){
      log.info("happner process is now listening, killing parent process in 5 seconds");
      setTimeout(function(){//so the message makes it
        process.exit(0);
      }, 5000);

    }

  });

});







