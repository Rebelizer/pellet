var react = require('react')
  , isolator = require('./isolator');

var spec = {
  requestContext: react.PropTypes.object,
  rootIsolator: react.PropTypes.instanceOf(isolator),
  locales: react.PropTypes.oneOfType([
    react.PropTypes.string,
    react.PropTypes.array
  ])
};

module.exports = {
  contextTypes     : spec,
  childContextTypes: spec,

  getInitialState: function() {
    // create a local  instrument with our isolatedConfig. This is like having our own constructor
    this.instrument = require('pellet').instrumentation.addIsolatedConfig(this.context.rootIsolator.isolatedConfig);
    return (this.props && this.props.__initState) || {};
  },

  event: function(name) {
    if(!this._$isolator) {
      console.verbose('add local isolator because event:', name);
      this._$isolator = this.context.rootIsolator.createChild();
    }

    return this._$isolator.event(name);
  },

  coordinator: function(name, type) {
    if(!this._$isolator) {
      console.verbose('add local isolator because isolator:', name, type);
      this._$isolator = this.context.rootIsolator.createChild();
    }

    return this._$isolator.coordinator(name, type);
  },

  getLocales: function() {
    return this.props.locales || this.context.locales;
  },

  getRequestContext: function() {
    return this.context.requestContext;
  },

  getIsolatedConfig: function() {
    if(this._$isolator) {
      return this._$isolator.isolatedConfig;
    } else {
      return this.context.rootIsolator.isolatedConfig;
    }
  },

  componentWillUnmount: function() {
    // release everything if root element unmounting
    // else check if local isolator that we need to
    // release.
    if(!this._owner) {
      console.verbose('release rootIsolator');
      this.context.rootIsolator.release();
    } else if(this._$isolator) {
      console.verbose('release local isolator');
      this._$isolator.release();
    }
  },

  getChildContext: function () {
    return {
      rootIsolator: this.context.rootIsolator,
      requestContext: this.context.requestContext,
      locales: this.getLocales()
    };
  }
};
