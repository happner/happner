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

- Don't redirect proxy repsonses, just serve splash page
