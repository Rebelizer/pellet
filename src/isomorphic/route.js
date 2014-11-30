var pellet = require('pellet')
  , isomorphicRender = require('./render')
  , isomorphicHttp = require('./http')
  , routeTable = require('./../route-table')

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
      , renderOptions = {props:{}};

    try {
      if(process.env.SERVER_ENV) {
        if(options && typeof options.mode) {
          renderOptions.mode = options.mode;
        } else {
          //just for bots do not return react-id version (the routeContext.request comes from pellet middleware passing in the express request
          //if (!options.mode && routeContext.request) {
          //  if (/googlebot|gurujibot|twitterbot|yandexbot|slurp|msnbot|bingbot|rogerbot|facebookexternalhit/i.test(routeContext.request.headers['user-agent'] || '')) {
          //    options.mode = isomorphicRender.MODE_STRING;
          //  }
          //}
        }

        // create a isomorphic http provider for the isomorphic render
        renderOptions.http = new isomorphicHttp(
          routeContext.request,
          routeContext.respose,
          routeContext.next);
      } else {
        // create a isomorphic http provider for the isomorphic render
        renderOptions.http = new isomorphicHttp();

        // in the browser only use the serialized date once the bootstrap
        // call router  .
        if(window.__pellet__ctx) {
          renderOptions.context = window.__pellet__ctx;
          delete window.__pellet__ctx;
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

      // now render the isomorphic component
      isomorphicRender.renderComponent(_component, renderOptions, function(err, html, ctx) {
        if(process.env.SERVER_ENV) {
          var markup;

          if(err) {
            console.error('Error rendering component because:', err.message);
            routeContext.next(err);
            return;
          }

          if(!routeContext) {
            console.error('DIE because we have to have the routeContext');
            routeContext.next(new Error('NULL routeContext!'));
            return;
          }

          if(_this.skeletonPageRender) {
            routeContext.respose.end(_this.skeletonPageRender(html, ctx, renderOptions));
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
    match.fn.call(match);
  });

  pellet.addWindowOnloadEvent(function() {
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

  document.addEventListener("click",function(e) {
    var node = e.target;
    while(node) {
      if (node.nodeName == 'A') {
        if (node.dataset.externalLink == 'true') {
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

        window.History.pushState(null, null, node.href);
      }

      node = node.parentNode;
    }
  });
}
