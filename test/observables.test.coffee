#mocha --compilers coffee:coffee-script test/route.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

observables = require "../src/observables.js"

describe "Observables", ->
    describe "raw autorelease", ->
      it "arguments are not required", ->
        autoRelease = new observables.autoRelease()

        cbCount = 0

        autoRelease.on (val)->
          expect(val).to.equal("foobar")
          cbCount++

        expect(cbCount).to.equal(0)
        autoRelease.emit("foobar")
        expect(cbCount).to.equal(1)

      it "track auto release", ->
        autoRelease = new observables.autoRelease()

        cbCount = 0
        cbArray = []
        i = 100
        while(i--)
          fn = (val)->
            expect(val).to.equal("foobar")
            cbCount++
          cbArray.push fn
          autoRelease.on fn

        autoRelease.emit("foobar")
        expect(cbCount).to.equal(100)

        autoRelease.release()
        autoRelease.emit("foobar")
        expect(cbCount).to.equal(100)

        i = 50
        while(i--)
          autoRelease.on cbArray[i]

        autoRelease.emit("foobar")
        expect(cbCount).to.equal(150)

      it "track auto release over chained events", ->
        autoRelease = new observables.autoRelease()

        cbCount = 0
        cbCount_2 = 0
        cbCount_3 = 0
        i = 100

        while(i--)
          fn = (val)->
            expect(val).to.equal("barfoo")
            cbCount++

          fn2 = (val)->
            expect(val).to.equal("foobar")
            cbCount_2++
            "barfoo"
          fn3 = (val)->
            expect(val).to.equal("barfoo")
            cbCount_3++

          autoRelease.map(fn2).tap(fn3).on(fn)

        expect(autoRelease.refValue.length).to.equal(0)
        expect(autoRelease.children.length).to.equal(100)
        expect(autoRelease.children[0].children.length).to.equal(1)
        expect(autoRelease.children[0].children[0].children.length).to.equal(0)
        expect(autoRelease.children[0].children[0].refValue.length).to.equal(1)

        autoRelease.emit("foobar")
        expect(cbCount).to.equal(100)
        expect(cbCount_2).to.equal(100)
        expect(cbCount_3).to.equal(100)

        autoRelease.release()
        autoRelease.emit("foobar")
        expect(cbCount).to.equal(100)
        expect(cbCount_2).to.equal(100)
        expect(cbCount_3).to.equal(100)

    describe "autorelease with owner", ->
      it "create event with owner", ->
        autoRelease = new observables.autoRelease(false, "foo owner")

        autoRelease.on (val)->
          expect(val).to.deep.equal({sender:"foo owner", event:"foobar"})

        autoRelease.emit("foobar")

      it "owner is passed to child autorelease", ->
        autoRelease = new observables.autoRelease(false, "foo owner")

        cbCount = 0

        fn = (val)->
          expect(val).to.deep.equal({sender:"foo owner", event:"barfoo"})
          cbCount++

        fn2 = (val)->
          expect(val).to.deep.equal({sender:"foo owner", event:"foobar"})
          cbCount++
          val.event = "barfoo"
          val

        fn3 = (val)->
          expect(val).to.deep.equal({sender:"foo owner", event:"barfoo"})
          cbCount++

        autoRelease.map(fn2).tap(fn3).on(fn)

        autoRelease.emit("foobar")
        expect(cbCount).to.equal(3)

    describe "external emitter", ->
      it "create event with external emitter", ->
        fooE = observables.emitter()
        autoRelease = new observables.autoRelease(fooE)

        cbCount = 0
        autoRelease.on (val)->
          expect(val).to.equal("foobar")
          cbCount++

        fooE.emit("foobar")
        autoRelease.emit("foobar")
        expect(cbCount).to.equal(2)

      it "get internal emit", ->
        fooE = observables.emitter()
        autoRelease = new observables.autoRelease(fooE)

        fooE.onValue (val)->
          expect(val).to.equal("foobar")

        autoRelease.emit("foobar")

      it "get owner data from internal emit", ->
        fooE = observables.emitter()
        autoRelease = new observables.autoRelease(fooE, "foo owner")

        fooE.onValue (val)->
          expect(val).to.deep.equal({sender:"foo owner", event:"foobar"})

        autoRelease.emit("foobar")
