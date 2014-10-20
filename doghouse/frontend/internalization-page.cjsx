# @cjsx React.DOM

React = require "react"
pellet = require "pellet"
compo = pellet.components

module.exports = installPage = pellet.createClass
  routes: "/internalization"

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
                      <img className="" src="img/multilanguage.png" alt="a MAC" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-9  text-default">
                <h1 className="bordered-header">internalization</h1>
                <p className="lead">
                Your bones don’t break, mine do. That’s clear. Your cells react to bacteria and viruses differently than mine. You don’t get sick, I do. That’s also clear. But for some reason, you and I react the exact same way to water. We swallow it too fast, we choke.
                </p>
              </div>
            </div>
          </div>
        </section>
    </compo.layout>)
