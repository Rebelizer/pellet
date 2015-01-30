# [Pellet](http://.github.io/pellet)

Build SEO friendly rich isomorphic app using React, webpack, nodejs, and FRP

[![Build Status](http://img.shields.io/travis/Rebelizer/pellet.svg?style=flat)](https://travis-ci.org/Rebelizer/pellet)
[![Issues](http://img.shields.io/github/issues/Rebelizer/pellet.svg?style=flat)](https://github.com/Rebelizer/pellet/issues)
[![NPM Version](http://img.shields.io/npm/v/pellet.svg?style=flat)](https://www.npmjs.org/package/pellet)
[![Dependency Status](https://david-dm.org/Rebelizer/pellet.svg?style=flat)](https://david-dm.org/Rebelizer/pellet)
[![License](http://img.shields.io/npm/l/express.svg?style=flat)](https://github.com/Rebelizer/pellet/blob/master/LICENSE)

[ ![Codeship Status for Rebelizer/pellet](https://www.codeship.io/projects/583a1140-2c2a-0132-b244-7ed6f3cea7da/status)](https://www.codeship.io/projects/38759)

## Installation
```
$ npm install -g pellet
```
## Is this you?

You love React/Webpack/NodeJS/Jade. You care about having a SEO friendly application, but you need a dynamic application that can render its pages on the client without any dependencies on your server. You need an easy way to compose your applications making deployment, A/B tests, and reusable components a cinch. You care about instrumentation, logging, and analytics, and you want to track user behavior on your site. You care about testing, and you want good tools for running, building, and deploying. You want to use react, jade, cjs, js/cs and other modern technologies. You need to support not only desktop, but also mobile, tv, and other devices.

Sounds like you? Then you are like VEVO, and we are open sourcing pellet, our tool that does all of this. In under five minutes you can have your first project up and running with all of the above bells and whistles. Check out pellets features below.

## Motivation

Pellet was built to support VEVO's isomorphic web platform. Last year VEVO was responsible for 40+ billion videos watched globally and
served out a ton of pages in multi languages and devices. The problem that VEVO is facing is the need to have an SEO friendly web platform,
but also to have a dynamic RIA web application.

AngularJS, Amber, BACKBONE, meteor are great, but it is hard to build a solution that cleanly manages SEO in multiple languages, devices,
support social share bots, etc. These technologies are great for building UI and interactive applications, but not for SEO and social share bots.
That is where Pellet comes in. Pellet is letting VEVO build an isomorphic web application that runs as RIA web app, but is SEO friendly, localized, and fast
enough to support a large site. 

Pellet is letting VEVO build components, pages, and layouts that can run on both the server and client.
So when a request for a URI comes in (from a user, SEO/social share bot) the server can generate the markup with the same exact code used on the client.
Then the code sent to the client can render any page without the need for the server anymore. This is achieved by Pellet building a client and server version
of your code, automatically making your code isomorphic. On the request to the server we get the data, render a page, set headers, and serialize the state
on the server so the RIA can pick it up. Then when the page is sent to the browser or bot it's like any other website, but in cases when the request goes to a browser
we can initialize the RIA web application with the server's serialize state. In this step the page is bootstrapped and made live, so as the user navigates 
the site there is no need to ask the server for anything, except for RESTFull API data.


## Features
  * Isomorphic environment
  * Robust routing
  * Instrumentation, logging, statsd, and alerting
  * FRP, event, and coordinator support
  * Flexible multi-environment configuration (dev, staging, prod)
  * Manifest based composition
  * Modular page, component, and layout/skin framework
  * Very extensible and flexible architecture
  * Webpack based with asset management
  * Preconfigured to support
    * css, less, stylus
    * jsx, cjs, jade
    * JavaScript, CoffeeScript, es6
  * Multi device and platform support
    * Web desktop, mobile, tablet
    * Cordova
  * Easy Tooling
    * Managed HTTP/HTTPS/spdy server
    * Polyfill server
    * Watch and reload development mode
    * CLI tools to create projects, 
    * Deployment tools
    
## Quick Start
#### Create your first project
After installing Pellet you can use Pellet to create an empty project (an opinionated boilerplate). Just follow the prompts and answer the questions.
```
$ cd /tmp
$ pellet init
```
Example:
```
Name: (tmp) demo
Version: (0.0.0)
Create Directory: (Y/n)
Template Type: (Use arrow keys)
❯ Jade 
  JSX 
Language: (Use arrow keys)
❯ JavaScript 
  CoffeeScript 
Styles: (Use arrow keys)
❯ stylus 
  css 
  none 
About to:
 Create: /tmp/demo/config
 Create: /tmp/demo/public
 Create: /tmp/demo/src/page-skeleton.ejs
 Create: /tmp/demo/src/page-500.ejs
 Create: /tmp/demo/src/page-404.ejs
 Create: /tmp/demo/frontend
 Create: /tmp/demo/.pellet
 Create: /tmp/demo/frontend/index.jade
 Create: /tmp/demo/frontend/index.js
 Create: /tmp/demo/assets/o.styl
 Create: /tmp/demo/assets/reset.styl
 Create: /tmp/demo/manifest.json

Is this ok: (Y/n)
```
#### Start your project
Now that we have a new project, let's build and run it. We will use Pellet internal web server to make the setup easy, but you can use your own server if you want.
```
$ cd /tmp/demo
$ pellet run --build
```
Wait until you see "Listen on 8080 0.0.0.0" in the terminal, then visit the demo app in your browser [http://localhost:8080/](http://localhost:8080/).
You should see a web page displaying a page with "My index Page".
Now let's stop the server and restart it in --watch mode. This will let us edit our files and see our changes without having to start/stop our server
each time we make a change. Type control-c in the terminal to stop the server.
```
$ pellet run --watch --clean
```
This will now start the server in watch mode. The --clean will make sure the previous build files get cleaned up so you know your environment is clean.
Now that the server is running in watch mode reload [http://localhost:8080/](http://localhost:8080/) in the browser.
Now update the files /tmp/demo/frontend/index.jade and /tmp/demo/frontend/index.js to:

index.jade
```jade
.index-page
  style
    | .todo-list {clear:both;padding-top:20px}
    | ul {width:300px; padding:0;}
    | li {list-style: none;}
    | li button {float:right}
  h1 Pellet TODO
  input(style={float:'left'}, onKeyDown=this.keydown, ref='text')
  button(style={float:'left'}, onClick=this.add) ADD
  .todo-list
    if !this.state.items || this.state.items.length == 0
      p NO ITEMS
    else
      div
        ul
          for item,ix in this.state.items
            li
              span #{ix}: #{item}
              button(onClick=this.del.bind(this, ix)) X
        p #{this.state.items.length} things todo
```
index.js
```js
var React = require("react")
  , indexJade = require('./index.jade')
  , pellet = require("pellet");

module.exports = indexPage = pellet.createClass({

  routes: ["/", "/index"],

  getInitialState: function() {
    return {
      items: []
    };
  },

  keydown: function(event) {
    if(event.keyCode==13) {
      this.add();
    }
  },

  add: function() {
    var el = this.refs.text.getDOMNode();
    this.setState({items: this.state.items.concat(el.value)});
    el.value = '';
    el.focus();
  },

  del: function(ix) {
    this.state.items.splice(ix,1);
    this.setState({items: this.state.items});
  },

  render: function() {
    return indexJade(this);
  }
});
```

Now reload [http://localhost:8080/](http://localhost:8080/) and you should see "My index Page" then a flicker to "Pellet TODO".
This is due to the fact that Pellet's file watch will only reload the client side code and does not restart the server.
So the markup downloaded to the client is the old code and then Pellet runs the new code on the client forcing a refresh.
This renders the latest code and that is the flicker that you see. To fix this problem you just need to restart the server.
Just control-c and rerun Pellet via "pellet run --watch --clean" - voila! Refresh and no flicker. Now let's add a new page.
```
$ cd /tmp/demo/frontend
$ pellet create

Type to create: (Use arrow keys)
❯ Component 
  Page 
  Layout 
  Project 
Name: (frontend) hello-world
Version: (0.0.0)
Create Directory: (Y/n)
Template Type: (Use arrow keys)
❯ Jade 
  JSX 
Language: (Use arrow keys)
❯ JavaScript 
  CoffeeScript 
Styles: (Use arrow keys)
❯ stylus 
  css 
  none 
Include unit tests: (Y/n)
Manifest location: (Use arrow keys)
❯ Update /tmp/demo/manifest.json 
  Create /tmp/demo/frontend/manifest.json 
  Create /tmp/demo/frontend/pellet.json 
  None (skip updating manifest) 

About to:
 Create: /tmp/demo/frontend/hello-world
 Create: /tmp/demo/frontend/hello-world/hello-world.jade
 Create: /tmp/demo/frontend/hello-world/hello-world.js
 Create: /tmp/demo/frontend/hello-world/hello-world.styl
 Create: /tmp/demo/frontend/hello-world/hello-world.test.js
 Overwrite: /tmp/demo/manifest.json

Is this ok: (Y/n)

$ pellet run --watch --clean

```

## Caveats

Some features of Jade are not supported, like filters, mixins and cases. You can use other things like if/else, inline functions, and require() as alternatives. 
Additionally if there are more than one root nodes, only the last statement is returned. Same for block statements. This can become a problem if your jade file
does not have a single root node, or if your jade code has if or loop statements that do not have a single root node.
Using forEach in code instead of the each block will output nothing (forEach returns nothing). For example:
```jade
if true
  p line one
  p line two
```
will output only "line two" because it has more then one root. To fix this problem just add a div to make one root like this:
```jade
if true
  div
    p line one
    p line two
```

If you want to add a react component in your jade code you can reference it by prepend "pellet_" and the component's name in the manifest.
The jade arguments will become the react props making it easy to build up the react DOM tree. For example if you have a component named imageTitle that
requires a props of {alt:'', src:'', size:10} you could add it to your jade like this:
```jade
h1 My image title
pellet_imageTitle(alt='test alt tag', src='http://foobar.com/image.png', size=10)
```

If you need to debug/see what your Jade code becomes in react code check out the build/[browser|server]/component.js

Because jade files can be included into your JavaScript and CoffeeScript you separate your view/controller code and also have multiple views loaded
into one controller. This is useful for A/B testing, reusing view code, A/B testing, etc. For example you can have controller code like this:
```js
var mixin = require('../imgTile.jade');
var panelA = require('./detail-panel-ver-a.jade');
var panelB = require('./detail-panel-ver-b.jade');

// react render function
render: function() {
  this.imgTileMixin = mixin;
  if(showVerAToUser === true) {
    return panelA(this);
  } else {
    return panelB(this);
  }
}
// both panelA, panelB can now have mixin so they can loop over arrays and output
// imgTile using this markup/logic that can bind back to the shared controller.
```

## Resources

Installing | First project
--- | ---
[ ![Pellet Feature](https://i.vimeocdn.com/video/499253411_269x160.jpg)](https://vimeo.com/113803495) | [ ![Pellet Feature](https://i.vimeocdn.com/video/499268101_269x160.jpg)](https://vimeo.com/113814628)

Internationalization | Internals
--- | ---
[ ![Pellet Feature](https://i.vimeocdn.com/video/499332561_269x160.jpg)](https://vimeo.com/113864644) | [ ![Pellet Feature](https://i.vimeocdn.com/video/499343647_269x160.jpg)](https://vimeo.com/113872939)

Slide show

[ ![Pellet Feature](https://0701.static.prezi.com/preview/6tcj7fus3ivijcilxaqmfy2sraadw6rhlm5vs2oll757hbaoaxlq_0_0.png)](http://prezi.com/kvbmrvtb834p/present/?auth_key=qkcc1w5&follow=dbjt8a3qpkkm&kw=present-kvbmrvtb834p&rc=ref-111548884)

## Contribution

You are welcome to contribute by opening an issue or a pull request.

You are also welcome to correct any spelling mistakes or any language issues, because my english is not perfect...

## Contributors

## License

MIT
