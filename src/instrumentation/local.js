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

    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    pellet.getSessionId = function(forceRegenerate) {
      var sessionKey = pellet.config.instrumentation.cookie || '_uid';

      sessionId = pellet.cookie.get(sessionKey);
      if (!sessionId || forceRegenerate) {
        sessionId = localStorage.getItem(sessionKey);
        if(!sessionId || forceRegenerate) {
          sessionId = 'pID:' + s4() + s4() + s4() + '-' + s4();
        }

        pellet.setSessionId(sessionId, true)
      }

      return sessionId;
    }

    pellet.setSessionId = function(sessionId, force) {
      var sessionKey = pellet.config.instrumentation.cookie || '_uid';

      if(!force) {
        var lastSessionId = pellet.getSessionId();
        if(lastSessionId === sessionKey) {
          return false;
        }
      }

      localStorage.setItem(sessionKey, sessionId);
      pellet.cookie.set(sessionKey, sessionId);

      return true;
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

        if(!sessionId) {
          sessionId = pellet.getSessionId()
        }

        data._s = sessionId;
        data._n = namespace;
        data._t = type;
        data._cac = (+(new Date()));

        for(i in data) {
          if(data[i]) {
            query.push(i + '=' + encodeURIComponent(data[i]));
          }
        }

        if(query.length) {
          url += '?' + query.join('&');
        }

        var trackPixel = new Image(1,1);
        trackPixel.src = url;
      } else {
        console.debug('instrument:', sessionId, type, namespace, JSON.stringify(payload));
      }
    });

    next();
  });
}
