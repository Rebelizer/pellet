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
        <p>intl string=<comp.intl locale="en" key="test" GENDER="male" NUM_RESULTS={5} NUM_CATEGORIES="2"/></p>
      </div>
    </comp.layout>)

#pellet.addComponentRoute "/index", indexPage
