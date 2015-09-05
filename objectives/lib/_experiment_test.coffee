objective.only 'Experiments with mesh nodes', ->


    context 'What has bluebird\'s promisify enabled', ->

        # start lots of mesh nodes
        # ------------------------
        # 
        #       1 = 408ms
        #      10 = 612ms  (huh?) the before hooks are not run in parallel
        #     100 = 2243ms
        #    1000 = 36958ms
        #

        before -> @nodes = []

        for i in [1..1]

            do (i) -> before (Mesh, done) ->

                @timeout 2000

                Mesh.start 40000 + i

                .then (mesh) => 

                    @nodes.push mesh
                    done()

                .catch done



        it '', -> console.log @nodes.map ({_mesh}) -> _mesh.config.name

