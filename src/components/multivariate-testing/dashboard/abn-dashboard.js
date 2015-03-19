var React = require("react")
  , abnDashboardJade = require('./abn-dashboard.jade')
  , pellet = require("pellet");

module.exports = abnDashboardComponent = pellet.createClass({
  /*,
  componentWillMount: function() {
  },
  componentDidMount: function(nextProps) {
  },
  componentWillReceiveProps: function(nextProps) {
  },
  shouldComponentUpdate: function(nextProps, nextState) {
  },
  componentWillUpdate: function(nextProps, nextState) {
  },
  componentDidUpdate: function(prevProps, prevState) {
  },
  componentWillUnmount: function(nextProps, nextState) {
  },
  */

  routes: pellet.config.abnDashboardUrl,
  //layoutTemplate: "vevoWebLayout",

  componentConstruction: function(options, next) {
    this.addToHead('meta', {name:'robots', content:'noindex, nofollow'});


    next();
  },

  getInitialState: function() {
    return {
      activeExperiment: -1,
      message: null
    };
  },

  setVariation: function(id) {
    id = parseInt(id);
    pellet.experiment.experiments[this.state.activeExperiment].data.participation = id;
    cxApi.setChosenVariation(id, this.state.activeExperiment);
    this.setState({
      message: 'saved variation change'
    });

    ga('send', 'pageview', document.location.pathname);
  },

  showExperiment : function(id) {
    this.setState({
      activeExperiment: id
    });
  },

  render: function() {
    if(this.state.message) {
      var self = this;
      setTimeout(function() {
        self.setState({
          message: null
        });
      }, 2000);
    }

    return abnDashboardJade(this);
  }
});
