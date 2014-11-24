var react = require('react')
  , utils = require('./utils')
  , observables = require('./observables')
  , coordinator = require('./coordinator')
  , instrumentation = require('./instrumentation')
  , pelletReactMixin = require('./pellet-react-mixin');

/**
 * @class pellet
 *
 */
function pellet(config) {
  this.readyFnQue = [];
  this.initFnQue = [];
  this.coordinators = {};
  this.coordinatorSpecs = {};
  this.components = {};
  this.locales = {};

  this.middlewareStack = [];

  if(config) {
    // now update the config
    config = Object.create(config);

    if (config.instrumentation) {
      this.instrumentation = config.instrumentation;
      config.instrumentation = void(0);
    } else {
      this.instrumentation = new instrumentation();
    }

    if (config.logger) {
      this.logger = config.logger;
      config.logger = void(0);
    } else {
      this.logger = null; // TODO: make a mock logger
    }

    this.config = config;
  } else {
    this.config = {};
  }
}

/**
 *
 * @type {observables}
 */
pellet.prototype.observables = observables;

/**
 *
 * @type {exports}
 */
pellet.prototype.createClass = function(spec) {
  if(!spec.mixins) {
    spec.mixins = [];
  }

  if(!(pelletReactMixin in spec.mixins)) {
    spec.mixins.push(pelletReactMixin);
  }

  if(spec.componentConstruction) {
    var _componentConstruction = spec.componentConstruction;
    delete spec.componentConstruction;
  }

  if(spec.layoutTemplate) {
    var _layout = spec.layoutTemplate;
    delete spec.layoutTemplate;
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

  // make sure we have static version of __$construction
  // and __$layout
  if(_componentConstruction) {
    reactClass.__$construction = _componentConstruction;
  }

  if(_layout) {
    reactClass.__$layout = _layout;
  }

  if(allRoutes) {
    for(i in allRoutes) {
      this.addComponentRoute(allRoutes[i], reactClass, {});
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
 * NOTE: be careful with the options because once initialized
 * we never create the coordinator so for each unique name the options
 * need to match!
 *
 * @param key
 * @param isGlobal
 * @param options
 * @returns {*}
 */
pellet.prototype.getCoordinator = function(name, type) {
  if(!name) {
    throw new Error('name is required');
  }

  if(instance = this.coordinators[name]) {
    return instance;
  }

  if(typeof type !== 'string') {
    type = name;
    if(typeof type === 'object') {
      options = type;
    }
  }

  // now create a global coordinator
  var instance = this.createCoordinator(type);
  this.coordinators[name] = instance;

  return instance;
};

/**
 *
 * @param key
 * @param isGlobal
 * @param options
 * @returns {*}
 */
pellet.prototype.createCoordinator = function(type) {
  if(!type) {
    throw new Error('type is required');
  }

  if(!this.coordinatorSpecs[type]) {
    throw new Error('Cannot find ' + type + ' coordinator spec');
  }

  var instance = new coordinator();
  utils.mixInto(instance, this.coordinatorSpecs[type], false, ['initialize', 'load', 'release']);
  instance.initialize();

  return instance;
};

/**
 * register the coordinator spec that creates the new coordinator
 * of type name.
 *
 * @param name
 * @param fn
 */
pellet.prototype.registerCoordinatorSpec = function(name, spec) {
  if(!spec || !name) {
    throw new Error('Spec and name are required for all coordinators.');
  }

  if(this.coordinatorSpecs[name]) {
    console.error('Error duplicate store specs:', name);
    throw new Error('Cannot have duplicate store specs');
  }

  this.coordinatorSpecs[name] = spec;
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
pellet.prototype.startInit = function() {
  if(typeof(this.readyError) != 'undefined') {
    throw new Error('Cannot reinit because pellet is all ready running.');
  }

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
  module.exports = global.__pellet__ref = new pellet(global.__pellet__config);
}
else if(process.env.BROWSER_ENV) {
  module.exports = window.__pellet__ref = new pellet(JSON.parse(window.__pellet__config));

  module.exports.addWindowOnloadEvent = function(fn) {
    var _onload = window.onload;
    if (typeof window.onload != 'function') {
      window.onload = fn;
    } else {
      window.onload = function() {
        if (_onload) {_onload();}
        fn();
      }
    }
  }

  module.exports.addWindowOnloadEvent(function() {
    window.__pellet__ref.startInit();
  });

} else {
  module.exports = new pellet(global.__pellet__ref);
}
