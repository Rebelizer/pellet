var browserCookie;
if(process.env.BROWSER_ENV) {
  browserCookie = require('./isomorphic-cookie');
}

function isomorphicHttp (request, respose, next) {
  this.request = request;
  this.respose = respose;
  this.next = next;

  this.headTags = [];
}

isomorphicHttp.prototype = {
  status: function(code) {
    if(process.env.BROWSER_ENV) {
      return;
    }

    this.respose.status(code);
  },

  header: function(field, val) {
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
      this.respose.setHeader(field, val);
    } else {
      for (var key in field) {
        this.set(key, field[key]);
      }
    }
  },

  type: function(type) {
    if(process.env.BROWSER_ENV) {
      return;
    }

    this.respose.type(type);
  },

  redirect: function(url) {
    if(process.env.BROWSER_ENV) {
      // todo: look at redirect logic and redirect using history.push
      return;
    }

    this.respose.redirect(url);
  },

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
          newLine.push('rev="' + fields.rel + '"');
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
   *     - server side only
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
        this.respose.cookie(name, value, options);
      }
    }
  }
};

module.exports = isomorphicHttp;
