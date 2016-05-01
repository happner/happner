

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

var Mesh = require('../../');


//require('benchmarket').start();
//after(require('benchmarket').store());

var createMesh = function(config, cb){
    var mesh = new Mesh();
    mesh.initialize(config, function (err){
        cb(err);
    });
}

console.time('startup-vanilla');

createMesh(config1, function(err){
    if (err) return done(err);
    console.timeEnd('startup-vanilla');
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


