var observables = require('./observables.js');

/**
 *
 * @param name
 */
function coordinator() {
  this.actions = observables.emitter();
  this.serialize = observables.emitter();
}

/**
 * creates a new context over coordinator
 *
 * @param context
 */
coordinator.prototype.createContext = function(context) {
  var proxy = Object.create(this);
  proxy._context = context;
  proxy._autoReleaseObservables = [];
  return proxy;
}

coordinator.prototype.getEvent = function(name, isContextFiltered) {
  if(!name || !this[name]) {
    throw new Error('invalid event')
  }

  if(!(this[name] instanceof this.actions.constructor)) {
    throw new Error('event must be an observable');
  }

  var autoRelease = new observables.autoRelease(this[name]);
  if(this._autoReleaseObservables) {
    this._autoReleaseObservables.push(autoRelease);
  }

  if(isContextFiltered) {
    var _this = this;
    autoRelease = autoRelease.on(function(details) {
      return (details.ctx !== _this);
    });
  }

  return autoRelease;
}

coordinator.prototype.release = function() {
  if(this._autoReleaseObservables) {
    for(var i in this._autoReleaseObservables) {
      this._autoReleaseObservables[i].release();
    }

    this._autoReleaseObservables = [];
  }
}

coordinator.prototype.load = function() {}

module.exports = coordinator;
