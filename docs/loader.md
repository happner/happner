#loader
*the loader command line creates a web server that listens on the hppner port, and displays a progress bar and message that shows how far happner is with loading*

```bash
node bin/happner-loader --conf ../test/lib/d6_conf_redirect.json
```

lets look at the config:
```javascript
{
  "port":55004,
  "proxy":'http://127.0.0.1:80'  //[optional] While loading, requests are proxied to the url
  "happner-loader":{
    "redirect":"/ping"//you set this proerty to have the redirection occur after handover has happened between the loader and the actual happner instance
  }
}
````
*this is the actual happner config, with a special section caled happner-loader - you can see that a redirect url has been set, this is where the splash page will redirect to when happner has fully loaded and is listening*


A lot needs to happn to make this possible, first the loader starts an http server, that servs the splash page, then the loader creates a Logger. 
Then the happner instance is forked using a call to the happner-loader-daemon, all happner logs are redirected via IPC to the happner-loader Logger, when happner has started and is ready, the loader is messaged, the loader then stops it web server instance and notifies the happner-daemon, which now starts listening on the configured port, the loader is then signalled that this has happened and shuts down after 5 seconds:

```bash
	almondroar_Nkrljh1XW (HappnServer) system service loaded.
[ INFO] - 80ms	almondroar_Nkrljh1XW (HappnServer) security service loaded.
[ INFO] - 130ms	almondroar_Nkrljh1XW (HappnServer) pubsub service loaded.
[ INFO] - 6ms	almondroar_Nkrljh1XW (Mesh) home /Users/simonbishop/Documents/Projects/happner/bin
[ INFO] - 1ms	almondroar_Nkrljh1XW (Mesh) happner v1.8.0
[ INFO] - 0ms	almondroar_Nkrljh1XW (Mesh) config v..
[ INFO] - 0ms	almondroar_Nkrljh1XW (Mesh) localnode 'almondroar_Nkrljh1XW' at pid 30606
[ INFO] - 192ms	almondroar_Nkrljh1XW (Mesh) initialized!
[ WARN] - 2ms	almondroar_Nkrljh1XW (security) data layer is not set to secure in config
[ INFO] - 1ms	almondroar_Nkrljh1XW (Mesh) started component 'security'
[ INFO] - 0ms	almondroar_Nkrljh1XW (Mesh) started component 'system'
[ INFO] - 0ms	almondroar_Nkrljh1XW (Mesh) started!
[ INFO] - 1410ms	happner ready to start listening
[ INFO] - 3ms	almondroar_Nkrljh1XW (HappnServer) listening at :::55004
[ INFO] - 1ms	almondroar_Nkrljh1XW (HappnServer) happn version 2.6.1
[ INFO] - 3ms	happner process is now listening, killing parent process in 5 seconds
```

you can then see the happner instance running by doing a ps:

```bash
ps -e | grep node
18594 ttys006    0:01.67 /usr/local/bin/node ./bin/happner-loader-daemon --conf ../test/lib/test_conf.json
18599 ttys006    0:00.00 grep node
```

or by pinging the happner instance:

```
curl "http://localhost:55003/ping"
pong
```

#unit tests
*because the silence.js script has been added to the main tests, some of the unit tests fail, so the test has been moved to a different location - test-optimize, you can run the unit tests for optimize like so:*
```bash
npm run-script test-optimize
```

