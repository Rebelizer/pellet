var pellet = require('../pellet');

if(process.env.BROWSER_ENV) {
  pellet.registerInitFn(function (next) {

    var _url, _filter;

    if(pellet.config && pellet.config.instrumentation) {
      _url = pellet.config.instrumentation.url;
      _filter = pellet.config.instrumentation.filter;

      if(_filter) {
        _filter = new RegExp(_filter);
      }
    }

    pellet.instrumentation.bus.on(function (data) {
      var sessionId = data.sessionId
        , namespace = data.namespace
        , payload = data.details
        , type = data.type;

      // do not send filtered types to server
      if(_filter && !_filter.test(type)) {
        return;
      }

      if(_url) {
        var url = _url
          , query = []
          , data;

        if(typeof(payload) === 'string') {
          data = {
            text: payload
          }
        } else {
          data = Object.create(payload);
        }

        // try to get a sessionId via our own cookie or use ga cookie
        if(!sessionId) {
          sessionId = __pellet__ref.cookie.get(__pellet__ref.config.instrumentation.cookie || '_uid');
          if (!sessionId) {
            sessionId = __pellet__ref.cookie.get('_ga');
            if (sessionId) {
              sessionId = sessionId.split('.').slice(2).join('.');
            }
          }
        }

        data._s = sessionId;
        data._n = namespace;
        data._t = type;

        for(i in data) {
          if(data[i]) {
            query.push(i + '=' + encodeURIComponent(data[i]));
          }
        }

        if(query.length) {
          url += '?' + query.join('&');
        }

        var trackPixel = new Image();
        trackPixel.src = url;
      } else {
        console.debug('instrument:', sessionId, type, namespace, JSON.stringify(payload));
      }
    });

    next();
  });
}
