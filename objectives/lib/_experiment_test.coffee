objective 'Play with mesh nodes', ->

    before ->

        mock 'should', new require('chai').should()


    context 'bounce a request randomly for n hops between n nodes', ->

        # and collect the edges traversed

        before -> @nodes = []

        before (Mesh, done) ->

            @timeout 20000

            nodecount = 3

            endpoints = {}

            endpoints["node#{i}"] = 40000 + i for i in [1..nodecount]
            # connects every pair including connection to self


            class BounceModule

                constructor: (@i) ->

                method: ($happn, hops, stopAt, callback) ->

                    hops++

                    name = $happn.info.mesh.name

                                    #
                                    # end of hops,
                                    # callback with array for traversals accumulations
                                    #
                    return callback null, [ ] if hops >= stopAt

                    next = Math.floor( Math.random() * nodecount ) + 1
                    nextEndpoint = "node#{next}"

                    $happn.log.info('at hop ' +hops+ ' - ' + name + ' forwarding to ' + nextEndpoint);

                    $happn.exchange[nextEndpoint].bouncer.method hops, stopAt

                    .then (traversals) -> 

                        # put this hop into the array and callback further
                        # 
                        # - the callback stack unwinds toward the original
                        #   caller.
                        #
                        # - along the way the array of traversals is built.
                        #

                        console.log 'back1'

                        traversals.unshift([name, nextEndpoint]);

                        console.log 'back2'

                        callback(null, traversals);

                        console.log 'back3'

                        #
                        # datalayer issue
                        # ---------------
                        #
                        # (with no change in test code)
                        #
                        # sometimes i get this:
                        #
                        #   (silence)
                        #
                        #
                        # sometimes i get this:
                        #
                        #      back1
                        #      back2
                        #      back3
                        #    (silence)
                        #
                        #
                        # sometimes i get this:
                        #
                        #      back1
                        #      back2
                        #      back3
                        #      back1
                        #      back2
                        #      back3
                        #    (silence)
                        #
                        #  It has never gotten more than 2 hops back to the caller.
                        #
                        

                    .catch (err) -> callback(err);


            Mesh.Promise.all(

                for i in [1..nodecount]

                    do (i) -> Mesh.start

                        name: "node#{i}"

                        datalayer: port: 40000 + i

                        endpoints: endpoints

                        modules: bouncer: instance: new BounceModule i

                        components: bouncer: {}


            ).then (@nodes) => done()

            .catch done


        xit 'start bouncing', (done) ->

            @timeout 2000

            @nodes[0].exchange

            .node2.bouncer.method hops = 0, stopAt = 10

            .then (reply) ->

                console.log 'reply', reply

                done()

            .catch done


    context 'the promisified functions on the exchange', ->

        before (done, bluebird, Mesh) ->

            @timeout 2000

            Mesh.start

                port: 45678

                modules:

                    test: instance:

                        func1: (arg1, callback) ->

                            setTimeout (-> callback null, value: arg1), 10
                        
                        func2: (arg1, arg2, arg3, callback) -> 

                            callback null,

                                a: arg1
                                b: arg2
                                c: arg3


                        func3: (arg1, arg2, arg3, $happn, arg4, callback) ->

                            # handle possible promises (or not) in the inbound args

                            bluebird.Promise.all([arg1, arg2, arg3, arg4])

                            .spread (arg1, arg2, arg3, arg4) ->

                                callback null,

                                    a: arg1
                                    b: arg2
                                    c: arg3
                                    d: arg4

                            .catch callback # send error back



                components: test: {}

            .then (mesh) ->

                mock 't', mesh.exchange.test
                done()

            .catch done

        xit """(update: it does not) 
              might automatically deal with promises as arguments""", {

            description: """

                eg.

                $happn.exchange.component.methodThatTakesNormalArgs(

                    // but the method also detects inbound promises
                    // and behaves accordingly

                    $happn.exchange.component.methodThetReturnsPromise(args),
                    'normal arg value',
                    $happn.exchange.component.methodThetReturnsPromise(args),
                    $happn.exchange.component.methodThetReturnsPromise(args)

                ).then...

            """

        }, (done, t) ->

            promise1 = t.func1 1
            promise2 = t.func1 2
            promise3 = t.func1 3

            t.func2 promise1, promise2, promise3

            .then (r) ->

                r.should.eql

                    a: value: 1
                    b: value: 2
                    c: value: 3

                done()

            .catch done

        it.only 'can handle promises as arguments if the method can', (done, t) ->

            t.func3(
                t.func1 1
                'Not a promise.'
                t.func1 3
                t.func1 4
            )

            .then (r) ->

                r.should.eql

                    a: value: 1
                    b: 'Not a promise.'
                    c: value: 3
                    d: value: 4

                done()

            .catch done


            

