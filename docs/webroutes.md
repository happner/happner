[&#9664;](data.md) data api | starting a mesh node [&#9654;](starting.md)

## Web Routes

*web routes can be defined in the happner config, please see [the test for now](https://github.com/happner/happner/blob/master/test/9-web-middleware.js)*

*when the happner instance is run in secure mode, all web routes need to be assigned permissions before users can access them via a token, please see [the secured routes test](https://github.com/happner/happner/blob/master/test/c7-permissions-web.js)*

*note - routes can be excluded from the token check, [here is where in the config](https://github.com/happner/happner/blob/master/test/c7-permissions-web.js#L29) [and here is where a an exclusion is tested](https://github.com/happner/happner/blob/master/test/c7-permissions-web.js#L140)*

index.html default in static

array of mware funcs