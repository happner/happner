/**
 * Created by simonbishop on 2016/05/09.
 */

var nanobar;
var config = {};

var fetchedConfig = false;
var lastProgress = -1;

var qs = (function (a) {
  if (a == "") return {};
  var b = {};
  for (var i = 0; i < a.length; ++i) {
    var p = a[i].split('=', 2);
    if (p.length == 1)
      b[p[0]] = "";
    else
      b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
})(window.location.search.substr(1).split('&'));

var __progressControl = document.getElementById("progress-bar");

var getProgress = function () {

  if (Nanobar && !nanobar) {
    nanobar = new Nanobar({target: __progressControl});
  }

  if (!fetchedConfig) {
    promise.get('/config').then(function (error, text, xhr) {
      if (error) {
        return;
      }
      config = JSON.parse(text);
      fetchedConfig = true;
    });
  }

  promise.get('/progress').then(function (error, text, xhr) {
    if (error) {
      return;
    }
    var progress = JSON.parse(text);
    var latest = progress[progress.length - 1];

    if (!latest)
      latest = {"log": "starting", "progress": 0};

    if (lastProgress != latest.progress) {
      nanobar.go(latest.progress);
      document.getElementById("progress-log").innerHTML = latest.log + '... ' + latest.progress + '% complete';
      lastProgress = latest.progress;
    }

    if (latest.error) {
      document.getElementById("message-log").innerHTML = latest.error;
    }
  });

  if (qs["verbose"] == "true") {
    document.getElementById("message-log").innerHTML = "";
    promise.get('/log').then(function (error, text, xhr) {
      if (error) {
        return;
      }
      var logs = JSON.parse(text);
      for (var logIndex in logs) {
        var log = logs[logIndex];
        document.getElementById("message-log").innerHTML += ('<p>' + log.level + '  ' + log.message + '</p>');
      }

    });
  }
}

var interval = setInterval(function () {

  try {

    if (promise) {
      promise.get('/ping').then(function (error, text, xhr) {
        if (text == 'pong') {
          if (config.redirect)
            window.location.href = config.redirect;
          else {
            nanobar.go(100);
            document.getElementById("progress-log").innerHTML = 'Happner is up!';
            clearInterval(interval);
          }
        }
        else
          getProgress();

      });
    }

  } catch (e) {
    //do nothing...
  }
}, 2000);
