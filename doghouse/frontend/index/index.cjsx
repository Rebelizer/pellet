# @cjsx React.DOM

React = require "react"
pellet = require "pellet"
comp = pellet.components

module.exports = indexPage = pellet.createClass
  routes: "/index/:demi"

  render: ->
    this.transferPropsTo(<comp.layout>
      <div className="index-page">
        <h1>Hello {this.props.params.demi} xxx</h1>
        <pellet.components.intl/>
      </div>
    </comp.layout>)

#pellet.addComponentRoute "/index", indexPage
