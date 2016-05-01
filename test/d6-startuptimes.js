

var config1 = {
    name: "vanilla",
    port:55001
};

var config2 = {
    name: "secure",
    port:55002,
    datalayer:{
        secure:true
    }
};

var config3 = {
    name: "secure",
    port:55003,
    datalayer:{
        secure:true,
        keyPair:{
            privateKey:'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
            publicKey:'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2'
        }
    }
};

var Mesh = require('../');

describe('d6-startup-times', function() {

    this.timeout(120000);

    //require('benchmarket').start();
    //after(require('benchmarket').store());

    var createMesh = function(config, cb){
        var mesh = new Mesh();
        mesh.initialize(config, function (err){
            cb(err);
        });
    }

    it('starts up a vanilla mesh', function (done) {

        console.time('startup-vanilla');

        createMesh(config1, function(err){
            if (err) return done(err);
            console.timeEnd('startup-vanilla');
            done();
        });

    });

    // it('starts up a secure mesh', function (done) {
    //
    //     console.time('startup-secure');
    //
    //     createMesh(config2, function(err){
    //         if (err) return done(err);
    //         console.timeEnd('startup-secure');
    //         done();
    //     });
    //
    // });
    //
    // it('starts up a secure mesh, with a predefined keypair', function (done) {
    //
    //     console.time('startup-secure-predefinedkey');
    //
    //     createMesh(config3, function(err){
    //         if (err) return done(err);
    //         console.timeEnd('startup-secure-predefinedkey');
    //         done();
    //     });
    //
    // });

});

