# @cjsx React.DOM

React = require "react"
pellet = require "pellet"
comp = pellet.components

module.exports = indexPage = pellet.createClass
  routes: "/index"

  render: ->

    <comp.layout>
      <div className="index-page">
        <h1>Hello</h1>
        <comp.intl/>
      </div>
    </comp.layout>

#pellet.addComponentRoute "/index", indexPage
