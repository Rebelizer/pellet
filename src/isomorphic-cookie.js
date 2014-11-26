// based off of https://github.com/ScottHamper/cookies

var cookies = {
  get: function (key) {
    if (cookies._cachedDocumentCookie !== window.document.cookie) {
      cookies._renewCache();
    }

    return cookies._cache[key];
  },

  set: function (key, value, options) {
    options = cookies._getExtendedOptions(options);
    options.expires = cookies._getExpiresDate(value === undefined ? -1 : options.expires);

    window.document.cookie = cookies._generateCookieString(key, value, options);

    return cookies;
  },

  expire: function (key, options) {
    return cookies.set(key, undefined, options);
  },

  _getExtendedOptions: function (options) {
    return {
      path: options && options.path || '/',
      domain: options && options.domain,
      expires: options && options.expires,
      secure: options && options.secure !== undefined ? options.secure : false
    };
  },

  _isValidDate: function (date) {
    return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
  },

  _getExpiresDate: function (expires, now) {
    now = now || new Date();
    switch (typeof expires) {
      case 'number':
        expires = new Date(now.getTime() + expires * 1000);
        break;
      case 'string':
        expires = new Date(expires);
        break;
    }

    if (expires && !cookies._isValidDate(expires)) {
      throw new Error('`expires` parameter cannot be converted to a valid Date instance');
    }

    return expires;
  },

  _generateCookieString: function (key, value, options) {
    key = key.replace(/[^#$&+\^`|]/g, encodeURIComponent);
    key = key.replace(/\(/g, '%28').replace(/\)/g, '%29');
    value = (value + '').replace(/[^!#$&-+\--:<-\[\]-~]/g, encodeURIComponent);
    options = options || {};

    var cookieString = key + '=' + value;
    cookieString += options.path ? ';path=' + options.path : '';
    cookieString += options.domain ? ';domain=' + options.domain : '';
    cookieString += options.expires ? ';expires=' + options.expires.toUTCString() : '';
    cookieString += options.secure ? ';secure' : '';

    return cookieString;
  },

  _getCacheFromString: function (documentCookie) {
    var cookieCache = {};
    var cookiesArray = documentCookie ? documentCookie.split('; ') : [];

    for (var i = 0; i < cookiesArray.length; i++) {
      var cookieKvp = cookies._getKeyValuePairFromCookieString(cookiesArray[i]);

      if (cookieCache[cookieKvp.key] === undefined) {
        cookieCache[cookieKvp.key] = cookieKvp.value;
      }
    }

    return cookieCache;
  },

  _getKeyValuePairFromCookieString: function (cookieString) {
    // "=" is a valid character in a cookie value according to RFC6265, so cannot `split('=')`
    var separatorIndex = cookieString.indexOf('=');

    // IE omits the "=" when the cookie value is an empty string
    separatorIndex = separatorIndex < 0 ? cookieString.length : separatorIndex;

    return {
      key: decodeURIComponent(cookieString.substr(0, separatorIndex)),
      value: decodeURIComponent(cookieString.substr(separatorIndex + 1))
    };
  },

  _renewCache: function () {
    cookies._cache = cookies._getCacheFromString(window.document.cookie);
    cookies._cachedDocumentCookie = window.document.cookie;
  }
};

module.exports = cookies;
