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

