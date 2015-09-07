objective 'bounce a request randomly for n hops between n nodes', ->

    before -> mock 'should', new require('chai').should()



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
