var react = require('react')
  , kefir = require('kefir')
  , isomorphicRender = require('./isomorphic-render')
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

  return react.createClass(spec);;
}

pellet.prototype.loadTranslation = function(locale, fn) {
  this.locales[locale] = fn;
}

pellet.prototype.loadManifestComponents = function(manifest) {
  var last, id, key, keys

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
}

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
}

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
 * @param route
 * @param component
 * @param options
 */
pellet.prototype.addComponentRoute = function(route, component, options) {
  var self = this;

  this.routes.add(route, function() {
    routeContext = this;

    // todo: not sure this is safe... if options is updated will all future request get modified?
    if(!options) {
      options = {};
    }

    if(process.env.SERVER_ENV) {
      // just for bots do not return react-id version
      if (!options.mode && routeContext.request) {
        if (/googlebot|gurujibot|twitterbot|yandexbot|slurp|msnbot|bingbot|rogerbot|facebookexternalhit/i.test(routeContext.request.headers['user-agent'] || '')) {
          options.mode = isomorphicRender.MODE_STRING;
        }
      }
    } else {
      if(window.__pellet__ctx) {
        options.context = window.__pellet__ctx;
      }
    }

    if(!options.props) {
      options.props = {};
    }

    // merge in the routes argument into the props
    options.props.originalUrl = routeContext.originalUrl;
    options.props.params = routeContext.params;
    options.props.query = routeContext.query;
    options.props.url = routeContext.url;

    // now render the isomorphic component
    isomorphicRender.renderComponent(component, function(err, html, ctx) {

      if(process.env.SERVER_ENV) {
        var markup;

        // todo: this about letting someone pass in a ejs template and we use that to render (so we can have jade etc to build the wrapper)
        if(!routeContext) {
          console.error('DIE because we have to have the routeContext')
          throw new Error('xxxxx');
        }

        if(self.skeletonPageRender) {
          routeContext.respose.end(self.skeletonPageRender(html, ctx));
        } else {
          routeContext.respose.end(html);
        }
      }
    });
  }, options);
};

// SERVER ENVIRONMENT
// export a middleware wrapper to help with routes.
if(process.env.SERVER_ENV) {
  pellet.prototype.middleware = function (req, res, next) {

    var match = __pellet__ref.routes.parse(req.path);
    if (!match) {
      return next();
    }

    match.request = req;
    match.respose = res;
    match.next = next;

    match.fn.call(match);

    /*
     var stream = globlePellet.getEmitter('route:change');
     stream.emit({
     path: req.path,
     query: req.query,
     req: req,
     res: res,
     next: next
     });
     */
  };

  module.exports = global.__pellet__ref = new pellet();
}

// BROWSER ENVIRONMENT
// bootstrap the browser envirment but triggering the route
// the page was loaded and replay the events on the server
// render.
else if(process.env.BROWSER_ENV) {
  module.exports = window.__pellet__ref = new pellet();

  window.onload = function() {
    window.__pellet__ref.onReady(function() {
      var match = window.__pellet__ref.routes.parse(location.pathname + location.search);
      match.fn.call(match);
    });

    window.__pellet__ref.startInit(window.__pellet__config);
  }
}