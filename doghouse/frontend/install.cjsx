# @cjsx React.DOM

React = require "react"
pellet = require "pellet"
compo = pellet.components

module.exports = installPage = pellet.createClass
  routes: "/install"

  render: ->
    compo.layout(@props,
      <section className="section swatch-red-white">
        <div className="container text-center">
          <h1>npm install -g pellet</h1>
          <pre className="text-left">
            $> pellet create
            $> pellet run --watch --clean
          </pre>
        </div>
      </section>
    )
