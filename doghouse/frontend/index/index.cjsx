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
            <h1 className="headline hyper hairline">Pellet</h1>

            <p className="big">Making isomorphic apps easy!</p>
          </header>
        </div>
      </section>
      <section className="section swatch-white-red has-top">
        <div className="decor-top">
          <svg className="decor" height="100%" preserveAspectRatio="none" version="1.1" viewBox="0 0 100 100" width="100%"
               xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L100 100 L0 100" strokeWidth={0}/>
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
                  <a className="box-inner " href="/isomorphic">
                    <img className="svg-inject" src="/img/wayfarer.png"
                         alt="glasses" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/isomorphic">
                    Isomorphic
                  </a>
                </h3>

                <p className="text-center">Pellet unifies your client and server codebase so your APIs, MVC code, routes, and packaging become a single instance, so no need to manage two versions anymore.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/react">
                    <img className="svg-inject" src="/img/react.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/react">
                    React
                  </a>
                </h3>

                <p className="text-center">Pellet uses React to render your markup so its blazing fast. It also make event handling and user interactions soo much easier.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/nodejs">
                    <img className="svg-inject" src="/img/node.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/nodejs">
                    NodeJS
                  </a>
                </h3>

                <p className="text-center">We all love JavaScript and now we can run our code on both the server and client. With Pellet and NodeJS no longer have to run multiple stacks or languages, you can just run one isomorphic JavaScript environment including web server.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/internalization">
                    <img className="svg-inject" src="/img/multilanguage.png"
                         alt="a clock" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/internalization">
                    Multilanguage
                  </a>
                </h3>

                <p className="text-center">We live in a global world why does internalization have to be so complex. Now with React is simple and built into from day one.</p>
              </li>
            </ul>
          </div>
          <div className="row">
            <ul className="list-unstyled row box-list ">
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/seo">
                    <img className="svg-inject" src="/img/seo.png"
                         alt="glasses" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/seo">
                    SEO
                  </a>
                </h3>

                <p className="text-center">Why do we have to sacrfice SEO from web applications, or have to build complex fragment systems, or slow down the users first implrstion on first load</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/reactive-programming">
                    <img className="svg-inject" src="/img/cogs.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/reactive-programming">
                    Reactive Programming
                  </a>
                </h3>

                <p className="text-center">Thw world is changing.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/webpack">
                    <img className="svg-inject" src="/img/composer.png" alt="a clock"
                         data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/webpack">
                    Webpack
                  </a>
                </h3>

                <p className="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.</p>
              </li>
              <li className="col-md-3 text-center">
                <div className="box-round">
                  <div className="box-dummy"/>
                  <a className="box-inner " href="/html5">
                    <img className="svg-inject" src="/img/mug.png"
                         alt="a clock" data-animation="bounce"/>
                  </a>
                </div>
                <h3 className="text-center">
                  <a href="/html5">
                    Cordova
                  </a>
                </h3>

                <p className="text-center">Deply to a doson platforms.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

    </comp.layout>)

#pellet.addComponentRoute "/index", indexPage
