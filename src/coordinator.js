var observables = require('./observables.js');

function coordinator(path, type, id) {
  this._emitters = {};
  this._releaseList = {};

  this._id = {
    id: (id || this),
    path: (path || '/')
  };

  if(type) {
    this._id.type = type;
  }
}

coordinator.prototype.createChildCoordinator = function() {
  var proxy = Object.create(this);
  proxy._releaseList = {};
  this._releaseList['_$' + Object.keys(this._releaseList).length] = proxy;

  // todo: update this this._id with more info (need to copy this._id because parent need its own copy

  return proxy;
}

coordinator.prototype.event = function(name) {
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

  autoRelease = new observables.autoRelease(emitter, this._id);
  this._releaseList[name] = autoRelease;

  return autoRelease;
}

coordinator.prototype.coordinator = function(name, type) {
  var instance = this._releaseList[name];
  if(instance) {
    if(instance instanceof coordinator) {
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
  this._releaseList[name] = instance = instance.createChildCoordinator();

  return instance;
}

/**
 * release only the observables but the emit will remain
 */
coordinator.prototype.release = function() {
  for(var i in this._releaseList) {
    this._releaseList[i].release();
  }

  this._releaseList = {};
}

module.exports = coordinator;
