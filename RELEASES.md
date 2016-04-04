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

1.5.7 2016-01-18
----------------

- Pull initialization overlap release (#70)
- Use v2.3.3 of happn


