var react = require('react')
  , isolator = require('./isolator');

var spec = {
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
    return (this.props && this.props.__initState) || {};
  },

  event: function(name) {
    if(!this._$isolator) {
      console.log('add local isolator because event:', name);
      this._$isolator = this.context.rootIsolator.createChild();
    }

    return this._$isolator.event(name);
  },

  coordinator: function(name, type) {
    if(!this._$isolator) {
      console.log('add local isolator because isolator:', name, type);
      this._$isolator = this.context.rootIsolator.createChild();
    }

    return this._$isolator.coordinator(name, type);
  },

  getIsolatedConfig: function() {
    return this._$isolator.isolatedConfig;
  },

  componentWillUnmount: function() {
    // release everything if root element unmounting
    // else check if local isolator that we need to
    // release.
    if(!this._owner) {
      console.log('release rootIsolator');
      this.context.rootIsolator.release();
    } else if(this._$isolator) {
      console.log('release local isolator');
      this._$isolator.release();
    }
  },

  getChildContext: function () {
    return {
      rootIsolator: this.context.rootIsolator,
      locales: this.props.locales || this.context.locales
    };
  }
};
