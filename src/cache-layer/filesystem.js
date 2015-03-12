var redis = require('redis')
  , utils = require('../utils');

function filesystemCacheLayer(config, instrument, cb) {
  if(instrument) {
    this.instrument = instrument.namespace('cache-layer.redis');
  }

  this.client = redis.createClient(config.port, config.host, config.options);
  if(config.password) {
    this.client.auth(config.password, function(err) {
      if(err) {
        console.error('Error in signing in the redis cache layer because:', err.message||err);
      }
    });
  }
}

filesystemCacheLayer.prototype.get = function(key, cb) {
  var _this = this;

  if(this.instrument) {
    var start = process.hrtime();
  }

  this.client.get(utils.djb2(key).toString(32), function(err, value) {
    if(err) {
      cb(err);
      return;
    }

    if(!value) {
      if(_this.instrument) {
        _this.instrument.increment('miss');
      }

      cb(null, null, null);
    } else {
      value = JSON.parse(value);

      if(_this.instrument) {
        var end = process.hrtime();
        _this.instrument.timing('get', (((end[0]-start[0])*1e9) + (end[1]-start[1]))/1e6);
        _this.instrument.increment('hit');
      }

      cb(null, value.data, value.meta);
    }
  });
}

filesystemCacheLayer.prototype.touch = function(key, data, cb) {
  this.set(key, data, cb);
}

filesystemCacheLayer.prototype.set = function(key, data, cb) {
  if(this.instrument) {
    this.instrument.increment('update');
  }

  data = JSON.stringify({
    data: data,
    meta: {
      lastModified: Date.now()
    }
  });

  this.client.set(utils.djb2(key).toString(32), data, cb);
}

module.exports = filesystemCacheLayer;
