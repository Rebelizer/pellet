# @cjsx React.DOM

React = require "react"
pellet = require "pellet"
comp = pellet.components

module.exports = indexPage = pellet.createClass
  routes: "/"

  render: ->
    this.transferPropsTo(<comp.layout>
      <section className="section swatch-red-white">
        <div className="container">
          <header className="section-header underline">
            <h1 className="headline hyper hairline">Pellet IO</h1>

            <p className="big">Making isomorphic apps easy!</p>
          </header>
        </div>
      </section>
      <section className="section swatch-white-red has-top">
        <div className="decor-top">
          <svg className="decor" height="100%" preserveAspectRatio="none" version="1.1" viewBox="0 0 100 100" width="100%"
               xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L100 100 L0 100" stroke-width={0}/>
          </svg>
        </div>
        <div className="container">
          <header className="section-header ">
            <h1 className="headline super hairline">features</h1>

            <p className="">Imagine an SEO friendly AngularJS, a framework that unifies your client & server code into one codebase, a rich and powerful component system, a reactive programing model, and much more.</p> <p className="bold">Say hello to little pellet!</p>
          </header>
          <div className="row">
            <ul className="list-unstyled row box-list ">
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/wayfarer.png"
                         alt="glasses" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/single-service.html">
                    Isomorphic
                  </a>
                </h3>

                <p className="text-center">Pellet unifies your client and server codebase so your APIs, MVC code, routes, and packaging become a single instance, so no need to manage two versions anymore.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/react.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a>
                    React
                  </a>
                </h3>

                <p className="text-center">Pellet uses React to render your code so its blazing fast and make events and user interactions soo much easier.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/node.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/single-service.html">
                    NodeJS
                  </a>
                </h3>

                <p className="text-center">We all love JavaScript and now we can run our code on both the server and client. Pellet use NodeJS to create a isomorphic environment so we can run our code not only in the browser but now on the server.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/multilanguage.png"
                         alt="a clock" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/single-service.html">
                    Multilanguage
                  </a>
                </h3>

                <p className="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.</p>
              </li>
            </ul>
          </div>
          <div className="row">
            <ul className="list-unstyled row box-list ">
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/seo.png"
                         alt="glasses" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a>
                    SEO
                  </a>
                </h3>

                <p className="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/cogs.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a>
                    Reactive Programming
                  </a>
                </h3>

                <p className="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/composer.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a>
                    Webpack
                  </a>
                </h3>

                <p className="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/single-service.html">
                    <img className="svg-inject" src="/img/mug.png"
                         alt="a clock" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/single-service.html">
                    HTML5
                  </a>
                </h3>

                <p className="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

    </comp.layout>)

#pellet.addComponentRoute "/index", indexPage
