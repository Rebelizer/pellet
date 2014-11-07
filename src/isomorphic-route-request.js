function isomorphicRouteRequest (req, res, next) {
  this.req = req;
  this.res = res;
  this.next = next;

  this.headTags = [];
}

isomorphicRouteRequest.prototype = {
  status: function(code) {
    if(process.env.BROWSER_ENV) {
      return;
    }

    this.res.status(code);
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

      this.res.setHeader(field, val);
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

    this.res.type(type);
  },

  redirect: function(url) {
    if(process.env.BROWSER_ENV) {
      // todo: look at redirect logic and redirect using history.push
      return;
    }

    this.res.redirect(url);
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
  }
};

module.exports = isomorphicRouteRequest;
