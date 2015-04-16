var observables = require('./observables')
  , TransformFn = {};

// Helper function
function wrap(command) {
  return function() {
    var configDetails;
    var args = Array.prototype.slice.call(arguments, 0);
    args[0] = this._namespace + args[0];

    if(this.statsd && process.env.SERVER_ENV) {
      this.statsd[command].apply(this.statsd, args);
    } else {
      this.emit('statsd', {c:command, a:JSON.stringify(args)});
    }
  }
}

function instrumentation(statsdConfig, config) {
  this._namespace = '';
  this.statsd = null;
  this.isolatedConfig = null;

  this.bus = new observables.autoRelease(null, this);

  if(config && config.debug) {
    this.debugFilter = new RegExp(config.debug);
  }

  if(process.env.SERVER_ENV) {
    this.statsd = new (require('node-statsd'))(statsdConfig);
  }
}

instrumentation.prototype.namespace = function(namespace) {
  var obj = Object.create(this);
  obj._namespace = this._namespace + namespace.replace(/\.$/,'') + '.';
  return obj;
}

instrumentation.prototype.elapseTimer = function(startAt, namespace) {
  var start, _this;

  if(namespace) {
    _this = this.namespace(namespace);
  } else {
    _this = this;
  }

  if(startAt) {
    start = startAt;
  } else {
    if(process.env.SERVER_ENV) {
      start = process.hrtime();
    } else if(process.env.BROWSER_ENV) {
      if(window.performance) {
        start = window.performance.now();
      } else {
        start = new Date();
      }
    }
  }

  return {
    mark: function(name) {
      if(process.env.SERVER_ENV) {
        var end = process.hrtime();
        _this.timing(name, (((end[0]-start[0])*1e9) + (end[1]-start[1]))/1e6);
      } else if(process.env.BROWSER_ENV) {
        if(window.performance) {
          _this.timing(name, window.performance.now()-start);
        } else {
          _this.timing(name, new Date()-start);
        }
      }
    }
  };
}

instrumentation.prototype.log = instrumentation.prototype.info = function(data) {
  if(arguments.length !== 1) {throw Error('instrumentation log can only have one argument');}
  this.emit('info', data);
}

instrumentation.prototype.error = function(data) {
  if(arguments.length !== 1) {throw Error('instrumentation log can only have one argument');}
  this.emit('error', data);
}

instrumentation.prototype.warn = function(data) {
  if(arguments.length !== 1) {throw Error('instrumentation log can only have one argument');}
  this.emit('warn', data);
}

instrumentation.prototype.event = function(data) {
  this.emit('event', data);
}

instrumentation.prototype.timing = wrap('timing');
instrumentation.prototype.increment = wrap('increment');
instrumentation.prototype.decrement = wrap('decrement');
instrumentation.prototype.histogram = wrap('histogram');
instrumentation.prototype.gauge = wrap('gauge');
instrumentation.prototype.set = wrap('set');

/**
 * Broadcast instrumentation details to all listeners
 *
 * @param type
 * @param data
 * @param isolatedConfig
 */
instrumentation.prototype.emit = function(type, details, namespace, sessionId) {
  this.bus.emit({
    type: type || 'NA',
    sessionId: sessionId,
    namespace: namespace || this._namespace || 'NA',
    details: details || {}
  }, this, this.isolatedConfig);

  if(this.debugFilter && this.debugFilter.test(type)) {
    console.debug('instrument:', type, JSON.stringify(details), this.isolatedConfig?'with isolatedConfig':'');
  }
}

instrumentation.prototype.addIsolatedConfig = function(isolatedConfig) {
  var wrapper = Object.create(this);
  wrapper.isolatedConfig = isolatedConfig;
  return wrapper;
}

instrumentation.prototype.registerTransformFn = function(name, fn) {
  TransformFn[name] = fn;
}

instrumentation.prototype.getTransformFn = function(name) {
  return TransformFn[name];
}

module.exports = instrumentation;
