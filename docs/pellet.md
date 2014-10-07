pellet is the bridge between the two isomovi envirments.

pellet is a sington. so you can require it in both envirments. It also is a bridge between the webpack version and the native node
this is great so you can have your http server running then inlcude the pellet middelware. then you can require the webpacked version
 of pellet and you will only get one version. pellet has function that are only run in the server side.
 
For nodejs we create a pellet and init it using startInit (pass in the config)
For broswer we init pellet with startInit but we pass 