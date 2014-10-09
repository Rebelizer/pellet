# @cjsx React.DOM

React = require "react"
pellet = require "pellet"

module.exports = layoutLayout = pellet.createClass
  render: ->
    <div className="layout-layout">
      <header>header {this.props.params.demi}</header>
      {this.props.children}
      <footer>footer <pellet.components.intl value="t2"/></footer>
    </div>

###
require.ensure [], () ->
  require './other.js'

process.env.NODE_ENV
if process.env.SERVER_ENV
if process.env.BROWSER_ENV

###