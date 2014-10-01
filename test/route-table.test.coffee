#mocha --compilers coffee:coffee-script test/route.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

routes = require "../src/route-table.js"

emptyFn = ->

describe "Route table", ->
    describe "adding route", ->
        it "not allow empty callback", ->
            table = new routes()
            expect(table.add.bind(table, "/test")).to.throw("callback fn is required.")

        it "return true if added", ->
            table = new routes()

            table.add("/test", emptyFn).should.not.be.false
        it "returns false if duplicate", ->
            table = new routes()

            table.add("/test", emptyFn).should.not.be.false
            table.add("/test", emptyFn).should.be.false
        it "returns key when added", ->
            table = new routes()

            table.add("/test", emptyFn).should.be.a('string').equal("/test")
            table.add("/:test", emptyFn).should.be.a('string').equal("/_")
            table.add("/:test?", emptyFn).should.be.a('string').equal("/?")
            table.add("/:test*", emptyFn).should.be.a('string').equal("/*")

            table.add("/test/foobar", emptyFn).should.be.a('string').equal("/test/foobar")
            table.add("/:test/foobar", emptyFn).should.be.a('string').equal("/_/foobar")
            table.add("/:test?/foobar", emptyFn).should.be.a('string').equal("/?/foobar")
            table.add("/:test*/foobar", emptyFn).should.be.a('string').equal("/*/foobar")

            table.add("/:test/:foobar", emptyFn).should.be.a('string').equal("/_/_")
            table.add("/:test/:foobar?", emptyFn).should.be.a('string').equal("/_/?")
            table.add("/:test/:foobar*", emptyFn).should.be.a('string').equal("/_/*")

            table.add(["/a","/b"], emptyFn).should.be.a('string').equal("/a/b")
            table.add(/demi/g, emptyFn).should.be.a('string').equal("/demi/g")

        it "replace duplicate if rank higher", ->
            table = new routes()

            table.add("/test", emptyFn, rank:10).should.not.be.false
            table.add("/test", emptyFn, rank:50).should.not.be.false

        it "rank works with -#", ->
            table = new routes()

            table.add("/test", emptyFn).should.not.be.false
            table.add("/test", emptyFn, rank:-50).should.be.false

            table = new routes()

            table.add("/test", emptyFn, rank:-50).should.not.be.false
            table.add("/test", emptyFn, rank:-40).should.be.a('string').equal("/test")

            table = new routes()

            table.add("/test", emptyFn, rank:-50).should.not.be.false
            table.add("/test", emptyFn, rank:-60).should.be.false

            table = new routes()

            table.add("/test", emptyFn, rank:-50).should.not.be.false
            table.add("/test", emptyFn, rank:40).should.be.a('string').equal("/test")

        it "higher ranked routes match first", ->
            table = new routes()

            table.add("/test", emptyFn, rank:10)
            table.add("/:name", emptyFn, rank:50)

            table.parse("/test").should.be.a('object').deep.equal
                fn:emptyFn
                url: "/test"
                originalUrl: "/test"
                query: null
                params:
                    name: "test"

            table.parse("/test?a=123").should.be.a('object').deep.equal
                fn:emptyFn
                url: "/test"
                originalUrl: "/test?a=123"
                query:
                    a: "123"
                params:
                    name: "test"

            table = new routes()

            table.add("/test", emptyFn, rank:50)
            table.add("/:name", emptyFn, rank:10)

            table.parse("/test").should.be.a('object').deep.equal
                fn:emptyFn
                url: "/test"
                originalUrl: "/test"
                query: null
                params: null

            table.parse("/test?a=123").should.be.a('object').deep.equal
                fn:emptyFn
                url: "/test"
                originalUrl: "/test?a=123"
                query:
                    a: "123"
                params: null
