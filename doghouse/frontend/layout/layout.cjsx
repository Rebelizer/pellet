# @cjsx React.DOM

React = require "react"
pellet = require "pellet"
layoutHeader = require "./header"
layoutFooter = require "./footer"

module.exports = layoutLayout = pellet.createClass
  render: ->
    <div className="layout-layout">
      <layoutHeader/>
      <div id="content" role="main">
        {this.props.children}
      </div>
      <layoutFooter/>
    </div>

###
require.ensure [], () ->
  require './other.js'

process.env.NODE_ENV
if process.env.SERVER_ENV
if process.env.BROWSER_ENV

###
