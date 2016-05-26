#loader
*the loader command line creates a web server that listens on the hppner port, and displays a progress bar and message that shows how far happner is with loading*

```bash
node bin/happner-loader --conf ../test/lib/d6_conf_redirect.json
```

lets look at the config:
```javascript
{
  "port":55004,
  "happner-loader":{
    "redirect":"/ping"
  }
}
````
*this is the actual happner config, with a special section caled happner-loader - you can see that a redirect url has been set, this is where the splash page will redirect to when happner has fully loaded and is listening*


A lot needs to happn to make this possible, first the loader starts an http server, that servs the splash page, then the loader creates a Logger. 
Then the happner instance is forked using a call to the happner-loader-daemon, all happner logs are redirected via IPC to the happner-loader Logger, when happner has started and is ready, the loader is messaged, the loader then stops it web server instance and notifies the happner-daemon, which now starts listening on the configured port, the loader is then signalled that this has happened and shuts down after 5 seconds:

```bash
[ INFO] - 1ms	0ms	nickelcoyote_EJGb1ZetfZ (Mesh) started component 'security'
[ INFO] - 1ms	nickelcoyote_EJGb1ZetfZ (Mesh) started component 'system'
[ INFO] - 0ms	1ms	nickelcoyote_EJGb1ZetfZ (Mesh) started component 'system'
[ INFO] - 0ms	nickelcoyote_EJGb1ZetfZ (Mesh) started!
[ INFO] - 0ms	0ms	nickelcoyote_EJGb1ZetfZ (Mesh) started!
[ INFO] - 3ms	nickelcoyote_EJGb1ZetfZ (HappnServer) listening at :::55003
[ INFO] - 3ms	3ms	nickelcoyote_EJGb1ZetfZ (HappnServer) listening at :::55003
[ INFO] - 0ms	nickelcoyote_EJGb1ZetfZ (HappnServer) happn version 2.6.0
[ INFO] - 1ms	0ms	nickelcoyote_EJGb1ZetfZ (HappnServer) happn version 2.6.0
[ INFO] - 0ms	happner process is now listening, killing parent process in 5 seconds
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
