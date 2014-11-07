var react = require('react')
  , isomorphicRouteContext = require('./isomorphic-route-context.js');

var spec = {
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

  getMyEventContext: function() {
    var currentContext = this.__$currentContext || this.context.currentContext;
    if(currentContext) {
      return currentContext;
    }

    console.log('------>Create a new context');
    currentContext = this.__$currentContext = new Object({shit:'yes'});
  },

  componentWillUnmount: function() {
    console.log('------>componentWillUnmount', this);
    if(this.__$currentContext) {
      console.log('we need to nuke currentContext', this.__$currentContext);
    }
  },

  getChildContext: function () {
    if(this.__$currentContext) {
      console.log('------>need to add this.__$currentContext');
      return {
        locales: this.props.locales || this.context.locales,
        currentContext: this.__$currentContext
      }
    }

    return {
      locales: this.props.locales || this.context.locales
    };
  }
};
