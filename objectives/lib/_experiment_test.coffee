xobjective 'Play with mesh nodes', ->


    context 'bounce a request randomly for n hops between n nodes', ->

        # and collect the edges traversed

        before -> @nodes = []

        before (Mesh, done) ->

            @timeout 20000

            @nodecount = 3

            endpoints = {}

            endpoints["node#{i}"] = 40000 + i for i in [1..@nodecount]
            # connects every pair including connection to self


            class BounceModule

                constructor: (@i) ->

                method: ($happn, {hops, traversed}, callback) ->

                    #console.log 'name', $happn.info.mesh.name, $happn.info.datalayer.address, $happn.info.datalayer.options

                    callback null, traversed if hops == 0

                    next = Math.round Math.random() * 1000 / 100

                    endpoint = "node#{next}"

                    console.log('run!', @i);
                    console.log(hops, traversed);
                    callback(null, {});


            Mesh.Promise.all(

                for i in [1..@nodecount]

                    do (i) -> Mesh.start

                        name: "node#{i}"

                        datalayer: port: 40000 + i

                        endpoints: endpoints

                        modules: bouncer: instance: new BounceModule i

                        components: bouncer: {}


            ).then (@nodes) => done()

            .catch done


        it 'start bouncing', (done) ->

            console.log 'start'

            @timeout 2000

            @nodes[0].exchange

            .node2.bouncer.method

                hops: 10

                traversed: []

            .then (reply) ->

                console.log 'reply', reply

                done()

            .catch done



