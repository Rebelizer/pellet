var url = require('url');

module.exports = function(appConfig, instrument) {

  // now setup the tracking pixel server
  var pixelUrl = url.parse(appConfig.instrumentation.url, false, true).path;
  var trackPixel = new Buffer([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 255, 255, 255, 0, 0, 0, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]);

  var filter = appConfig.instrumentation.filter;
  if(filter) {
    filter = new RegExp(filter);
  }

  return function (req, res, next) {
    var _s, _n, _t;

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

    _n = req.query._n;
    _t = req.query._t;

    // ignore all types that are filtered out
    if(filter && !filter.test(_t)) {
      return;
    }

    delete req.query._s;
    delete req.query._n;
    delete req.query._t;

    if(_t === 'statsd') {
      instrument[req.query.c].apply(instrument, JSON.parse(req.query.a));
      return;
    }

    instrument.emit(_t, req.query, _n, _s);
  };
}
