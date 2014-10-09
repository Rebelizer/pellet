function middlewareProvider (req, res, next) {
  this.req = req;
  this.res = res;
  this.next = next;

  this.title = null;
}

middlewareProvider.prototype = {
  status: function(code) {
    if(process.env.BROWSER_ENV) {
      return;
    }

    this.res.status(code);
  },
  set: function(field, val) {
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
  }
};

module.exports = middlewareProvider;