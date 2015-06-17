objective
    
    title: 'Happn Mesh Objectives'
    # codename: 'orchestral'
    uuid: '72e2db83-bfaf-4c07-b348-4253d17be9a2'
    description: ''
    repl: listen: '/tmp/socket-72e2db83-bfaf-4c07-b348-4253d17be9a2'
                # windows can't do file sockets
                # objective --attach (in another console)
                # tab completion does not work in remote repl
    plugins: 
        'objective-dev':
            sourceDir: '../../lib' # search here for LocalModules to inject
            testAppend: '_test'    # only run these recursed files as tests


.run (recurse, prompt, pipeline) ->

    recurse ['tests']

    # .then -> prompt.start()

    # pipeline.on 'dev.test.after.each', (stuff, next) ->

    #     console.log stuff
    #     next()

    # console.log pipeline.pipes

