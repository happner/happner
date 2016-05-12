/**
 * Created by simonbishop on 2016/05/09.
 */

var nanobar;

setInterval(function(){
  try{

    if (Nanobar && !nanobar){
      nanobar = new Nanobar( {id:"progress-bar"} );
    }

    if (promise){
      promise.get('/progress').then(function(error, text, xhr) {
        if (error) {
          return;
        }
        var progress = JSON.parse(text);
        console.log(progress);

        var latest = progress[progress.length - 1];
        nanobar.go(latest.percentComplete);

        document.getElementById("progress-log").innerHTML = latest.log;

      });
    }


  }catch(e){
    //do nothing...
  }
}, 2000);
