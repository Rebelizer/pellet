# @cjsx React.DOM

React = require "react"
pellet = require "pellet"
compo = pellet.components

module.exports = installPage = pellet.createClass
  routes: "/react"

  render: ->
    @transferPropsTo(<compo.layout>
      <section className="section swatch-red-white">
        <div className="container">
          <div className="row">
            <div className="col-md-3  text-default">
              <div className="box-wrap alignnone">
                <div className="box-round box-big flat-shadow">
                  <div className="box-dummy"></div>
                    <span className="box-inner ">
                      <img className="" src="img/react.png" alt="a MAC" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-9  text-default">
                <h1 className="bordered-header">React</h1>
                <p className="lead">
                  Coming soon
                </p>
              </div>
            </div>
          </div>
        </section>
    </compo.layout>)
