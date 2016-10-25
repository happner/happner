
HAPPNER SECURITY
----------------


users groups and permissions
----------------------------
*happner meshes can run in secure mode, a scheme comprising of users, groups and permissions allows for this, we have yet to complete the documentation for this, but to get a comprehensive picture of how this works, please look at [the test for now](https://github.com/happner/happner/blob/master/test/b4-permissions-translation.js)*


payload encryption
------------------
*happners messaging payload can be encrypted, the mesh must be running in secure mode, to see how this works client to mesh, please look at [the test](https://github.com/happner/happner/blob/master/test/c9-payload-encryption-client-to-mesh.js) - there is also a test demonstrating how this works [mesh to mesh](https://github.com/happner/happner/blob/master/test/c8-payload-encryption-mesh-to-mesh.js)*


security directory events
--------------------------
*the happner security module emits the following events pertaining to changes on the security directory:*
- upsert-group - when a group is upserted
- upsert-user - when a user is upserted
- link-group - when a user is linked to a group
- unlink-group - when a user is unlinked from a group
- delete-group - when a group is deleted
- delete-user when a user is deleted

```javascript
//you need to switch this on by first calling attachToSecurityChanges method

adminClient.exchange.security.attachToSecurityChanges(function(e){
	 adminClient.event.security.on('upsert-user', function(data){
        ...
      });

```
please look at [the test](https://github.com/happner/happner/blob/master/test/d3-permission-changes-events.js


security session events
-----------------------
*the security module emits an event for every time a client connects or disconnects from the system*

```javascript
	//you need to switch this on by first calling attachToSessionChanges method
	adminClient.exchange.security.attachToSessionChanges(function(e){
		adminClient.event.security.on('connect', function(data){
	      ...
	    });

	    adminClient.event.security.on('disconnect', function(data){
	      ...
	    });
```
please look at [the test](https://github.com/happner/happner/blob/master/test/d4-session-changes-events.js



## security service functions



#### exchange.security.addGroupPermissions(groupName, permissions)

Adds new permissions to existing permissions for groupName.

```javascript
var addPermissions = {
  methods: {
    '/meshname/component/method': {authorized: true}
  },
  events: {
    '/meshname/component/event': {}
  },
  web: {
    '/component/webmethod': {authorized: true, actions: ['get']}
  }
};

$happn.exchange.security.addGroupPermissions('groupName', addPermissions)
  .then(function (updatedPermissions) {})
  .catch();
```

* `authorized: true` will be assumed if unspecified.
* If the webmethod actions already had `['post', 'put']` then get will be added.



#### exchange.security.removeGroupPermissions(groupName, permissions)

Removes permissions from an existing group.

```javascript
var removePermissions = {
  methods: {
    '/meshname/component/method': {} // empty means delete entire permission
  },
  web: {
    '/component/webmethod': {actions: ['post']} // delete only specified action
  }
}
```

* Pass an empty object for the permission to be deleted.
* Only the specified webmethod actions are removed. The permission is left otherwise unchanged.

