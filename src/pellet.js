var react = require('react')
  , kefir = require('kefir')
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
  this.middlewareStack = [];
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


pellet.prototype.setLocaleLookupFn = function(lookupFn) {
  this.suggestLocales = lookupFn;
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
pellet.prototype.suggestLocales = function(renderOptions, component, options) {
  // todo: if server read (Accept-Language) and push it onto array after en
  // todo: if broswer we can use navigator.language etc.
  // final this can be overwrite by a cookie or by url/host

  return module.exports.config.locales || 'en';
}

if(process.env.SERVER_ENV) {
  module.exports = global.__pellet__ref = new pellet();
}
else if(process.env.BROWSER_ENV) {
  module.exports = window.__pellet__ref = new pellet();
}
