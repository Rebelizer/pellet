#mocha --compilers coffee:coffee-script test/route.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

react = require "react"
pellet = require "../index"

getData = (id)->
    {id: id, name:"Name #{id}"}

bootstrapFn = (ctx, next)->
    data = getData ctx.props.isrc
    ctx.setProps({mydata: data})
    ctx.setProps({misc:"test"})
    next(null)

describe "Isomorphic", ->
    describe "pellet component", ->
        it "", ->
            c1 = pellet.createClass
                render: ()->
                    react.DOM.dom(null, "hello world!")

