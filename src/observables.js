kefir = require('kefir')

function autoRelease(obs) {
  this.children = [];
  this.refEnd = [];
  this.refValue = [];
  this.refBoth = [];
  this.refLog = [];

  if(obs instanceof autoRelease) {
    this.__obs = obs.__obs;
  } else {
    this.__obs = obs;
  }
}

kefir.AUTO_RELEASE_EMITED = 1;
kefir.AUTO_RELEASE_ENDED = 2;
kefir.AUTO_RELEASE_BOTH = 3;

autoRelease.prototype.map = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.map(a,b))); return ret;},
autoRelease.prototype.mapTo = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.mapTo(a,b))); return ret;},
autoRelease.prototype.pluck = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.pluck(a,b))); return ret;},
autoRelease.prototype.invoke = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.invoke(a,b))); return ret;},
autoRelease.prototype.not = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.not(a,b))); return ret;},
autoRelease.prototype.timestamp = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.timestamp(a,b))); return ret;},
autoRelease.prototype.tap = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.tap(a,b))); return ret;},
autoRelease.prototype.filter = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.filter(a,b))); return ret;},
autoRelease.prototype.take = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.take(a,b))); return ret;},
autoRelease.prototype.takeWhile = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.takeWhile(a,b))); return ret;},
autoRelease.prototype.skip = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.skip(a,b))); return ret;},
autoRelease.prototype.skipWhile = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.skipWhile(a,b))); return ret;},
autoRelease.prototype.skipDuplicates = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.skipDuplicates(a,b))); return ret;},
autoRelease.prototype.diff = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.diff(a,b))); return ret;},
autoRelease.prototype.scan = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.scan(a,b))); return ret;},
autoRelease.prototype.reduce = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.reduce(a,b))); return ret;},
autoRelease.prototype.slidingWindow = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.slidingWindow(a,b))); return ret;},
autoRelease.prototype.delay = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.delay(a,b))); return ret;},
autoRelease.prototype.throttle = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.throttle(a,b))); return ret;},
autoRelease.prototype.debounce = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.debounce(a,b))); return ret;},
autoRelease.prototype.flatten = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatten(a,b))); return ret;},
autoRelease.prototype.transduce = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.transduce(a,b))); return ret;},
autoRelease.prototype.withHandler = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.withHandler(a,b))); return ret;},
autoRelease.prototype.toProperty = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.toProperty(a,b))); return ret;},
autoRelease.prototype.changes = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.changes(a,b))); return ret;},
autoRelease.prototype.flatMap = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMap(a,b))); return ret;},
autoRelease.prototype.flatMapLatest = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapLatest(a,b))); return ret;},
autoRelease.prototype.flatMapFirst = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapFirst(a,b))); return ret;},
autoRelease.prototype.flatMapConcat = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapConcat(a,b))); return ret;},
autoRelease.prototype.flatMapConcurLimit = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.flatMapConcurLimit(a,b))); return ret;},
autoRelease.prototype.awaiting = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.awaiting(a,b))); return ret;},
autoRelease.prototype.filterBy = function(a,b) {var ret; this.children.push(ret = new autoRelease(this.__obs.filterBy(a,b))); return ret;}

autoRelease.prototype.emit = function(a) {
  this.__obs.emit(a);
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
