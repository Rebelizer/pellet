var React = require("react")
  , pellet = require("pellet")
  , compo = pellet.components;

var page = require('./html5-page.jade');

module.exports = installPage = pellet.createClass({
  routes: '/html5',
  render: function() {
    return this.transferPropsTo(compo.layout(null, page(this)));
  }
});
