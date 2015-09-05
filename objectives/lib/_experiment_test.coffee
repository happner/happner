objective.only 'plays with mesh nodes', ->


    context 'bounce a request randomly for n hops between n nodes', ->

        # and collect the edges traversed

        before -> @nodes = []

        before (Mesh, done) ->

            @timeout 20000

            nodecount = 2

            # assemble endpoint list
            #
            # config supports a shortened endpoint definition
            # endpoints: {
            #   'name': port  // assumes localhost
            #   'name': 'host:port'    
            # }
            #
            #

            endpoints = {}

            endpoints["remote_node#{i}"] = 40000 + i for i in [1..nodecount]
            # connects every pair including connection to self


            class BounceModule

                constructor: (@i) ->

                method: ($happn, {count, edges}, callback) ->

                    console.log('run!', @i);

                    console.log(count, edges);
                    callback(null, {});


            Mesh.Promise.all(

                for i in [1..nodecount]

                    do (i) -> Mesh.start

                        datalayer: port: 40000 + i

                        endpoints: endpoints

                                            #
                                            # Notice that an instance can be
                                            # placed directly onto the config.
                                            #
                                            # Obviously this will prevent proper
                                            # storage of the config in the datalayer,
                                            # preventing functionality transmissions
                                            # (jobs, etc.)
                                            # between mesh nodes (future feature)
                                            #
                                            #
                        modules: bouncer: instance:  new BounceModule i

                        components: bouncer: {}


            ).then (@nodes) => done()

            .catch done



        it 'start bouncing', (done) ->

            @nodes[0].exchange

            .remote_node1.bouncer.method

                count: 0

                edges: []

            .then (reply) ->

                console.log 'reply', reply

                # ??????????? something's wrong.

                done()

            .catch done



