/** @jsx React.DOM */

React = require('react')
//pellet = require('pellet')

module.exports = React.createClass({
  render: function() {
    return (
      <header id="masthead" className="navbar navbar-sticky swatch-red-white navbar-stuck" role="banner">
        <div className="container">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target=".main-navbar">
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>
            <a href="/" className="navbar-brand">
              Pellet
            </a>
          </div>
          <nav className="collapse navbar-collapse main-navbar" role="navigation">
            <ul className="nav navbar-nav navbar-right">
              <li className="dropdown active">
                <a href="/">Home</a>
              </li>
              <li className="dropdown ">
                <a href="/install">Install</a>
              </li>
              <li className="dropdown ">
                <a href="/docs/index.html">Docs</a>
              </li>
              <li className="dropdown ">
                <a href="https://github.com/Rebelizer/pellet">GitHub</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }
});
