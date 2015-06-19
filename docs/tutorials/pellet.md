pellet is the bridge between the two isomovi environments.

pellet is a sington. so you can require it in both environments. It also is a bridge between the webpack version and the native node
this is great so you can have your http server running then inlcude the pellet middelware. then you can require the webpacked version
 of pellet and you will only get one version. pellet has function that are only run in the server side.
 
For nodejs we create a pellet and init it using startInit (pass in the config)
For broswer we init pellet with startInit but we pass 




isoContext is all about supporting the render.
---
it lets you prefetch async data. each context has props, serialize, stream and sometime has a isoProvider
The idea behind the props is this is data not needed to be serialized between the client & server but data
that is calc while running throw the render tree nodes.

isoProvider is all providing support for redirect, title, getting req/res
---

