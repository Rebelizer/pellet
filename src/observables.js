kefir = require('kefir')

/**
 *
 * @param obs
 * @param _owner is the default sender for all messages
 */
function autoRelease(obs, owner) {
  this.children = [];
  this.refEnd = [];
  this.refValue = [];
  this.refBoth = [];
  this.refLog = [];

  this.owner = owner;

  if(obs instanceof autoRelease) {
    this.__obs = obs.__obs;
  } else if(obs) {
    this.__obs = obs;
  } else {
    this.__obs = kefir.emitter();
  }
}

autoRelease.prototype.AUTO_RELEASE_EMITED = kefir.AUTO_RELEASE_EMITED = 1;
autoRelease.prototype.AUTO_RELEASE_ENDED = kefir.AUTO_RELEASE_ENDED = 2;
autoRelease.prototype.AUTO_RELEASE_BOTH = kefir.AUTO_RELEASE_BOTH = 3;

autoRelease.prototype.map = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.map(a), this.owner)); return ret;};
autoRelease.prototype.mapTo = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.mapTo(a), this.owner)); return ret;};
autoRelease.prototype.pluck = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.pluck(a), this.owner)); return ret;};
autoRelease.prototype.invoke = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.invoke(a), this.owner)); return ret;};
autoRelease.prototype.not = function() {var ret; this.children.push(ret = new autoRelease(this.__obs.not(), this.owner)); return ret;};
autoRelease.prototype.timestamp = function() {var ret; this.children.push(ret = new autoRelease(this.__obs.timestamp(), this.owner)); return ret;};
autoRelease.prototype.tap = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.tap(a), this.owner)); return ret;};
autoRelease.prototype.filter = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.filter(a), this.owner)); return ret;};
autoRelease.prototype.take = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.take(a), this.owner)); return ret;};
autoRelease.prototype.takeWhile = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.takeWhile(a), this.owner)); return ret;};
autoRelease.prototype.skip = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.skip(a), this.owner)); return ret;};
autoRelease.prototype.skipWhile = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.skipWhile(a), this.owner)); return ret;};
autoRelease.prototype.skipDuplicates = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.skipDuplicates(a), this.owner)); return ret;};
autoRelease.prototype.diff = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.diff(a,b), this.owner)); return ret;};
autoRelease.prototype.scan = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.scan(a,b), this.owner)); return ret;};
autoRelease.prototype.reduce = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.reduce(a,b), this.owner)); return ret;};
autoRelease.prototype.slidingWindow = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.slidingWindow(a,b), this.owner)); return ret;};
autoRelease.prototype.delay = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.delay(a), this.owner)); return ret;};
autoRelease.prototype.throttle = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.throttle(a,b), this.owner)); return ret;};
autoRelease.prototype.debounce = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.debounce(a,b), this.owner)); return ret;};
autoRelease.prototype.flatten = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatten(a), this.owner)); return ret;};
autoRelease.prototype.transduce = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.transduce(a), this.owner)); return ret;};
autoRelease.prototype.withHandler = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.withHandler(a), this.owner)); return ret;};
autoRelease.prototype.toProperty = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.toProperty(a), this.owner)); return ret;};
autoRelease.prototype.changes = function() {var ret; this.children.push(ret = new autoRelease(this.__obs.changes(), this.owner)); return ret;};
autoRelease.prototype.flatMap = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMap(a), this.owner)); return ret;};
autoRelease.prototype.flatMapLatest = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapLatest(a), this.owner)); return ret;};
autoRelease.prototype.flatMapFirst = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapFirst(a), this.owner)); return ret;};
autoRelease.prototype.flatMapConcat = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapConcat(a), this.owner)); return ret;};
autoRelease.prototype.flatMapConcurLimit = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapConcurLimit(a,b), this.owner)); return ret;};
autoRelease.prototype.awaiting = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.awaiting(a), this.owner)); return ret;};
autoRelease.prototype.filterBy = function(a) {var ret; this.children.push(ret = new autoRelease(this.__obs.filterBy(a), this.owner)); return ret;};

// need to add combine, and, or

autoRelease.prototype.emit = function(a, sender) {
  var _sender = sender || this.owner;
  if(_sender) {
    this.__obs.emit({sender:_sender, event:a});
  } else {
    this.__obs.emit(a);
  }

  return this;
}

autoRelease.prototype.end = function() {
  this.__obs.end();
  return this;
}

autoRelease.prototype.on = function(fn, type) {
  if(type === kefir.AUTO_RELEASE_ENDED) {
    this.refEnd.push(fn);
    this.__obs.onEnd(fn);
  } else if(type === kefir.AUTO_RELEASE_BOTH) {
    this.refBoth.push(fn);
    this.__obs.onAny(fn);
  } else {
    this.refValue.push(fn);
    this.__obs.onValue(fn);
  }

  return this;
}

autoRelease.prototype.log = function(name) {
  this.refLog.push(name);
  this.__obs.log(name);
  return this;
}

autoRelease.prototype.release = function() {
  var i;
  for(i in this.children) {
    this.children[i].release();
  }

  for(i in this.refValue) {
    this.__obs.offValue(this.refValue[i]);
  }

  for(i in this.refBoth) {
    this.__obs.offAny(this.refBoth[i]);
  }

  for(i in this.refEnd) {
    this.__obs.offEnd(this.refEnd[i]);
  }

  for(i in this.refLog) {
    this.__obs.offLog(this.refLog[i]);
  }

  this.children = [];
  this.refValue = [];
  this.refBoth = [];
  this.refEnd = [];
  this.refLog = [];
}

kefir.autoRelease = autoRelease;

module.exports = kefir;
