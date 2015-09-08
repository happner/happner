objective 'try the promisified functions on the exchange', ->

    before -> mock 'should', new require('chai').should()


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


    it 'can handle promises as arguments if the method can', (done, t) ->

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


        

