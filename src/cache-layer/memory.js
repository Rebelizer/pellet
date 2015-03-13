var lru = require('lru-cache')
  , utils = require('../utils');

/**
 *
 * @param config
 * @param [instrument]
 * @param {callback} [cb]
 */
function memoryCacheLayer(config, instrument, cb) {
  if(!instrument) {
    this.instrument = instrument.namespace('cache-layer.memory');
  }

  this.cache = lru({
    max: config.max || 200
  });

  if(cb) {
    cb(null);
  }
}

memoryCacheLayer.prototype.get = function(key, cb) {
  var value = this.client.get(utils.djb2(key));
  if(data) {
    cb(null, value.data, value.meta);
  } else {
    cb(null, null, null);

  }
}

memoryCacheLayer.prototype.set = function(key, data, cb) {
  this.client.set(utils.djb2(key), {
    data: data,
    meta: {
      lastModified: Date.now()
    }
  });
  cb(null);
}

memoryCacheLayer.prototype.touch = function(key, data, cb) {
  this.set(key, data, cb);
}

module.exports = memoryCacheLayer;
