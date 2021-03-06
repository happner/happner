1.1.1 2015-12-03
----------------
- mesh names are now created and persisted
- mesh obtains unique name from happn, if one isnt specified
- fix for data routes, tested in 7-persisted-data
- modified test script in package.json

1.1.2 2015-12-06
----------------

- moved logger out into own module [happn-logger](https://github.com/happner/happn-logger)
- added deprecation warnings on use of UTILITIES global and the old logger

1.2.3 2015-12-07
----------------

- fixed bug in MeshClient not configuring log in standalone case

1.2.4 2015-12-08
----------------

- fixed issue with users and groups being updated, and passed directly up to the client in happn - was causing a scope issue, proved in test b9-mesh-security-updateuser-re-accessresource

1.2.7 2015-12-18
----------------

- fixed issue where system components were being started after user-land components, using latest version of happn 1.1.5

1.3.7 2015-12-23
----------------

- using the latest version of happn 1.2.6
- created search tests

1.3.8 2015-12-28
----------------

- fixed exchange function argument padding bug/#62

1.3.9 2015-12-28
----------------

- fixed logger flag in bin/happner
- silence security waring by explicitly setting secure to false

1.3.10 2015-12-31
-----------------

- added istanbul and coveralls for coverage tests
- MeshClient options supports host and hostname option
- prevent unhandled rejection errors when using 'login/deny' and 'login/error' events instead of promise in MeshClient
- divide api.js into multiple parts in system/shared/...

1.3.12 2016-01-02
-----------------

- using latest version of happn 2.1.7

1.4.0 2016-01-07
----------------

- added https functionality, using happn 2.2.1

1.5.0 2016-01-12
----------------

- added the web token security functionality
- fixed issue where upserted user is being passed back with the password hash

1.5.1 2016-01-13
----------------

- removed global.UTILITIES
- moved responseHandlerCache onto messenger instance instead of prototype

1.5.2 2016-01-13
----------------

- added exclusions functionality for secure web paths
- bumped version of happn


1.5.3 2016-01-18
----------------

- added .datalayer.middleware.security.cookieDomain and .datalayer.middleware.security.cookieName configurables to control happn security token
- added default /api/client and /primus/* to webroute security exceptions
- added config version and name to `client.info`


1.5.4 2016-01-21
----------------

- tested payload encryption
- bumped version of happn

1.5.5 2016-01-23
----------------

- first browser test passing
- updated happn version 2.4.3

1.5.6 2016-02-12
-----------------

- added $origin special argument
- fixed bug with updateUser
- added updateOwnUser
- allowed for connection to security data change events

1.6.0 2016-02-19
-----------------

- we now have the connect and disconnect events being emitted by the security component
- we now added a disconnect method to the apiClient

1.6.1 2016-02-22
----------------

- we now have the connection events being emitted by the happner client 'reconnect-scheduled', 'reconnect-successful', 'connection-ended'
- updateOwnUser now checks if the password is being changed, and if so expects the previous password
- updated to use happn 2.5.4

1.6.2 2016-02-22
----------------

- updated to use happn 2.5.7

1.6.3 2016-03-02
----------------

- updated to use happn 2.5.8

1.6.4 2016-03-02
----------------

- updated to use happn 2.5.9
- updates to the datalayer to allow for plugins (ie. mongo)

1.6.5 2016-03-09
----------------

- updated to use happn 2.5.12

1.6.6-1.6.7 2016-03-12
----------------------

- crypto component fixes

1.6.8 2016-03-17
-----------------

- fixed issue with caching in happn, upgraded happn to version 2.5.15

1.6.9 2016-04-01
----------------

- Fixed memory leak and noPublish issue in happn

1.6.10 2016-04-04
-----------------

- bumped happn version to v 2.5.18

1.6.11 2016-04-04
-----------------

- added benchmarket v 0.0.4

1.6.12 2016-04-20
-----------------

- bumped happn version to 2.5.21
- updated tests to use {reconnect:false} options when shutting dwn test instances of happner

1.7.0 2016-05-05
-----------------

- Reconnect option can be now be passed into mesh.stop() to inform remotes to reconnect (default true)

1.8.0 2016-05-13
-----------------

- startup loader
- bumped happn to 2.6.1
- bumped happn-logger 0.0.2

1.8.1 2016-06-09
-----------------

- fixed issue with metadata not showing created,modified
- moved dev dependancies (gulp/karma) to devDependancies
- removed moment dependancies
- updated happn version 2.6.3

1.8.3 2016-06-09
----------------

- updated happn version 2.6.4 with a test

1.8.4 2016-06-24
----------------

- updated happn version 2.6.5
- added the db compaction functionality

1.8.5 2016-06-27
----------------

- add happner-loader to CLI

1.8.6 2016-06-27
----------------

- fix accidental pre-merge publish


1.8.7 2016-06-28
----------------

- fix cli startup missing browser_primus
- fix cli backward compat for config with `dataLayer` vs. `datalayer`
- updated happn with previous value on subscribe (sans glue)

1.9.0 2016-06-29
----------------

- initial value on subscription

1.9.1 2016-06-29
----------------

- fixed test c9

1.9.2 2016-06-29
----------------

- using happn 2.7.1

1.10.0 - 1.10.1 2016-06-29
--------------------------

- adding Proxy to happner-loader

1.11.0
--------------------------

- adds ability to configure custom loader page

1.11.1
--------------------------

- Don't redirect proxy responses, just serve splash page

1.11.2
--------------------------

- Removing unwanted console.log

1.12.0 2016-07-08
--------------------------

- Updated happn version
- Created client timeout test d9
- Updated docs to include client timeout parameter
- Updated bitcore dependancies
- Fixed happner-loader-daemon commander to accept unknown arguments

1.13.0 2016-07-11
---------------------------

- Updated happn version 2.9.4

1.14.0 2016-07-14
---------------------------

- Updated happn version 2.9.5
- Updated the shared data component and tests
- Did a code refactor
- Fixed a bug in the component-instance - scope issue with this.log

1.15.0 2016-07-14
---------------------------

- Updated happn version 2.9.6
- Added ability to honour promises on synchronous methods (on the other side of the exchange)

1.15.1 2016-07-19
---------------------------

- Created 'sync-promise' configuration for synch methods over the exchange
- Added to the promises tests

1.16.0 2016-07-26
---------------------------

- Mesh stop removes mesh from root, also unsubscribes all from process events if the mesh being stopped is the last one on the root
- client reconnection
- endpoint reconnection

1.16.1 2016-07-28
-----------------

- Fix function call pointer for some mesh reconnect events (#153)

1.16.2 2016-07-28
-----------------

- Fixed _this in mesh.__protectedMesh function
- added e3 test
- added e4 test
- added e5 test

1.17.0 2016-08-02
-----------------

- updated happn to version 2.10.1
- made endpoint configuration reconnect configurable

1.17.1 2016-08-11
-----------------

- prevent crash due to unresolved issue #172

1.18.0 2016-08-16
-----------------

- Allow module function called over the exchange to return a promise.

1.19.0 2016-08-24
-----------------

- happn update 2.12.0, small changes to make mongo plugin backwards compatible

1.19.1 2016-08-25
-----------------

- removed terminal from bin/happner cli for win32

1.19.2 2016-08-25
-----------------

- fix crash in win32 after terminal removed


1.19.3 2016-09-05
-----------------

- bypass exchange messenger on calls to local components
- fix injection misalignment when injecting $origin before $happn

1.20.0 2016-09-13
-----------------

- updated to happn 2.13.0
- $origin on secured web requests
- REST component
- fix #183
- Session management

1.20.1 2016-09-18
-----------------

- updated to happn 2.14.1
- added MeshClient.login callback in addition to promise
- added tests demonstrating client disconnect

1.21.0 2016-09-21
-----------------

- updated happn 2.15.1

1.21.1 2016-09-26
-----------------

- neatened up some code
- updated to happn 2.15.4

1.22.0 2016-10-04
-----------------

- updated to happn 2.15.5

1.22.1 2016-10-04
-----------------

- updated to happn 2.15.6

1.22.2 2016-10-06
-----------------

- updated to happn 2.15.8

1.22.3 2016-10-17
-----------------

- fix for path sep in packager
- added appveypr.yml
- removed osx tests on travis

1.23.0 2016-10-20
-----------------

- REST now able to GET from a remote method, passing params through the query string

1.23.1 2016-10-24
-----------------

- REST now able to login over a GET

1.24.0 2016-10-24
-----------------

- REST can now inject all parameters as a single object called $restParams (#228)
- REST can inject the user that was logged in as $restOrigin (#229)

1.24.1 2016-10-24
-----------------

- Change $restOrigin to $userSession

1.25.0 2016-10-25
-----------------

- Implement security functions addGroupPermissions and removeGroupPermissions

1.25.1 2016-10-26
-----------------

- Upgraded happn to 2.15.9

1.26.0 2016-10-28
-----------------

- fixed bug with update and remove permissions
- added ability to upsert groups

1.27.0 2016-10-28
-----------------

- added ability to upsert users

1.27.1 2016-11-03
-----------------

- onward release of happn 2.16.0
- delayed relay of happn/primus 'reconnect-successful' onto nextTick
- fix endpoint logging with own name on remote connecting
- fix terminal repl echo in node v4+

1.28.0 2016-11-18
-----------------

- updated happn to 2.16.1, default policies now have ttl 0

1.28.1 2016-11-19
-----------------

- test timeouts

1.28.2 2016-11-21
-----------------

- happn 2.16.2

1.28.3 2016-12-15
-----------------

- happn 2.16.3, fix persisted cache sync

1.28.4 2016-12-16
-----------------

- fix #252, make meshClient disconnect() work for disconnected client

1.28.5 2016-12-16
-----------------

- fix #257, fix REST crash when posting object without parameters to function using $restParams

1.28.6 2016-12-21
-----------------
- updated e2 test, moved to longrunning

1.28.7 2016-12-21
-----------------
- fix #259, fix REST response with undefined data payload

1.28.8 2016-12-30
-----------------
- fix #254, mesh client instances interfere with each other

1.28.9 2017-01-24
-----------------
- fix #241, add ability to pass different memory constraints to child
- fix #242, happner-loader will retry loading child if it fails to start

1.29.0 2016-01-24
-----------------
 - a middleware is injected to ensure that any 'on' requests are checked for an illegal atempt at listening in on _responses
 - happn version 2.17.0


1.29.1 2017-01-25
-----------------
- fix #241, add ability to pass different memory constraints to child
- fix #242, happner-loader will retry loading child if it fails to start

1.29.2 2017-02-08
-----------------
- fix #268 - Latest happn that stop client when login fails

1.29.3 2017-02-08
-----------------
- fix #268 - Latest happn that stop client when login fails

1.29.4 2017-03-28
-----------------
- happn v 2.17.5

1.29.5 2017-03-28
-----------------
- happn v 2.17.6

1.30.0 2017-03-30
-----------------
- account lockout

1.31.0 2017-04-02
-----------------
- client revoke session flag on disconnect

1.32.0 2017-04-20
-----------------
- login with token

1.32.1 2017-04-21
-----------------
- updated happn to version 2.20.1

1.32.2 2017-05-30
-----------------
- updated happn to version 2.20.2

2.0.0 (reverted to 1.33.0) 2017-06-08
-------------------------------------
- update dependencies to wildcards to prevent bloating installs (#271)
- update to happn 3.0.0
- added ping and pong config to Endpoint and MeshClient (happn clients)
- added allowSkippedHeartBeats and pongSkipTime to Datalayer (happn server)

2.1.0 (reverted to 1.33.1) 2017-06-13
----------------
- updated to happn v3.1.0

2.1.1  (reverted to 1.33.1) 2017-06-22
----------------
- issue #295 - add correctly spelled 'detach' event

2.1.2  (reverted to 1.33.1) 2017-06-29
----------------
- issue #298 - improve loader startup progress estimates

1.33.1 2017-07-03
-----------------
- reversion to 1.33.0 was missing 2.1.2 and 2.1.1 and 2.1.0

1.33.2 2017-07-04
-----------------
- Update happn to 2.21.0

1.33.3 2017-11-06
-----------------
- Don't publish test and docs directories

1.33.4 2017-11-06
-----------------
- use request@2.81.0 for Node 0.10 compatibility

1.33.5 2018-01-11
-----------------
- fix #303 - make shared datalayer respect the noPublish set option

1.33.6 2018-01-15
-----------------
- fix #306 - shared data SET failed with no options object

1.33.7 2018-04-20
-----------------
- onward release happn 2.21.3

1.33.9 2018-07-23
-----------------
- fix #316 - make happner-terminal a devDependency
 
1.33.10 2018-07-23
-----------------
- allow unknown option in happner.js

1.34.0 2019-03-06
-----------------
- Allow deferListen without a loader
- Forward release of happn@2.21.4

1.34.1 2019-03-08
-----------------
- Callback with mesh instance when creating
