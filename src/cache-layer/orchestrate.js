var orchestrate = require('orchestrate')
  , zlib = require('zlib')
  , utils = require('../utils');

function orchestrateCacheLayer(config, instrument, cb) {
  if(instrument) {
    this.instrument = instrument.namespace('cache-layer.orchestrate');
  }

  this.collection = config.collection || 'page-cache';

  orchestrate.ApiEndPoint = config.host;
  this.db = orchestrate(config.token);
}

orchestrateCacheLayer.prototype.get = function(key, cb) {
  var _this = this;

  if(this.instrument) {
    var start = process.hrtime();
  }

  this.db.get(this.collection, key).fail(function(err) {
    if(err.statusCode === 404) {
      if(_this.instrument) {
        _this.instrument.increment('miss');
      }

      cb(null, null, null);
    } else {
      if(_this.instrument) {
        _this.instrument.increment('error');
      }

      cb(new Error('Error fetching page cache ' + (err.body && err.body.code)), null, null);
      console.error('Error fetching page cache because:', err.statusCode, err.body.code, err.body.message);
    }
  }).then(function (result) {
    if(_this.instrument) {
      var end = process.hrtime();
      _this.instrument.timing('get', (((end[0]-start[0])*1e9) + (end[1]-start[1]))/1e6);
      _this.instrument.increment('hit');
    }

    cb(null, result.body.data, result.body.meta);
  });
}

orchestrateCacheLayer.prototype.set = function(key, data, cb) {
  var _this = this;

  if(this.instrument) {
    this.instrument.increment('update');
  }

  this.db.put(this.collection, key, {
    data: data,
    meta: {
      lastModified: Date.now()
    }
  }).fail(function(err){
    cb(new Error('Error updating page cache ' + (err.body && err.body.code)), null, null);
    console.error('Error updating page cache because:', err.statusCode, err.body.code, err.body.message);
    if(_this.instrument) {
      _this.instrument.increment('error');
    }
  }).then(function (result) {
    cb(null);
  });
}

module.exports = orchestrateCacheLayer;
