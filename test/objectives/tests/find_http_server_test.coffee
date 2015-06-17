objective 'find where http server start is called', ->

    server = null

    after -> server.close() if server?

    it 'starts the mesh', (Mesh, http, done) ->

        http.stub

            # replace http.createServer()

            createServer: ->

                console.log 'http.createServer(\n', arguments

                console.log 'partial stack:'

                [7..10].forEach (i) ->

                    console.log "depth #{i}": objective.getCaller(i)

                # call original http.createServer, 
                # remember server (result) for able to close in after hook

                return server = mock.original.apply this, arguments


        (mesh = Mesh()).initialize

            name: 'nameOFmesh'
            dataLayer:
                port: 3000
                authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3'
                systemSecret: 'mesh'
                log_level: 'info|error|warning'
            endpoints: {}
            modules: {}
            components: {}

            (err) ->

                throw err if err?


                # my favourite feature:
                # 
                #     'wait() & see.*'
                #

                wait(server, mesh)

                #
                # It suspends the test walker from proceeding to the next step even
                # if done was called.
                # 
                # in the repl (prompt)
                # see.server <enter>
                # see.mesh.api.exchange <enter>
                # see.mesh.describe() <enter>
                # see. <tab, tab>
                # see.done to finish, or resave test without wait()


                done()
