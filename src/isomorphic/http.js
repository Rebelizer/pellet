var browserCookie;
if(process.env.BROWSER_ENV) {
  browserCookie = require('./cookie');
}

/**
 * Isomorphic http used by both server and browser.
 *
 * @class
 * @param request
 * @param response
 * @param next
 */
function isomorphicHttp (request, response, next) {
  this.request = request;
  this.response = response;
  this.next = next;

  this.headTags = [];
}

isomorphicHttp.prototype = {
  /**
   * Set the http status code.
   *
   * This only has an effect on the server.
   *
   * @param {number} code
   */
  status: function(code) {
    if(process.env.BROWSER_ENV) {
      return;
    }

    // if expressjs or nodejs
    if(this.response.status) {
      this.response.status(code);
    } else {
      this.response.statusCode = code;
    }
  },

  /**
   * Adds a header to the http response.
   *
   * This only has an effect on the server.
   *
   * @param field
   * @param val
   * @returns {*}
   */
  headers: function(field, val) {
    if(process.env.BROWSER_ENV) {
      return;
    }

    if (2 == arguments.length) {
      if (Array.isArray(val)) {
        val = val.map(String);
      } else {
        val = String(val);
      }

      // setHeader = res.set ? http.OutgoingMessage.prototype.setHeader : res.setHeader
      this.response.setHeader(field, val);
    } else if(typeof field === 'object'){
      for (var key in field) {
        this.set(key, field[key]);
      }
    } else {
      return this.request.headers[field];
    }
  },

  /**
   * Set _Content-Type_ response header with `type` through `mime.lookup()`
   * when it does not contain "/", or set the Content-Type to `type` otherwise.
   *
   * This only has an effect on the server.
   *
   * Examples:
   *
   *     http.type('.html');
   *     http.type('html');
   *     http.type('json');
   *     http.type('application/json');
   *     http.type('png');
   *
   * @param {string} type
   */
  type: function(type) {
    if(process.env.BROWSER_ENV) {
      return;
    }

    this.response.type(type);
  },

  /**
   * Redirect to the given `url` with optional response `status`
   * defaulting to 302.
   *
   * This only has an effect on the server.
   *
   * The resulting `url` is determined by `res.location()`, so
   * it will play nicely with mounted apps, relative paths,
   * `"back"` etc.
   *
   * Examples:
   *
   *     http.redirect('/foo/bar');
   *     http.redirect('http://example.com');
   *     http.redirect(301, 'http://example.com');
   *     http.redirect('../login'); // /blog/post/1 -> /blog/login
   *
   * @param {number} [status]
   * @param {string} url
   */
  redirect: function(status, url) {
    if(process.env.BROWSER_ENV) {
      // todo: look at redirect logic and redirect using history.push
      return;
    }

    // todo: I need to make this a nodejs version not express
    this.response.redirect.apply(this.response, Array.prototype.slice.call(arguments, 0));
  },

  /**
   * Add to the header.
   *
   * Options:
   *  * meta
   *  * link
   *  * title
   *
   * @param type
   * @param fields
   */
  addToHead: function(type, fields) {
    if(process.env.BROWSER_ENV) {
      if(type == 'title') {
        document.title = fields;
      }

      return;
    }

    var newLine;

    switch(type) {
      case 'meta':
        newLine = ['<meta'];

        if (fields.name) {
          newLine.push('name="' + fields.name + '"');
        }

        if (fields.property) {
          newLine.push('property="' + fields.property + '"');
        }

        if (fields.charset) {
          newLine.push('charset="' + fields.charset + '"');
        }

        if (fields.content) {
          newLine.push('content="' + fields.content + '"');
        }

        if (fields.httpEquiv) {
          newLine.push('http-equiv="' + fields.httpEquiv + '"');
        }

        if (fields['http-equiv']) {
          newLine.push('http-equiv="' + fields['http-equiv'] + '"');
        }

        newLine = newLine.join(' ') + '>';
        break;
      case 'link':
        newLine = ['<link'];

        if (fields.href) {
          newLine.push('href="' + fields.href + '"');
        }

        if (fields.charset) {
          newLine.push('charset="' + fields.charset + '"');
        }

        if (fields.hreflang) {
          newLine.push('hreflang="' + fields.hreflang + '"');
        }

        if (fields.media) {
          newLine.push('media="' + fields.media + '"');
        }

        if (fields.rev) {
          newLine.push('rev="' + fields.rev + '"');
        }

        if (fields.rel) {
          newLine.push('rel="' + fields.rel + '"');
        }

        if (fields.sizes) {
          newLine.push('sizes="' + fields.sizes + '"');
        }

        if (fields.type) {
          newLine.push('type="' + type + '"');
        }

        if (fields.target) {
          newLine.push('target="' + target + '"');
        }

        newLine = newLine.join(' ') + '>';
        break;
      case 'title':
        newLine = '<title>' + fields + '</title>';
        break;
      case 'script':
        throw new Error('Use the addScript function');
        break;
      case 'style':
        throw new Error('Use the addStyle function');
        break;
      default:
        throw new Error('Unknown head tag ' + type);
    }

    this.headTags.push(newLine);
  },

  /**
   *
   * @param name
   * @param value
   * @param options
   *   path
   *   domain
   *   expires
   *   secure
   *     server side only
   *   httpOnly
   *   maxAge
   *
   * @returns {*}
   */
  cookie: function(name, value, options) {
    if(typeof value === 'undefined' && typeof options === 'undefined') {
      if(process.env.BROWSER_ENV) {
        return browserCookie.get(name);
      } else if(process.env.SERVER_ENV) {
        return this.request.cookies && this.request.cookies[name];
      }
    } else {
      if(process.env.BROWSER_ENV) {
        if(options && (options.httpOnly || options.maxAge)) {
          throw new Error('Can not set httpOnly or maxAge on the browser');
        }

        browserCookie.set(name, value, options);
      } else if(process.env.SERVER_ENV) {
        this.response.cookie(name, value, options);
      }
    }
  }
};

module.exports = isomorphicHttp;
