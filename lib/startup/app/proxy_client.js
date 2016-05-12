/**
 * Created by simonbishop on 2016/05/09.
 */

var nanobar;
var config = {};

var fetchedConfig = false;

var getProgress = function(){

  if (Nanobar && !nanobar){
    nanobar = new Nanobar( {id:"progress-bar"} );
  }

  if (!fetchedConfig){
    promise.get('/config').then(function(error, text, xhr) {
      if (error) {
        return;
      }

      config = JSON.parse(text);
      fetchedConfig = true;
    });
  }

  promise.get('/progress').then(function(error, text, xhr) {
    if (error) {
      return;
    }
    var progress = JSON.parse(text);
    var latest = progress[progress.length - 1];
    nanobar.go(latest.percentComplete);
    document.getElementById("progress-log").innerHTML = latest.log;

  });
}

var interval = setInterval(function(){

  try{

    if (promise){
      promise.get('/ping').then(function(error, text, xhr) {
        if (text == 'pong') {
          if (config.redirect)
            window.location.href = config.redirect;
          else{
            nanobar.go(100);
            document.getElementById("progress-log").innerHTML = 'Happner is up!';
            clearInterval(interval);
          }

        }
        else
          getProgress();

      });
    }

  }catch(e){
    //do nothing...
  }
}, 2000);
