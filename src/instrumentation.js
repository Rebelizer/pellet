// Helper function
function wrap(command) {
  return function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args[0] = this._namespace + args[0];

    if(!this.statsd) {
      console.log('instrument:', command, args);
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
  obj._namespace = this._namespace + namespace;
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
        _this.timing(name, process.hrtime()-start);
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

instrumentation.prototype.timing = wrap('timing');
instrumentation.prototype.increment = wrap('increment');
instrumentation.prototype.decrement = wrap('decrement');
instrumentation.prototype.histogram = wrap('histogram');
instrumentation.prototype.gauge = wrap('gauge');
instrumentation.prototype.set = wrap('set');

module.exports = instrumentation;
