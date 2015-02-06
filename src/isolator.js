var observables = require('./observables')
  , utils = require('./utils');

var emitterConstructor = new observables.emitter()
  , emitterConstructor = emitterConstructor.constructor;

function isolator(path, type, id, isolatedConfig) {
  this._emitters = {};
  this._releaseList = {};
  this.isolatedConfig = isolatedConfig || {};

  this._id = {
    id: (id || this),
    path: (path || '/')
  };

  if(type) {
    this._id.type = type;
  }
}

isolator.prototype.updateIsolatedConfig = function(config) {
  utils.objectUnion([config], this.isolatedConfig); //todo: need to set options!
}

isolator.prototype.createChild = function(isolatedConfig) {
  var proxy = Object.create(this);
  proxy._releaseList = {};
  this._releaseList['_$' + Object.keys(this._releaseList).length] = proxy;

  if(isolatedConfig) {
    // ??? if we merge in the values
    proxy.isolatedConfig = isolatedConfig;
  }

  // todo: update this this._id with more info (need to copy this._id because parent need its own copy

  return proxy;
}

isolator.prototype.event = function(name, isolated) {
  var emitter, autoRelease;

  if(autoRelease = this._releaseList[name]) {
    if(autoRelease instanceof observables.autoRelease) {
      return autoRelease;
    }

    // throw because the key already exists and is not an emitter. this is most
    // likely because we have a coordinator with that name or name is _$..
    throw new Error('Conflict with existing key');
  }

  emitter = this._emitters[name];
  if(!emitter) {
    emitter = this._emitters[name] = observables.emitter();
  }

  autoRelease = new observables.autoRelease(emitter, this._id, this.isolatedConfig);
  this._releaseList[name] = autoRelease;

  if(isolated) {
    var _this = this;
    return autoRelease.filter(function(data) {
      if(!data.ctx || !_this.isolatedConfig) {
        return false;
      }

      return data.ctx === _this.isolatedConfig;
    });
  }

  return autoRelease;
}

isolator.prototype.makeProperty = function(event, name, current, isolate) {
  var emitter, autoRelease;

  if(autoRelease = this._releaseList[name]) {
    if(autoRelease instanceof observables.autoRelease) {
      return autoRelease;
    }

    // throw because the key already exists and is not an emitter. this is most
    // likely because we have a coordinator with that name or name is _$..
    throw new Error('Conflict with existing key');
  }

  if(!(event instanceof observables.autoRelease)) {
    if(!(event = this._emitters[event])) {
      throw new Error('Unknown base event to build property from');
    }
  }

  emitter = this._emitters[name];
  if(!emitter) {
    emitter = this._emitters[name] = event.toProperty({sender:this._id, event:current});
  }

  autoRelease = new observables.autoRelease(emitter, this._id);
  this._releaseList[name] = autoRelease;

  return autoRelease;
}

isolator.prototype.registerEmitter = function(name, emitter) {
  if(this._releaseList[name]) {
    // throw because the key already exists
    throw new Error('Conflict with existing key');
  }

  if(emitter instanceof observables.autoRelease) {
    this._emitters[name] = emitter.__obs;
    this._releaseList[name] = emitter;
  } else if(emitter instanceof emitterConstructor) {
    this._emitters[name] = emitter;
    this._releaseList[name] = emitter = new observables.autoRelease(emitter, this._id);
  } else {
    throw new Error('Cannot register a non emitter/autorelease');
  }

  return emitter;
}

isolator.prototype.coordinator = function(name, type) {
  var instance = this._releaseList[name];
  if(instance) {
    if(instance instanceof isolator) {
      return instance;
    }

    // throw because the key already exists and is not an coordinator. this is most
    // likely because we have a event with that name or name is _$..
    throw new Error('Conflict with existing key');
  }

  // NOTE: require('./pellet') is required to work around a webpack load order
  // pellet.js loads this file so we need to lazy get pellet to have full init
  // version.
  instance = require('./pellet').getCoordinator(name, type);
  this._releaseList[name] = instance = instance.createChild(this.isolatedConfig);

  return instance;
}

/**
 * release only the observables but the emit will remain
 */
isolator.prototype.release = function() {
  for(var i in this._releaseList) {
    this._releaseList[i].release();
  }

  this._releaseList = {};
}

module.exports = isolator;
