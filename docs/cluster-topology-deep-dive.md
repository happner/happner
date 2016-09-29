# Happner Cluster (deep dive)



## The pros and cons of Component Versions

### Pros

* Rolling upgrades through the cluster.
* Running multiple versions concurrently.
* They're an awesome idea.

**NB: Doing semver without doing ^ and ~ will be pointless, might as well just use integers, one bugfix will mean
reconfiguring all cluster nodes using the component.**

### Cons

* Beijing tea
* Pig in a poke
* Jam Auction
* Three-card Monte
* Badger game
* **It will slow things down a little...**



## The pros and cons of App Domains

### Pros

* Subscribers can subscribe to domain wide events provided we present something akin to an `endpoint` in the api where subscribers can subscribe.

### Cons

* We're replacing hardcoded `endpoints` with hardcoded `domains` in the source of all components.

```javascript

// got this
$happn.event.endpointName.componentName.on('...

// want this
$happn.event.componentName.on('...

// getting this
$happn.event.domainName.componentName.on('...

```

What that means is that component implementations remain config dependant (ie. they require certain domain names
to be in the meshConfig that they run in).

Isn't the ability to subscribe to `componentName/version/event` cluster-wide sufficiently adequate?



## The pros and cons of a central event master

### Pros

* Event sequencing (**maybe**)
* Centralized app-land event de-duplication.
* Event loop detection.

##### Event sequencing

Given a `set()` and then a `delete()` on the same path. If both occur at the same cluster node then the sequence
is already preserved because the orchestrator will replicate them in the same sequence and the websockets
themselves preserve the sequence on the wire.

If the `set()` occurs at one cluster member and the `delete()` at another there is no way to preserve the order
without getting a sequence number from a central sequence number broker (the master).

But who wins/loses then becomes a question of who gets to the broker first.

So the question is: Is there any sense in attempting to resolve the sequence of two disconnected events whose order,
although temporally sequential, became randomized in their effort to reach the server.

If we decide we like sequencing even from disconnected sources, then we need a centralized master emitter.

And it will likely need to remain 1 server/process, because multiple processes de-queing the same
queue are going to race each other.

It will also have to have fully processed the current event before proceeding to the next. In other words,
it will have to have completed sending the event to each subscriber.

Also, with sequencing, there are some additional considerations:

Subscribers can re-emit new events based on some logic.

Lets say event X causes event A, and Y causes B.
  
Now the event master receives X and then Y and then B and then A.

Should B and A be switched around?

They are causally bound to sequenced origin events and only got switched around because of the
respective cputime/latency taken to produce and queue them.

Or does the importance of the sequence only apply ahead of the first hop?

If so, then what is so unimportant about B and A that the sequence they should have happened in does not
matter any more.

But hang on, since X causes A shouldn't A even precede Y. Because if X happened before Y surely everything
that happens because of X should also happen before Y. That will be rather difficult to achieve. It will
also reduce the cluster to one full waterfall operation at a time.

So the question of whether or not to sequence might just be reduced to the lament of no longer being in one
process with all the scheduling goodness baked in.

##### App-land event de-duplication.

Simon pointed out the distinction between infrastructural and app-land event duplication.

###### Infrastructural duplication

When the system itself creates unwanted duplication that manifests into app-land. This was happening in the
topology that had inter-cluster endpoints with multiple internal websockets. Since retiring that design we
have no infrastructural duplication other than in the full `/*` cluster replication itself (which can be
switched off, as outlined in the event solution proposed hereunder).

###### App-land duplication

This is a natural effect of being in a cluster with event replication. If multiple instances of `componentY` are
subscribed to `componentX/event` then when it fires, all instances of `componentY` receive the event.

If `componentY` then emits `eventBecauseOfEvent` to which multiple `componentZ`s are subscribed there will
be a probably undesirable cacophony as...

`componentX/event (10) -> componentY/eventBecauseOfEvent (10 * 10) -> componentZ` goes viral.

And that's great. If you're building a neural network. But we're building a clustering framework for load
distribution and redundancy. Events will need to be cleverly directed.

Our original discussion resolved a need for `$happn.emit()` (only emits to local node) and `$happn.gobalEmit()`
(emits throughout the cluster such that all subscribers to the emitting component receive it). These perhaps remain
useful but lack the ability to emit to at-least-one-and-only-one subscriber. The ability to do so is introduced
by the `$happn.emit('/app domain/1.0.0.*/component/method', {any: true}, cb)` as proposed by Simon.

There is one problem...

* Given a FieldServer with a sensor.
* The FieldServer has an endpoint (old style) load balanced onto a single instance in the cluster.
* The FieldServers cannot emit events, events only go in one direction across the endpoint.
* FieldServer is calling a function `endpoint.deviceManager.update()` at interval with sensor updates.
* The `update()` function has awareness of sensor trigger thresholds.
* One of the `updates()`s exceeds a threshold causing the `deviceManager/alert` event to fire.
* Multiple redundant instances of the `customerNotifier` are sprinkled throughout the cluster all subscribing to `deviceManager/alert` so that the customer can be sent sms/slack/email/condolence.
* Multiple instances of `browserNotifier` are running on every cluster member where browsers attach, these are also all subscribed to `deviceManager/alert` so that any instance to which the specific customer's browser is attached can arrange a popup.

Now we have a situation where the event needs to be emitted to:
 
* **exactly one** `customerNotifier` (to prevent the sending of 10 SMS messages)
* **all of** the `browserNotifier`s.

Further specifying the targets in the `$happn.emit()` will require pre-knowledge at implementation time of
which remote components will be subscribing. This is not practical.

It would be better if the specification `{all: true}` was submitted by the subscriber and not the emitter.

It makes sense to me that a component implementer would know if his subscription to some event source should
be triggered at every instance of his component in a cluster or just one far better that the implementor
of the event source (who doesn't even know who is going to be subscribing, let alone why) could possibly
know.

So it follows that subscriptions needs to include the component name of the subscriber so that
the emitter can send the same event to one `customerNotifier` and all `browserNotifier`s.


##### Event loop detection

A emits to B, B to C and C to A. Forever. You'd pick this up fairly quickly if it was happening in a
single server. 100% cpu is quite telling.

But if there are 20 instances each scattered across a cluster...

A centralized event master could watch (tricky algorithm) and eject without resorting a hard
hop-count limit.

If a hard hop-count limit is acceptable then loop detection becomes arbitrary and can be performed
by either a the centralized event master or the distributed case where each node is master of it's
own events.

### Cons

* A possible bottleneck.
* Upgrading the master will be momentarily disruptive to the cluster.
* For the re-election/promotion period there will be no master.

Here is a train of thought.

* The event master needs a list of all subscriptions.
* All subscribers are sending their subscriptions there.
* The list needs to be stored somewhere in case the master fails/needs upgrade.
* The master is restarted to apply an upgrade.
* A new master is elected.
* The new master needs to fetch the list of subscriptions before it can start de-queing events.
* The previous step is inefficient and is replaced by all nodes subscribing to '/_CLUSTER/_SUBSCRIPTIONS/*'
* All nodes now stand at the ready to be elected to master at a moments notice.
* All nodes now know who is subscribed to all component/version combinations.
* All nodes know what components/version they themselves contain.
* All nodes can become master of their own events (events they emit).
* Master is no longer required (other than for sequencing)


## Problems And Solutions

### Problem 1: How do component versions enter the fray?

Component implementations use `$happn` to interact with other components in the cluster.

```javascript
$happn.exchange.componentName.methodName('param', ...
$happn.event.componentName.on('eventFrom', ...
$happn.emit('eventTo');
```

But where are the versions?
What version of `componentName` are we intending to interact with?
And what version are we such that our emitting of `eventTo` can find it's way to supported subscribers.
 
### Solution 1: Component dependencies sub-config.

By adding a list of all the remote components/versions required for this component to work into its
config it becomes possible to impregnate its `$happn` with the knowledge necessary to call and subscribe
appropriately into the cluster. Additionally the version of this component should also be in the
description so that other dependents can find their way to this component/version.

eg.

```
  ...
  components: {
    'browserNotifier': {
      version: '2.0.0',
      dependencies: {
        'deviceManager': '^1.0.0',
        'etCetera': '^0.0.0'
      }
    }
  }
  ...
```

Might be easier (less config effort) to hardcode `version()` and `dependencies()` as required
functions for every component to implement.

What this means is that every component's `$happn` needs to be custom built with the knowledge of it's own
dependencies - which differs from what we have now where one common 'exchange' and 'event' object is built and
appended to each `$happn`.

There might also be some issues with the distinction between modules and components in that happner supports
multiple instances of the same module under different component names. But since the component is using its
dependencies via `$happn.exchange.componentName` it should list each dependency in its config
by componentName (**not** moduleName):

eg.

```javascript
   ...
   components: {
     'table': {
       dependencies: {
         'chair_1': '^9.34.5', // multiple instances of 'chair' module
         'chair_2': '^9.34.5',
         'chair_3': '^9.34.5',
         'chair_4': '^9.34.5'
       }
       ...
     }
   }
   ...
```

Sorry. That actually makes no sense. Here...

```javascript
   ...
   components: {
     'chair_1': {
       dependencies: {
         'table': '^9.34.5'
       },
       ...
     },
     'chair_2': {
       dependencies: {
         'table': '^9.34.5'
       },
       ...
     },
     ...
   }
   ...
```


Which, **on the very, very bright side**, gives us all the information we need to build the meta `$happn`
to contain **only the subset of cluster components used by it**, instead of having every single component in
the cluster strapped onto evey single `$happn` in it.

Will still need to interrogate all node descriptions to find an instance of `table @ ^9.34.5` to learn what
methods to build into `$happn.exchange.table`.
 
Which presents another issue. What if you start a cluster member with a component dependency to
another cluster member that has not been started yet. No description to get... no list of methods...

Perhaps not a problem when rebooting because residual descriptions will still be laying around in the
database. But leaving things laying around in the database can cause problems. Especially in a dynamically
load balanced environment where nodes are spawned and pruned regularly from seed images that use their
ip address as the only accessible unique thing to assign their mesh name, and their ip address was assigned
using DHCP from a very large pool (eg. AWS)

Perhaps there is a new global thing: `/_CLUSTER/_RESOURCES/_COMPONENTS/componentName/version = {definition}`

And this thing can be pre-seeded by commandline or githook.

Anyway. Not a simple problem.


### Problem 2: Unnecessarily noisy cluster-wide replication of '/*'

A native **happn** cluster is about distributed pub/sub, it therefore needs full replication. It is however
configurable, happner can start it's underlying happn cluster with any set of replication matchers.


### Solution 2: Don't replicate '/*'

The solution to cluster event distribution presented below eliminates all global replication other than that
which is necessary to distribute subscriptions throughout the cluster (or to a master event manager)

ie. Only these go global: `/_CLUSTER/_SUBSCRIPTIONS/*`.

Although, there is also the case of the shared database component. Don't quite know how
that looks with regard events and their replication.



### Problem 3: How to direct events in the necessary manner.

* To load balance, de-duplicate and honour the `{all, any, etc}` of the subscriptions.
* To not use cluster-wide replication to the largest possible extent.

The solution below solves for both. And the same implementation would need to be made for both cases of:

* centralized event master
* each node as master of its own events


### Solution 3: Work It, Flip it, And reverse it!

Event DJ, [please pick up your phone, I'm on the request line!](https://www.youtube.com/watch?v=UODX_pYpVxk)

Huh?

I'm suggesting to actively send events to their specific subscribers instead of passively emit them globally
and hope that they arrive.

In other words, do them backwards.

Subscribe to myself at `/_CLUSTER/_EVENTS` where the event master will `set()` the event, being that the
event master already has `happn.services.orchestrator.peers['mymeshname'].client.set()` to do just that.

But before looking at how lets examine why.

Recall the event `deviceManager/alert` and multiple instances of both `customerNotifier` and `browserNotifier`
throughout the cluster subscribed to it with differing optionals `{all, any, etc}`:

Lets say the subscribing components are spread among 4 remote mesh nodes

```javascript
  '10-0-0-1': { // mesh name
    'customerNotifier': {any: true}, // emit to only one
    'browserNotifier': {all: true}   // emit to all
  },
  '10-0-0-2': {
    'customerNotifier': {any: true},
    'browserNotifier': {all: true}
  },
  '10-0-0-3': {
    'customerNotifier': {any: true},
    'browserNotifier': {all: true}
  },
  '10-0-0-3': {
    'customerNotifier': {any: true},
    'browserNotifier': {all: true},
  }
```

Now if we emit `deviceManager/alert` as is then all instances of `customerNotifier` notifier will receive it
without any way to honour the `{any: true}` that declared our intent for it to go to only one.

In order to resolve this problem we need to direct the event to correct mesh node. With vanilla pubsub this
will require that events also contain the target mesh node's name in their path. And consequently subscribers
will need to subscribe with their own mesh name in the path.

Now we can emit to only ONE `customerNotifier` by broadcasting `/10-0-0-2/deviceManager/alert`.

Then we also need to emit to all instances of `browserNotifier` by broadcasting all of:

`/10-0-0-1/deviceManager/alert`<br/>
`/10-0-0-2/deviceManager/alert`<br/>
`/10-0-0-3/deviceManager/alert`<br/>
`/10-0-0-4/deviceManager/alert`<br/>

This can be simplified by introducing support for emitting to wildcards in happn as suggested by Simon,
but underneath it will still be replicating cluster-wide, just slightly differently:

`/*/deviceManager/alert` (sent to 10-0-0-1)<br/>
`/*/deviceManager/alert` (sent to 10-0-0-2)<br/>
`/*/deviceManager/alert` (etc.)<br/>
`/*/deviceManager/alert`<br/>

And now that we're sending the event to both `10-0-0-1` and `10-0-0-2` we have a new problem in that
both `customerNotifier`s are receiving it, but only one must process it, the receiving end has no way
of knowing if it's the one.

So we're going to need to also add the subscribing componentName to the subscription path so that
the emitter can select more specifically from the list in order to honour the various `{all, any, etc}`
obligations.

Now, one `deviceManager/alert` needs to be routed from among 8 subscriptions.

`/10-0-0-1/customerNotifier/deviceManager/alert`<br/>
`/10-0-0-2/customerNotifier/deviceManager/alert` (emitter eliminates this one somehow) <br/>
`/10-0-0-3/customerNotifier/deviceManager/alert` (and this one)<br/>
`/10-0-0-4/customerNotifier/deviceManager/alert` (and this one)<br/>
`/10-0-0-1/browserNotifier/deviceManager/alert`<br/>
`/10-0-0-2/browserNotifier/deviceManager/alert`<br/>
`/10-0-0-3/browserNotifier/deviceManager/alert`<br/>
`/10-0-0-4/browserNotifier/deviceManager/alert`<br/>

Admittedly only 2 payloads are actually replicated cluster-wide.

`/10-0-0-1/customerNotifier/deviceManager/alert`<br/>
`/*/browserNotifier/deviceManager/alert`<br/>

Not so bad...

But then we want versions. If they're integers (or semver without ~ ^) that's easy. Just put it in the
path.

But without ^ and ~ making a bugfix to deviceManager, thus incrementing it to 0.0.2 will mean that all
components subscribed to `/0.0.1/deviceManager/alert` will stop getting their events even tho they probably
support version 0.0.2 too.

If we subscribe to version as `*` we can perform the semver matching at the receiver. But it would mean
then that all versions ever will be sent to every subscriber and over time it would start ignoring most
of them.

We could put the match operator into the subscription path `/~0.0.1/deviceManager/alert` and make the
happn emit pipeline clever enough, problem is that it's already doing wildcard matching against the
subscription list, and, as indicated above, will shorty be doubling that up with wildcards from the
emit side, to additionally searching for ~ or ^ and performing a semver match might make it too slow.

What if instead we augmented the emit and subscribe functionality with a second tier of information
not in the path.

```javascript
subscribe('/path', {version: '~0.0.1'}, function(...
emit('/path, {version: '0.0.3'}, payload, function(...
```

Then happn, upon encountering a version on both sides, can perform the match without all the complexities
of searching and extracting from among every passing path.

No reason not to do that since we already have the new requirement of:

```javascript
subscribe('/path', {route: {any: true}}, function(...
```

And since were doing that, why not also do this:

```javascript
subscribe('/deviceManager/alert', {route: {to: 'all', of: 'customerNotifier'}}, function(...
subscribe('/deviceManager/alert', {route: {to: 'any', of: 'browserNotifier', /* in: 'domain1' */}}, function(...
```

Now we've reduced `/10-0-0-1/customerNotifier/deviceManager/alert` back down to `/10-0-0-1/deviceManager/alert`.
Or even just `deviceManager/alert` if routing operations only apply inter-cluster.

And that's all good. Except that happn is no longer a Pubsub Engine. It's an Event Router. Or to be more 
eloquent: it's a Distributed Process Orchestration Bus capable of **not** dispatching 20 fire engines to
1 fire despite there being 20 redundant and load balanced fireEngineDispatchers in the cluster.

Problem is that it's also capable of dispatching 0 fire engines when 1 was required.

There is no event delivery guarantee. People speak of 'eventual consistency'. But that only works with
a repeating source. What if only 1 person calls the fire in.

To guarantee delivery we need to introduce acks and timeouts and retries and per subscriber queues into happn.

Or, as suggested, we could reverse it.

The subscriptions are replicated by pubsub, providing all emitters with the routing information they
require to precisely target their events.

The events are then transmitted by calls to `set()` at the targets. This has the benefit of already having
`callback(e)` to assist with our efforts to guarantee delivery.

#### Happner Events Manager

##### Upon subscribing.

A method in a component does this:

```javascript
$happn.events.deviceManager.on('alert', optionals, function(...
```

The `optionals` above refers to the optional need to specify `{all, any, etc}` at the subscribe and not the
emit side (as discussed above in 'App-land duplication').

The `on()` method is generated dynamically when the component was instantiated and has the following pseudo code
 
```javascript
localComponentName; // this $happn component

// these items are already in the parent scope as populated
// from the new dependencies section in the component config
remoteComponentName;
remoteRequiredVersion;

on = function(event, optionals, handler) {

  // make the subscription at this node's built in event manager
  _mesh.eventManager.subscribe(localComponentName, 
     remoteRequiredVersion, remoteComponentName, event, optionals, handler);
  
  // can be extended with second callback providing subscription success/error
  // but, it may have succeeded in the write, but it's still being replicated
  // throughout the happn-cluster in the background.
}
```

The `subscribe()` function pseudo in `_mesh.eventManager`

```javascript
subscribe = function(localComponentName, remoteVersion, remoteComponentName, event, optionals, handler) {
  if (localSubscriptions[localComponentName/remoteComponentName/event]) {
    // support multiple local handlers
    // support remoteComponentName/*
  }
  
  // datalayer contains the mesh node's happn cluster instance
  // its orchestrator already has a happn client instance logged intra-process into self
  // use it to make the subscription that gets replicated throughout the cluster
  
  // keeps remoteComponentName/event in the subscription path (for happn permissions (later))
  
  _mesh.datalayer.happn.services.orchestrator.peers.__self.client.set(
    '/_CLUSTER/_SUBSCRIPTIONS/remoteComponentName/event', {
      name: thisMeshName,
      subscriber: localComponentName, // (important) remote emitter needs this to load balance by subscriber componentName
      version: remoteVersion,
      optionals: optionals
    }, function(e) {
    localSubscriptions[localComponentName/remoteComponentName/event].push(handler); 
  });
}
```

Since the above `/_CLUSTER/_SUBSCRIPTIONS/*` is replicated globally, every member in the cluster now
knows that the node called `thisMeshName` would like to receive/can process in turn `componentName/event`
at `version`.

Subscription done...

Except for the possibility that some remote may have not received the replicated subscription event and
would therefore never emit the given event to here.

`SynchronisationSolution()` presented shortly.

##### Upon receiving a subscription.

All mesh nodes receive all subscriptions so that they can support targeting their own emissions into the mesh
or stand ready to take over immediately as master emitter.

The `_mesh.eventManager` (from above) is listening to `/_CLUSTER/_SUBSCRIPTIONS/*`, implementing the following
pseudo code

```javascript
_mesh.datalayer.happn.services.orchestrator.peers.__self.on(`/_CLUSTER/_SUBSCRIPTIONS/*`,
  function(data, meta) {
    
    subscribingMeshName = data.name;
    version = data.version;
    component = substring(meta.path, ...
    eventName = substring(meta.path, ...
    subscribingComponentName = data.subscriber;
    optionals = data.optional;
    
    SynchronisationSolution(data, meta.path);
    
    if (! mesh.haveComponent(component) )
      return; // (ignore) dont have this component, will never emit from it
      
    if (! mesh.haveSemVersion(component, version) )
      return; // same story, but with semver match ~ ^ to local component's version
    
    // eliminating the above shortens the list of subscribers below, for efficiency, but has a drawback
    // in that if componentX is dynamically injected into this node, previous subscriptions to
    // our new componentX from the field will have already been ignored.
    
    // add subscribingMeshName/ to list of parties interested in my events by ammeding it into this structure
    // (the actual format of this structure will likely be flattened/flipped/optimized in the final version)
    
    mySubscribers = {
      'componentName': {
        '~1.0.2': { // probably not required in this tree, filtered out incompatable subscriptions above
          eventName: {
            subscribingMeshName: {
              subscribingComponentName: optionals
            },
            anotherRemoteMeshNode: {
              subscribingComponentName: optionals
            }
          },
          '*': {
            // curve-ball:
            // subscribingMeshName/subscribingComponentName wants event componentName/*
            // but is also subscribed to componentName/eventName
            subscribingMeshName: {
              subscribingComponentName: optionals
            }
          }
        }
      }
    }
  }
);
```

Note that the full source of the subscription is present, including the `subscribingComponentName`
from the remote mesh. This seems strange... but it's necessary in order to de-duplicate / load balance
events as discussed in 'App-land duplication'.

Some consideration needs to go into how to handle the same subscriber subscribing to
`componentName/*` and `componentName/eventName`. We'd be emitting all events but in the specific
case of `componentName/eventName` it would be best not to send it twice. But it would be
prudent not to summarize it out of the subscription list as follows:

* subscriber subscribes to `componentName/eventName`
* subscriber subscribes to `componentName/*`
* we remove `componentName/eventName`
* subscriber unsubscribes from `componentName/*`
* we got nothing, but should have `componentName/eventName`

So it should rather be summarised out by the emitter. Making things more complicated there.

Another challenge will be a subscriber wanting `componentName/*` with optionals `{all}` and
`componentName/eventName` with optionals `{any}`. Now the emitter is faced with a
challenge: to emit `componentName/eventName` to `{all}` and `{any}`. It can't be easily done. It
should probably be protected against at the subscriber.

A new mesh node joining the cluster will also need to retrieve the subscriptions from the database.

The above is also calling `SynchronisationSolution()` with the subscription path and data. That is part
of the fallback mechanism ensuring all nodes have the full list of subscriptions despite the possibility that
something could go wrong in a manner impeding the cluster orchestrator's replication skills thus 
causing a partial subscription set on a given host.

It can use md5 to create a subscriptionSet checksum. Each node could announce it's checksum. Disparities
produce a re-sync of subscriptions from database. This is only a partial solution because:

* adding and removing nodes in the cluster will produce temporary disparity that needs to be ignored for the duration of the instability
* adding components to already running nodes will have the same effect
* upon discovering a disparity, who's is wrong and should sync.

##### Upon emitting an event.

In the previous section the emitter accumulated the list of subscribers to its component's events.
Now one of those components emits an event.

This revisits the three example components (`deviceManager`, `customerNotifier` and `browserNotifier`) 
as outlined in 'App-land duplication' to illustrate how the problems highlighted there are resolved.

###### The emitter

A FieldServer is calling this function across its endpoint into the cluster.

```javascript

DeviceManager.prototype.update = function($happn, sensorReading, callback) {

  if (sensorReading.value > this.alertThresholds[sensorReading.type]) {
    $happn.emit('alert', sensorReading);
  }
}
```

###### Two subscribers

The `deviceManager/alert` has subscribers at any number of instances of CustomerNotifier and BrowserNotifier
scattered throughout the cluster. These notifiers are subscribed to all instances of `deviceManager`
throughout the cluster because every node containing a `deviceManager` heard their subscription broadcasts.

```javascript

CustomerNotifier.protoype.start = function($happn, callback) {
  
  // The developer knows that more than one instance of his customer notifier
  // is running in a cluster.
  
  // So when he subscribes to an event, that event will be triggered on
  // all of his instances unless he does something about it.
  
  // He would rather not SMS the customer 5 times with the same information.
  
  // But he would still like 5 instances of his component in the cluster
  // for redundancy and distribution of load.
  
  // So he subscribes in a special way that teaches the emitter how to handle
  // sending events to his component.
  
  optionals = {any: true}; // emitter should send to any (but only one) instance of CustomerNotifier in the cluster
  
  $happn.events.deviceManager.on('alert', optionals, function(sensorReading) {
     
     $happn.exchange.customers.getByDeviceId(sensorReading.sourceId)
     
        .then(sendSMS)
        .catch();
    
  });
}
```

```javascript

BrowserNotifier.prototype.start = function($happn, callback) {
  
  // This browser notifier runs on all mesh nodes where browsers attach.
  
  // And the alert event needs to trigger on all of them because the exact
  // ones that contain users from the site of the alert is not known.
  
  optionals = {all: true};
  
  $happn.events.deviceManager.on('alert', optionals, function(sensorReading) {
  
    // assumes browser login produced subscription to browserNotifier/popups/alert/siteId
    // according to site associated with username logging in
    
    optionals = {noCluster: true}; // Don't replicate this event back into the cluster, only target local clients.
                                   //
                                   // This could be the default for emit(), as opposed to ?emitGlobal()/emitCluster()?
                                   //
                                   // And it is only necessy to emit to our local clients, all other
                                   // instances of BrowserNotifier are already emitting to theirs because
                                   // of the {all: true} above having distributed the alert in the
                                   // necessary way.
    
    $happn.emit('popups/alert/ + sernsorReading.sourceId', optionals, sensorReading);
  
  });
}
```

There are subtle issues lurking above.

* The call to `$happn.emit('alert', sensorReading);` is intended to go back into the cluster.
* The call to `$happn.emit('popups/alert/ + ...` is intended to go only to local clients attached with MeshClient or endpoint.
* They are indistinguishable other than the `eventName`.

Perhaps introducing `$happn.emitClient()` and keeping `$happn.emit()` for inter-component (cluster-wise OR not),
the other way around.

If we do distinguish the two by function name then changes will be necessary throughout the source base. Including in
some cases calling both.

Further confounding the issue is the fact that the input event is version aware but the output event is traversing 
mechanisms for which we have, as yet, no plans to engineer version awareness, namely MeshClient & endpoints.

Think about those plans for a moment:

For the case of the browser it could be as simple as:

* Browser detects version change while being re-balanced onto new cluster node.
* Browser refreshes to get the corresponding new version.

For FieldDevices it could be as (sort-of) simple as:

* FieldDevice detects version change while being re-balanced onto new cluster node.
* Unsupported version?
* Ooops. Reconnecting will produce the same results, load balancer is sticky
*
* Version probably needs to go into url
* And url resolves to load balancer mounting whichever cluster subset services the FieldDevices needing that version.
* Can keep support for all versions indefinitely if needs be.
* Putting semver into url version might not be prudent, or necessary, it should only be X.0.0 upgrades that break compatibility.
* Behind v1.cluster.com is a set of cluster components through which ^ and ~ (0.X.X) fixes can still be rolled.

Browser could also go to v1.cloud.com, eliminating any urgent need for attention there too.

So it's probable that no version awareness needs to be implemented into MeshClient or endpoints. You get what you connected to.

There is one point here which is important tho: When attaching endpoint/client to cluster only components local to the
node to which you've attached appear in the clientside exchange. This is a security consideration.

Each `$happn`s `.emit()` method has the following pseudo code.

```javascript
// known properties from the parent scope
componentName = 'deviceManager'; // the component that is emitting
version; // the version of the component
  
emit = function(event, optionals, payload) {
  
  _mesh.eventManager.emit(version, componentName, event, optionals, payload);

} 
```

Which calls the `_mesh.eventManager.emit()` function

```javascript
emit = function(version, componentName, optionals, event, payload) {

  // assuming its a local emit to all attached meshclient/endpoints,
  // pass straight into local happn via orchestrator's intra-process client
  
  _mesh.datalayer.services.orchestrator.peers.__self.client.set(eventPath, optionals, payload, function(e) {
    
    if (e) // this should only fail on bugs, it uses no websocket, (intra-process)
           // and probably shouldn't fail if one of the browsers out there never got the event
  
  })
  
  
  // assuming its an emit into the cluster

  // recall the already accumulated subscriptions in this eventManager
  // (example below also removes complexity presented by wildcard subscriptions)
  
  mySubscribers = {
    'deviceManager': { // subscribers to my deviceManager component
      '~1.0.2': { // possibly extraneous (already filtered out subscribers that didn't match the version we offer)
        'alert': { // the event they subscribed to
          '10-0-0-1': { // remote meshname of the subscriber
            'customerNotifier': {any: true}, // the subscribing components and their optionals
            'browserNotifier': {all: true}
          },
          '10-0-0-2': {
            'customerNotifier': {any: true}
          },
          '10-0-0-3': {
            'browserNotifier': {all: true}
          },
          '10-0-0-4': {
            'browserNotifier': {all: true}
          }
        }
      }
    }
  }
  
  // given emitting componentName = 'deviceManager' and event = 'alert'
  // reduce the above tree to a list of target mesh names given each subscribers respective optionals
  
  targets = reduce(mySubscribers, componentName, event);
  // ['10-0-0-1', '10-0-0-3', '10-0-0-4']
  
  targets.forEach(function(meshName) {
  
    eventPath = '/_CLUSTER/_EVENTS/version/componentName/event'; // version might not be needed,
                                                                 // already established version commonality
                                                                 // between subscriber and emitter
    // or
     
    eventPath = '/_CLUSTER/_EVENT' // + details in payload
    
    _mesh.datalayer.services.orchestrator.peers[meshName].client.set(eventPath, optionals, {
      eventDetails
    }, function(e) {
    
      // a much more complicated case of e... 
      // here is where we should attempt to guarantee delivery
      
      // hairy...
    
    });
  
  });
}
```

Before examining guaranteeing delivery i'd like to point out a subtle issue lurking above:
 
If the above `reduce()` function is properly optimized then it would never select `10-0-0-2/customerNotifier`
as a target because it already has to send the payload to `10-0-0-1` because of the `{all: true}` on
`browserNotifier` and wins the `customerNotifier` as bonus without further effort.

But that means there will be a permanently idle `customerNotifier` in the cluster.

Maybe that's ok. A more complicated problem arises is all node's have both `customerNotifier`
and `browserNotifier`. That means we need to send the payload to all nodes, but only one of
them must emit it at its `customerNotifier`.

For this we will need an inclusion list in the event payload, infact, we need it either way to achieve
sending one event payload to multiple subscribers on the same remote node.

Also, the `reduce()` function above is further complicated by the need to round-robin the `{any: true}` targets.

###### Guaranteeing delivery.

When the `hairy...` e occurs above we have at our disposal:

* The content of e
* The state of the happnClient socket at `orchestrator.peers[meshName].client`
* The possibly imminent 'failed' from SWIM
* The reason we sent the payload in the first place, ie. if it was `{any: true}` try sending to another instead.
* That would mean quite a complicated emitting contraption.

If e is a timeout:

* A timeout is going to happn quite long after we've already sent a whole bunch of other events.
* If we resent, we bring out of sequence-ness into play.
* If we're pre-subscribed to `connect` and `disconnet` from all `orchestrator.peers` we can detect timeouts before they happen
* That would mean quite a complicated emitting contraption.

##### Upon receiving an event

The emitter called `set('/_CLUSTER/_EVENT', eventDetails)` on our own happn instance with an event destined for us.
 
The local `_mesh.eventManager` has subscribed.

```javascript

_mesh.datalayer.services.orchestrator.peers.__self.on('/_CLUSTER/_EVENT',
  function(data, meta) {
  
    payload = data.payload
    include = data.include // ['customerNotifier', 'browserNotifier']
    
    // recall that local components, upon subscribing, populated a handler here:
    
    localSubscriptions = {
      'localComponentName/remoteComponentName/event': [handler, handler],
      'customerNotifier/deviceManager/alert': [handler],
      'browserNotifier/deviceManager/alert': [handler],
    }
    
    // note absence of versions,
    // we will only receive events we subscribed to,
    // those subscriptions contained the version we support,
    // the emitter will not send us anything other than that
    
    event = substring(meta.path, ..
    
    include.forEach(function(localComponent) {
      localSubscriptions[localcomponent + event].forEach(function(handler) {
        handler(payload, meta); // backchannel event's meta should suffice
      });
    })
   
  }
);
```

And out pops the event at the original subscriber.

```javascript
CustomerNotifier.prototype.start = function($happn) {

  $happn.event.deviceManager.on('alert', {any: true}, function(sensorReading) {
  
    // .. 
  
  });
}
```

#### Problem 4: The exchange.

It's the same problem as events. How to direct calls to specific remotes. The only difference is that the
subscriptions are replaced by the mesh node descriptions where the who's got what component-version's are
listed.

#### Solution 4: The exchange.

Each node subscribes to self at `/_CLUSTER/_REQUESTS/*` and `/_CLUSTER/_RESPONSE`

Once again this subscription to self is to allow for directed call routing without cluster-wide replication.

A call is made to `$happn.component.method('XYZ')`

It turns out to be remote.

This node has the descriptions of all other nodes.

Descriptions are consulted. (probably pre-optimized into a format for rapid consultation)

The targeting/round-robining function returns target `10-0-0-3`

The direct set is performed, this retains the component/method in the path for inter-cluster happn auth (later)

```javascript
_mesh.datalayer.orchestrator.peers['10-0-0-3'].client.set('/_CLUSTER/_REQUESTS/component/method', {
  from: '10-0-0-me',
  seq: 'locally unique number for routing back to the local caller',
  params: params
}, function(e) {

  // similar delivery effort opportunities as for events,
  // we could silently replace a failure with a retry to another target
  
  // especially in light of nodes coming and going, shutting down a node
  // will produce a flutter of errors/timeouts throughout the cluster
  // at all nodes with in-progress requests to it
  
});
```

The remote responds by setting the response at our happn instance, again precisely targeted.

```javascript
_mesh.datala....peers['10-0-0-me'].client.set('/_CLUSTER/_RESPONSE', {
  seq: number,
  result: [e, etc, etc2]
}, function(E) {
  
  // this E is a whole nother beast...
  // whatever the function does has been done...
  // but we have failed to give the result back to the caller
  
  // i'm gonna throw this one out there: What do we do now?
  
});
```

Assuming we received a reply, use the seq to route the result back to the waiting callback handler.

Done...

Apart from some subtleties in the api.

```javascript

// this now goes to local or remote instances of componentX completely indescriminately
// it also does a round robin

$happn.exchange.componentX.method();

// in order to retain the benefits of the faster local instance of componentX

$happn.exchange.componentX({prefer: 'local'}).method();

// but perhaps that is the default

// we might also like this, but it's much more complicated (perhaps later)

$happn.exchange.componentX({all: true}).method();

// and this, even more complicated

$happn.exchange.componentX({sticky: true}).method();

```

I suggest `sticky` one for good reason. My biggest fear in this whole endeavour is the potentially unrealised
extent of the difficulty in achieving component designs that are both functional AND cluster friendly.

And what i mean by that is `this`. Looking through my own work i find `this` everywhere. 
 
For example the act of calling `exchange.myComponent.ready(params1)` brings about a co-mingling between
`params1` and `this` in preparation for all subsequent calls to `exchange.myComponent.action(params2)`.

Then...

```javascript
$happn.exchange.myComponent.ready(params1);  // goes to '10-0-0-10'
$happn.exchange.myComponent.action(params2); // goes to '10-0-0-3' (oops)
$happn.exchange.myComponent.action(params2); // etc.
$happn.exchange.myComponent.action(params2);
```

Although `sticky` can go most of the way to solving the problem. The fact that remote nodes come and go means
that we'll need a way to repeat `ready()` when we get switched to another node.

Possible solution:

```javascript
$happn.myComponent.$reconnected(function() {
  $happn.myComponent.ready(params1);
});

$happn.myComponent.ready(params1);
$happn.myComponent.action(params2);
```

But how do we spread all the `stickies` evenly throughout the cluster? Tricky, but solvable.


Another possibility - recall `$origin`. We could potentially replace a large proportion of what
`this` ordinarily does by attaching things to `$origin` instead.

The great thing about exchange functions is that they have callbacks. So if we can figure out a way
to transparently carry `$origin` beyond the periphery then amendments can be made to `$origin` at
any component call depth as long as we carry it back out with the unwinding callbacks.

The only problem is that of multiple concurrent call-stacks from the same starting `$origin` could
produce conflicting ending `$origins`. (Again with the sequencing problem which becomes the only
do things one at a time problem...)

sigh.
