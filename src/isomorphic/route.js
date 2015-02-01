var pellet = require('pellet')
  , pelletRender = require('./../render')
  , isomorphicHttp = require('./http')
  , utils = require('../utils')
  , routeTable = require('./../route-table')

var runtimeIsolatedConfig = null;
var runtimeRequestContext = null;
if(process.env.BROWSER_ENV) {
  runtimeIsolatedConfig = {};
  runtimeRequestContext = {};
}

pellet.routes = new routeTable(); // TODO: pass in an options for sensitive & strict vi pellet.config
pellet.skeletonPageRender = false;

pellet.setSkeletonPage = function(templatingFn) {
  this.skeletonPageRender = templatingFn;
};

/**
 *
 * @param route
 * @param component
 * @param options
 */
pellet.addComponentRoute = function(route, component, options) {
  var _this = this;

  this.routes.add(route, function() {
    var routeContext = this
      , _component = component
      , renderOptions = {props:{}, isolatedConfig:runtimeIsolatedConfig, requestContext:runtimeRequestContext};

    try {
      if(process.env.SERVER_ENV) {
        if(options && typeof options.mode) {
          renderOptions.mode = options.mode;
        } else {
          //just for bots do not return react-id version (the routeContext.request comes from pellet middleware passing in the express request
          //if (!options.mode && routeContext.request) {
          //  if (/googlebot|gurujibot|twitterbot|yandexbot|slurp|msnbot|bingbot|rogerbot|facebookexternalhit/i.test(routeContext.request.headers['user-agent'] || '')) {
          //    options.mode = pelletRender.MODE_STRING;
          //  }
          //}
        }

        // create a isomorphic http provider for the isomorphic render
        renderOptions.http = new isomorphicHttp(
          routeContext.request,
          routeContext.respose,
          routeContext.next);

        renderOptions.requestContext = routeContext.request.requestContext;
      } else {
        // create a isomorphic http provider for the isomorphic render
        renderOptions.http = new isomorphicHttp();

        // in the browser only use the serialized date once the bootstrap
        // call router.
        if(window.__pellet__ctx) {
          renderOptions.context = window.__pellet__ctx;
          delete window.__pellet__ctx;

          if(typeof(renderOptions.context) === 'string') {
            renderOptions.context = JSON.parse(renderOptions.context);
          }

          if(typeof(renderOptions.context.requestContext) !== 'undefined') {
            runtimeRequestContext = renderOptions.requestContext = renderOptions.context.requestContext;
            delete renderOptions.context.requestContext;
          }
        }
      }

      // merge in the routes argument into the props
      renderOptions.props.originalUrl = routeContext.originalUrl;
      renderOptions.props.params = routeContext.params;
      renderOptions.props.query = routeContext.query;
      renderOptions.props.url = routeContext.url;

      // if a layout is defined we swap the component with its layout component
      // and pass the component to the layout using layoutContent props.
      // NOTE: _component is needed because the way the addComponentRoute closer
      //       we do not want to over write component because the next call will
      //       be wrong!
      if(_component.__$layout) {
        renderOptions.props.__layoutContent = _component;
        _component = pellet.components[_component.__$layout];
      }

      // use pellets default locale lookup function (devs can overwrite this for custom logic)
      renderOptions.locales = _this.suggestLocales(renderOptions, _component, options);

      // now render the component (using isomorphic render)
      pelletRender.renderComponent(_component, renderOptions, function(err, html, ctx) {
        if(process.env.SERVER_ENV) {
          var markup;

          if(err) {
            console.error('Error rendering component because:', err.message);
            routeContext.next(err);
            return;
          }

          if(!routeContext.respose.getHeader('Content-Type')) {
            routeContext.respose.setHeader('Content-Type', 'text/html');
          }

          // add user-agent hash and the build number to the render options to help with cache control
          renderOptions.ushash = utils.djb2(routeContext.request.headers['user-agent']||'').toString(32);
          renderOptions.manifest = pellet.options.manifest;

          if(_this.skeletonPageRender) {
            html = _this.skeletonPageRender(html, ctx, renderOptions);
          }

          // if expressjs or nodejs
          if(routeContext.respose.status) {
            routeContext.respose.send(html);
          } else {
            routeContext.respose.end(html);
          }

        } else {
          if(err) {
            console.error('Error trying to render because:', err.message, err.stack);
          }
        }
      });
    } catch(ex) {
      console.error('Error trying to render because:', ex.message);
      if(process.env.SERVER_ENV) {
        routeContext.next(ex);
      }
    }
  }, options);
};

if(process.env.SERVER_ENV) {
  // SERVER ENVIRONMENT
  // add our basic routing middleware

  pellet.middlewareStack.push({
    priority: 10,
    fn: function (req, res, next) {
      var match = pellet.routes.parse(req.originalUrl);
      if (!match) {
        return next();
      }

      match.request = req;
      match.respose = res;
      match.next = next;

      match.fn.call(match);
    }
  });
} else if(process.env.BROWSER_ENV) {
  // BROWSER ENVIRONMENT
  // bootstrap the browser environment but triggering the route
  // the page was loaded and replay the events on the server
  // render.

  pellet.onReady(function() {
    var match = pellet.routes.parse(location.pathname + location.search);
    if(match && match.fn) {
      match.fn.call(match);
    }
  });

  pellet.addWindowOnreadyEvent(function() {
    // add a listener to the history statechange and route requests
    window.History.Adapter.bind(window, "statechange", function() {
      var match = pellet.routes.parse(location.pathname + location.search);
      if(match) {
        match.fn.call(match);
      } else {
        console.error('Can not find route for:', location.pathname + location.search);
      }
    });
  });

  pellet.setLocation = function(url, title, data) {
    if(!url) {
      return
    }

    var match = pellet.routes.parse(url);
    if(!match) {
      console.log('set via window.location')
      window.location = url;
      return;
    }

    console.log('set via window.History.pushState')
    window.History.pushState(data || null, title || '', url);
  }

  document.addEventListener("click",function(e) {
    var node = e.target;
    while(node) {
      if (node.nodeName == 'A') {
        if (node.getAttribute('data-externalLink') == 'true') {
          return;
        }

        if(node.target && node.target != '_self') {
          return;
        }

        var href = node.getAttribute('href');
        if(!href) {
          return;
        }

        var match = pellet.routes.parse(href);
        if(!match) {
          return;
        }

        e.stopPropagation();
        e.preventDefault();

        window.History.pushState(null, '', node.href);
      }

      node = node.parentNode;
    }
  });
}
