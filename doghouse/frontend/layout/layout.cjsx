# @cjsx React.DOM

React = require "react"
pellet = require "pellet"

module.exports = layoutLayout = pellet.createClass
  setupInitialRender: (ctx, next) ->
    ctx.setProps myData: "loaded from an API"
    ctx.setProps userName: "Pellet"
    next()

  render: ->

    <div className="layout-layout">
      <header>header</header>
      {this.props.children}
      <footer>footer</footer>
    </div>

###
require.ensure [], () ->
  require './other.js'

process.env.NODE_ENV
if process.env.SERVER_ENV
if process.env.BROWSER_ENV

###