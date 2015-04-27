var url = require('url');

module.exports = function(appConfig, instrument) {

  // now setup the tracking pixel server
  var pixelUrl = url.parse(appConfig.instrumentation.url, false, true).path;
  var trackPixel = new Buffer([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 255, 255, 255, 0, 0, 0, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]);

  var filter = appConfig.instrumentation.filter;
  if(filter) {
    filter = new RegExp(filter);
  }

  function emit(_n, _t, _s, data) {
    // ignore all types that are filtered out
    if(filter && !filter.test(_t)) {
      return;
    }

    if(_t === 'statsd') {
      instrument[data.c].apply(instrument, JSON.parse(data.a));
      return;
    }

    instrument.emit(_t, data, _n, _s);
  }

  return function (req, res, next) {
    var i, _s, _n, _t;
    var length, slot, key, batch = [];

    if (req.path !== pixelUrl || req.method !== 'GET') {
      return next();
    }

    if (!req.query) {
      req.query = url.parse(req.url, true).query;
    }

    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Length': 43,
      'Content-Type': 'image/gif',
      'Expires': 'Fri, 01 Jan 1990 00:00:00 GMT',
      'Last-Modified': 'Sun, 17 May 1998 03:00:00 GMT',
      'Pragma': 'no-cache'
    });

    res.end(trackPixel, 'binary');

    if (!(_s = req.query._s)) {
      return;
    }

    _s = req.query._s;
    _n = req.query._n;
    _t = req.query._t;

    delete req.query._s;
    delete req.query._n;
    delete req.query._t;
    delete req.query._cac;

    if(req.query._ba === 't') {
      delete req.query._ba;

      for(i in req.query) {
        slot = i.match(/^([^$]+)\$(\d+)$/);
        if(slot) {
          key = slot[1];
          slot = parseInt(slot[2], 10);

          if(!batch[slot]) {
            slot = batch[slot] = {};
          } else {
            slot = batch[slot];
          }
        } else {
          key = i;

          if(!batch[0]) {
            slot = batch[0] = {};
          } else {
            slot = batch[0];
          }
        }

        slot[key] = req.query[i];
      }

      length = batch.length;
      for(i = 0; i < length; i++) {
        slot = batch[i];
        key = {
          s: slot._s || _s,
          n: slot._n || _n,
          t: slot._t || _t
        };

        delete slot._s;
        delete slot._n;
        delete slot._t;

        emit(key.n, key.t, key.s, slot);
      }
    } else {
      emit(_n, _t, _s, req.query);
    }
  };
}
