var react = require('react')
  , coordinator = require('./coordinator');

var spec = {
  rootCoordinator: react.PropTypes.instanceOf(coordinator),
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
    if(!this._$coordinator) {
      console.log('add local coordinator because event:', name);
      this._$coordinator = this.context.rootCoordinator.createChildCoordinator();
    }

    return this._$coordinator.event(name);
  },

  coordinator: function(name, type) {
    if(!this._$coordinator) {
      console.log('add local coordinator because coordinator:', name, type);
      this._$coordinator = this.context.rootCoordinator.createChildCoordinator();
    }

    return this._$coordinator.coordinator(name, type);
  },

  componentWillUnmount: function() {
    // release everything if root element unmounting
    // else check if local coordinator that we need to
    // release.
    if(!this._owner) {
      console.log('release rootCoordinator');
      this.context.rootCoordinator.release();
    } else if(this._$coordinator) {
      console.log('release local coordinator');
      this._$coordinator.release();
    }
  },

  getChildContext: function () {
    return {
      rootCoordinator: this.context.rootCoordinator,
      locales: this.props.locales || this.context.locales
    };
  }
};
