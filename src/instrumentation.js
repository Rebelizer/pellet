// default transport function
var transportFn = function(sessionId, type, namespace, payload) {
  if(process.env.BROWSER_ENV && __pellet__ref.config &&
    __pellet__ref.config.instrumentation &&
    __pellet__ref.config.instrumentation.url) {

    var url = __pellet__ref.config.instrumentation.url
      , query = []
      , data;

    if(typeof(payload) === 'string') {
      data = {
        text: payload
      }
    } else {
      data = Object.create(payload);
    }

    // try to get a sessionId via our own cookie or use ga cookie
    if(!sessionId) {
      sessionId = __pellet__ref.cookie.get(__pellet__ref.config.instrumentation.cookie || '_uid');
      if (!sessionId) {
        sessionId = __pellet__ref.cookie.get('_ga');
        if (sessionId) {
          sessionId = sessionId.split('.').slice(2).join('.');
        }
      }
    }

    data._s = sessionId;
    data._n = namespace;
    data._t = type;

    for(i in data) {
      if(data[i]) {
        query.push(i + '=' + encodeURIComponent(data[i]));
      }
    }

    if(query.length) {
      url += '?' + query.join('&');
    }

    var trackPixel = new Image();
    trackPixel.src = url;
  } else {
    console.log('instrument:', sessionId, type, namespace, JSON.stringify(payload));
  }
};

// Helper function
function wrap(command) {
  return function() {
    var configDetails;
    var args = Array.prototype.slice.call(arguments, 0);
    args[0] = this._namespace + args[0];

    if(process.env.SERVER_ENV) {
      configDetails = global.__pellet__ref && global.__pellet__ref.config && global.__pellet__ref.config.instrumentation;
    } else if(process.env.BROWSER_ENV) {
      configDetails = window.__pellet__ref && window.__pellet__ref.config && window.__pellet__ref.config.instrumentation;
    }

    if(configDetails && configDetails.log) {
      console.log('instrument:', command, args);
    }

    if(!this.statsd) {
      if(process.env.BROWSER_ENV && configDetails && configDetails.stats) {
        this.console('statsd', {c:command, a:JSON.stringify(args)});
      }

      return;
    }

    this.statsd[command].apply(this.statsd, args);
  }
}

function instrumentation(config) {
  this._namespace = '';
  this.statsd = null;

  if(process.env.SERVER_ENV) {
    this.statsd = new (require('node-statsd'))(config);
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

/**
 * log data unstructured
 *
 * @param type
 * @param payload
 * @param sessionId
 * @param namespace
 */
instrumentation.prototype.console = function(type, payload, sessionId, namespace) {
  if(!transportFn) {
    return;
  }

  transportFn(sessionId, type || 'info', namespace || this._namespace || 'NA', payload || {});
}

instrumentation.prototype.log = instrumentation.prototype.info = function(data) {
  if(arguments.length !== 1) {throw Error('instrumentation log can only have one argument');}
  this.console('info', data);
}

instrumentation.prototype.error = function(data) {
  if(arguments.length !== 1) {throw Error('instrumentation log can only have one argument');}
  this.console('error', data);
}

instrumentation.prototype.warn = function(data) {
  if(arguments.length !== 1) {throw Error('instrumentation log can only have one argument');}
  this.console('warn', data);
}

instrumentation.prototype.timing = wrap('timing');
instrumentation.prototype.increment = wrap('increment');
instrumentation.prototype.decrement = wrap('decrement');
instrumentation.prototype.histogram = wrap('histogram');
instrumentation.prototype.gauge = wrap('gauge');
instrumentation.prototype.set = wrap('set');

/**
 * set the instrumentation transport used to send log data and
 * statsd data if not statsd server is configured.
 *
 * @param fn
 * @param flushFn
 */
instrumentation.prototype.setInstrumentationTransport = function(fn, flushFn) {
  transportFn = fn;

  if(flushFn) {
    if(process.env.SERVER_ENV) {
      process.on('exit', flushFn);
    } else if(process.env.BROWSER_ENV) {
      if (document.addEventListener) {
        document.addEventListener("unload", flushFn, true);
      } else if(window.attachEvent) {
        document.attachEvent("unload", flushFn);
      }
    }
  }
}

module.exports = instrumentation;
