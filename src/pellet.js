var react = require('react')
  , kefir = require('kefir')
  , isomorphicRender = require('./isomorphic-render')
  , isomorphicMiddlewareProvider = require('./isomorphic-middleware-provider')
  , routeTable = require('./route-table')
  , pelletMixin = require('./pellet-mixin.js');

/**
 * @class pellet
 *
 */
function pellet() {
  this.readyFnQue = [];
  this.initFnQue = [];
  this.emitters = {};
  this.components = {};
  this.locales = {};

  this.skeletonPageRender = false;

  this.routes = new routeTable();
}

/**
 *
 * @type {exports}
 */
pellet.prototype.createClass = function(spec) {
  if(!spec.mixins) {
    spec.mixins = [];
  }

  if(!(pelletMixin in spec.mixins)) {
    spec.mixins.push(pelletMixin);
  }

  if(spec.setupInitialRender) {
    if(!spec.statics) {
      spec.statics = {};
    }

    spec.statics.setupInitialRender = spec.setupInitialRender;
    delete spec.setupInitialRender;
  }

  if(typeof spec.routes !== 'undefined') {
    var i, allRoutes;

    if(typeof spec.routes === 'string') {
      allRoutes = [spec.routes];
    } else if(spec.routes instanceof Array) {
      allRoutes = spec.routes;
    }

    delete spec.routes;
  }

  var reactClass = react.createClass(spec);
  if(allRoutes) {
    for(i in allRoutes) {
      this.addComponentRoute(allRoutes[i], reactClass);
    }
  }

  return reactClass;
};

pellet.prototype.setSkeletonPage = function(templatingFn) {
  this.skeletonPageRender = templatingFn;
};

pellet.prototype.setLocalSuggestionLookup = function(lookupFn) {
  this.suggestLocals = lookupFn;
};

pellet.prototype.loadTranslation = function(locale, fn) {
  this.locales[locale] = fn;
};

pellet.prototype.loadManifestComponents = function(manifest) {
  var last, id, key, keys;

  if(!manifest || typeof(manifest) !== 'object') {
    return;
  }

  keys = Object.keys(manifest);

  keys.sort().reverse();
  for(var i in keys) {
    key = keys[i];
    id = key.substring(0, key.indexOf('@'));
    if(id) {
      if(last !== id) {
        if(this.components[id]) {
          console.warn('duplicate manifest component loaded:', id)
        }

        this.components[id] = manifest[key];
        last = id;
      }

      this.components[key] = manifest[key];
    }
  }
};

/**
 *
 * @param key
 * @param namespace
 * @returns {*}
 */
pellet.prototype.getEmitter = function(key, namespace) {
  if(this.emitters[key]) {
    return this.emitters[key];
  }

  var stream = this.emitters[key] = kefir.emitter();
  stream.onEnd(function() {
    delete this.emitters[key];
  });

  return stream;
};

/**
 * register a function to be called once pellet is ready
 * @param fn
 */
pellet.prototype.onReady = function(fn) {
  // if all ready running fire immediately with the last know err (or null if no errors)
  if(typeof(this.readyError) != 'undefined') {
    setTimeout(function() {
      fn(module.exports.readyError);
    }, 1);

    return;
  }

  this.readyFnQue.push(fn);
};

/**
 * register a function needed to complete before pellet is ready
 * @param fn
 */
pellet.prototype.registerInitFn = function(fn) {
  this.initFnQue.push(fn);
};

/**
 * Called after everyone has register their load functions
 */
pellet.prototype.startInit = function(config) {
  if(typeof(this.readyError) != 'undefined') {
    throw new Error('Cannot reinit because pellet is all ready running.');
  }

  this.config = config;

  var cbCount = this.initFnQue.length;
  function done(err) {
    if(err) {
      // console log the error and safe the most recent error
      console.error('Error init pellet because:', err.message);
      module.exports.readyError = err;
    }

    if(--cbCount <= 0) {
      // if all callback had no error set to null
      if(!module.exports.readyError) {
        module.exports.readyError = null;
      }

      var fn;
      while(fn = module.exports.readyFnQue.pop()) {
        fn(module.exports.readyError);
      }
    }
  }

  if(cbCount === 0) {
    done(null);
    return;
  }

  // now call all init fn and wait until all done
  for(i in this.initFnQue) {
    this.initFnQue[i](done);
  }
};

/**
 *
 * @param renderOptions
 * @param component
 * @param options
 * @returns {locals|*|js.locals|module.locals|app.locals|string}
 */
pellet.prototype.suggestLocals = function(renderOptions, component, options) {
  // todo: if server read (Accept-Language) and push it onto array after en
  // todo: if broswer we can use navigator.language etc.
  // final this can be overwrite by a cookie or by url/host

  return module.exports.config.locals || 'en';
}

/**
 *
 * @param route
 * @param component
 * @param options
 */
pellet.prototype.addComponentRoute = function(route, component, options) {
  var self = this;

  this.routes.add(route, function() {
    var routeContext = this
      , renderOptions = {props:{}};

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
        // todo: I should make a copy of this!
        renderOptions.context = window.__pellet__ctx;
      }
    }

    // merge in the routes argument into the props
    renderOptions.props.originalUrl = routeContext.originalUrl;
    renderOptions.props.params = routeContext.params;
    renderOptions.props.query = routeContext.query;
    renderOptions.props.url = routeContext.url;

    // use pellets default local loookup function. This can replaced if you want
    renderOptions.locals = self.suggestLocals(renderOptions, component, options);

    // now render the isomorphic component
    isomorphicRender.renderComponent(component, renderOptions, function(err, html, ctx) {
      if(process.env.SERVER_ENV) {
        var markup;

        if(!routeContext) {
          console.error('DIE because we have to have the routeContext');
          throw new Error('NULL routeContext!');
        }

        if(self.skeletonPageRender) {
          routeContext.respose.end(self.skeletonPageRender(html, ctx));
        } else {
          routeContext.respose.end(html);
        }
      } else {
        if(renderOptions.provider.title) {
          window.document.title = renderOptions.provider.title;
        }
      }
    });
  }, options);
};

if(process.env.SERVER_ENV) {
  // SERVER ENVIRONMENT
  // export a middleware wrapper to help with routes.

  pellet.prototype.middleware = function (req, res, next) {

    var match = __pellet__ref.routes.parse(req.path);
    if (!match) {
      return next();
    }

    match.request = req;
    match.respose = res;
    match.next = next;

    match.fn.call(match);
  };

  module.exports = global.__pellet__ref = new pellet();
}
else if(process.env.BROWSER_ENV) {
  // BROWSER ENVIRONMENT
  // bootstrap the browser environment but triggering the route
  // the page was loaded and replay the events on the server
  // render.

  module.exports = window.__pellet__ref = new pellet();

  window.onload = function() {
    window.__pellet__ref.onReady(function() {
      var match = window.__pellet__ref.routes.parse(location.pathname + location.search);
      match.fn.call(match);
    });

    window.__pellet__ref.startInit(window.__pellet__config);
  }
}