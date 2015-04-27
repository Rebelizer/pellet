var pellet = require('../pellet');

if(process.env.BROWSER_ENV) {
  pellet.registerInitFn(function (next) {

    var _url, _filter, maxUrl;
    var batchTimeout = null
      , batchIndex = 0
      , batchUrl = ''
      , batch_n = null
      , batch_t = null
      , batch_s = null;

    if(pellet.config && pellet.config.instrumentation) {
      _url = pellet.config.instrumentation.url;
      _filter = pellet.config.instrumentation.filter;
      _batchTimeout = pellet.config.instrumentation.batchTimeout;

      //
      maxUrl = 2024 - _url.length - 100;

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
        if(pellet.config.instrumentation.lstorage) {
          sessionId = localStorage.getItem(sessionKey);
        }

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

      if(pellet.config.instrumentation.lstorage) {
        localStorage.setItem(sessionKey, sessionId);
      }

      pellet.cookie.set(sessionKey, sessionId);

      return true;
    }

    function timeout() {
      trackPixel = new Image(1,1);
      trackPixel.src = _url + '?_ba=t&_cac=' + (+(new Date())) + batchUrl;

      batchTimeout = null;
      batchIndex = 0;
      batchUrl = '';
      batch_n = null;
      batch_t = null;
      batch_s = null;
    }

    pellet.instrumentation.bus.on(function (data) {
      var sessionId = data.sessionId
        , namespace = data.namespace
        , payload = data.details
        , type = data.type
        , argCount
        , trackPixel;

      // do not send filtered types to server
      if(_filter && !_filter.test(type)) {
        return;
      }

      if(_url) {
        var url = ''
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

        if(!_batchTimeout || batch_n !== namespace) {
          data._n = batch_n = namespace;
        }

        if(!_batchTimeout || batch_t !== type) {
          data._t = batch_t = type;
        }

        if(!_batchTimeout || batch_s !== sessionId) {
          data._s = batch_s = sessionId;
        }

        argCount = 0;
        for(i in data) {
          if(data[i]) {
            query.push(i + '=' + encodeURIComponent(data[i]));
            argCount++;
          }
        }

        if(query.length) {
          url = query.join('&');
        }

        if(!_batchTimeout) {
          var trackPixel = new Image(1,1);
          trackPixel.src = _url + '?_cac=' + (+(new Date())) + '&' + url;
          return;
        }

        if(batchUrl.length + url.length + (argCount * 4) < maxUrl) {
          if(batchIndex === 0) {
            batchUrl += '&' + url;
          } else {
            batchUrl += '&' + url.replace(/=/g, '$' + batchIndex + '=');
          }

          batchIndex++;
        } else {
          trackPixel = new Image(1,1);
          trackPixel.src = _url + '?_ba=t&_cac=' + (+(new Date())) + batchUrl;

          batchUrl = '';
          batchIndex = 1;
          batch_n = namespace;
          batch_t = type;
          batch_s = sessionId;

          if(url.indexOf('_n=') === -1) {
            batchUrl = '&_n=' + encodeURIComponent(batch_n);
          }

          if(url.indexOf('_t=') === -1) {
            batchUrl += '&_t=' + encodeURIComponent(batch_t);
          }

          if(url.indexOf('_s=') === -1) {
            batchUrl += '&_s=' + encodeURIComponent(batch_s);
          }

          batchUrl += '&' + url;
        }

        if(!batchTimeout) {
          batchTimeout = setTimeout(timeout, _batchTimeout);
        }
      } else {
        console.debug('instrument:', sessionId, type, namespace, JSON.stringify(payload));
      }
    });

    next();
  });
}
