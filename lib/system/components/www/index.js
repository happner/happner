// Default www module.


module.exports.method1 = function($happn, req, res, next) {

  res.end($happn.config.meshName + " says, 'Hello.'");

        // bare bones connect stack .send() does not exist
       // install your choice of 'global' middleware (see below)

}



module.exports.method919 = function($happn, arg, callback) {

  // called directly from the browser, see ./static/index.html

  $happn.log.info('A browser says: ' + arg);
  callback(null, $happn.config.meshName + " says, 'Hello'");

}

module.exports.globalmiddleware1 = function($happn, req, res, next) {

  $happn.log.info('globalmiddleware1');
  next();

  // same as app.use(function)

}

module.exports.globalmiddleware2 = function($happn, req, res, next) {

  $happn.log.info('globalmiddleware2');
  next();

}


// // eg. connect middleware

// var bodyParser = require('body-parser');
// module.exports.myParser = bodyParser.urlencoded();



module.exports.$happner = {
  config: {
    component: {   // Default config for components that use this module
      web: {       // Defined mesh config will override
        routes: {


          // a sequence of ((global)) middleware
          // -----------------------------------
          //
          // - DECLARE FIRST !! <------------------------------------------------NB
          //                            middleware sequence matters...
          //
          //
          // - Also declare the 'www' component first in config.
          // 
          // - global means it applies to all inbound web requests
          //   including those for other components in the mesh node
          //   
          // - !! only the www component can define global middleware  <---------NB
          //
          global: ['globalmiddleware1', 'globalmiddleware2' /* ,myParser */ ],



          // Serves from ./static as static content
          // --------------------------------------
          //
          // - static content is usually served at 
          //   componetName/routeTag but the www component
          //   is special! 
          //
          // - this static is served at /   <------------------------------------NB
          //
          // - and as with all statics, defaults to index.html
          //   
          static: 'static',

          // could point static at webmethod, still serves /
          // 
          // static: 'method1',


          // Webroute to the method1() above
          // -------------------------------
          //
          //  http://localhost:55000/hello
          //                    //
          //                   // the default port
          //
          //  - only the www component serves webmethods on /  <-----------------NB
          //
          //
          //
          hello: 'method1',

        }
      }
    }
  }
}
