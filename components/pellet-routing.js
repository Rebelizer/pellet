var pellet = require('pellet')
  , isomorphicRender = require('../src/isomorphic-render')
  , isomorphicMiddlewareProvider = require('../src/isomorphic-middleware-provider')
  , routeTable = require('../src/route-table')

pellet.routes = new routeTable();
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
  var self = this;

  this.routes.add(route, function() {
    var routeContext = this
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

        // create a isomorphic req/res provider for the isomorphic render
        renderOptions.provider = new isomorphicMiddlewareProvider(
          routeContext.res,
          routeContext.res,
          routeContext.next);

      } else {
        // create a isomorphic req/res provider for the isomorphic render
        renderOptions.provider = new isomorphicMiddlewareProvider();

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

      // use pellets default locale lookup function (devs can overwrite this for custom logic)
      renderOptions.locales = self.suggestLocales(renderOptions, component, options);

      // now render the isomorphic component
      isomorphicRender.renderComponent(component, renderOptions, function(err, html, ctx) {
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

          if(self.skeletonPageRender) {
            routeContext.respose.end(self.skeletonPageRender(html, ctx, renderOptions));
          } else {
            routeContext.respose.end(html);
          }
        } else {
          if(err) {
            console.error('Error trying to render because:', ex.message);
          }

          if(renderOptions.provider.title) {
            window.document.title = renderOptions.provider.title;
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

  window.onload = function() {
    pellet.onReady(function() {
      var match = pellet.routes.parse(location.pathname + location.search);
      match.fn.call(match);
    });

    pellet.startInit(window.__pellet__config);

    // add a listener to the history statechange and route requests
    window.History.Adapter.bind(window, "statechange", function() {
      var match
        , state = History.getState();

      if(state && state.route) {
        match = state.routeMatch;
      } else {
        match = pellet.routes.parse(location.pathname + location.search);
      }

      if(match) {
        match.fn.call(match);
      } else {
        console.error('Can not find route for:', location.pathname + location.search);
      }
    });
  }

  document.addEventListener("click",function(e) {
    var node = e.target;
    while(node) {
      if (node.nodeName == 'A') {
        console.log('my href', node.href, node.dataset.externalLink, node.target, node);
        if (node.dataset.externalLink == 'true') {
          return;
        }

        if(node.target && node.target != '_self') {
          return;
        }

        var match = pellet.routes.parse(node.href);
        if(!match) {
          return;
        }

        e.stopPropagation();
        e.preventDefault();

        window.History.pushState({routeMatch:match}, null, node.href);
      }

      node = node.parentNode;
    }
  });
}
