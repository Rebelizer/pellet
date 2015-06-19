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
    var _experiment
      , routeContext = this
      , _component = component
      , renderOptions = {props:{}, isolatedConfig:runtimeIsolatedConfig, requestContext:runtimeRequestContext};

    try {
      if(process.env.SERVER_ENV) {
        if(options && typeof options.mode !== 'undefined') {
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
          routeContext.response,
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

      // now check if the route needs to unmount the page or use the default
      // reactIgnoreRouteUnmount config value
      if(options && typeof(options.onRouteUnmountReact) !== 'undefined') {
        renderOptions.onRouteUnmountReact = !!options.onRouteUnmountReact;
      } else {
        renderOptions.onRouteUnmountReact = !pellet.config.reactIgnoreRouteUnmount;
      }

      // now check if the page component is apart of a experiment and get the correct variation
      if((_experiment = pellet.experiment.select(_component, renderOptions.isolatedConfig, options.experimentId, renderOptions))) {
        _component = _experiment;
      }

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
          if(err) {
            console.error('Error rendering component because:', err.message);
            routeContext.next(err);
            return;
          }

          if(!routeContext.response.getHeader('Content-Type')) {
            routeContext.response.setHeader('Content-Type', 'text/html');
          }

          // add user-agent hash and the build number to the render options to help with cache control
          renderOptions.ushash = utils.djb2(routeContext.request.headers['user-agent']||'').toString(32);
          renderOptions.manifest = pellet.options.manifest;

          if(_this.skeletonPageRender) {
            html = _this.skeletonPageRender(html, ctx, renderOptions);
          }

          // if expressjs or nodejs
          if(routeContext.response.status) {
            routeContext.response.send(html);
          } else {
            routeContext.response.end(html);
          }

        } else {
          if(err) {
            console.error('Error trying to render because:', err.message, err.stack);
          }
        }

        // now instrument the route change so pageviews can be tracked
        pellet.instrumentation.emit('routechange', {
          originalUrl: renderOptions.props.originalUrl,
          params: renderOptions.props.params,
          query: renderOptions.props.query,
          url: renderOptions.props.url,
          pipeline: ctx
        });

      });
    } catch(ex) {
      console.error('Error trying to render because:', ex.message, ex.stack);
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
      match.response = res;
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

  var currentLocation = location.pathname + location.search;
  function navigate(newLocation, match) {
    console.debug('pellet navigate(', newLocation, ')');
    if (newLocation === currentLocation) {
      return;
    }

    currentLocation = newLocation;

    if(!match) {
      match = pellet.routes.parse(newLocation);
    }

    if(match) {
      console.debug('pellet matched route', newLocation);
      match.fn.call(match);
    } else {
      console.error('Can not find route for:', newLocation);
      window.location = newLocation;
    }
  };

  pellet.addWindowOnreadyEvent(function() {
    // handle back and forward button requests
    window.addEventListener('popstate', function() {
      navigate(location.pathname + location.search);
    });
  });

  pellet.setLocation = function(url, title, data) {
    if(!url) {
      return
    }

    var match = pellet.routes.parse(url);
    if(!match) {
      console.debug('set via window.location')
      window.location = url;
      return;
    }

    console.debug('set via window.history.pushState')
    window.history.pushState(data || null, title || '', url);
    navigate(url);
  }

  document.addEventListener('click', function(e) {
    var node = e.target;
    while(node) {
      if (node.nodeName == 'A') {

        if (node.hasAttribute('data-stop-propagation')) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        if (node.getAttribute('data-external-link') == 'true') {
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

        window.history.pushState(null, '', href);
        navigate(href, match);
      }

      node = node.parentNode;
    }
  });
}
