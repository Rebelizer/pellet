#mocha --compilers coffee:coffee-script test/route.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

isolator = require "../src/isolator.js"
observables = require "../src/observables.js"

############ BOOTSTRAP PELLET (with a clean envirment)
delete require.cache[require.resolve('../src/pellet')]
process.env.SERVER_ENV = false;
process.env.BROWSER_ENV = false;
global.__pellet__bootstrap = {config:{},options:{}}; global.window={__pellet__bootstrap:global.__pellet__bootstrap};
pellet = require "../src/pellet"
############

pellet.registerCoordinatorSpec "testCoordinator",
  initialize: ->
    @fire = @event "test"
  go: (data)->
    @fire.emit(data)

describe "Coordinator", ->
    describe "event", ->
        it "create event ondemand", ->
          isolate = new isolator()

          foobarE = isolate.event("foobar")

          expect(foobarE).to.be.an.instanceof(observables.autoRelease)
          expect(isolate._releaseList).to.deep.equal({foobar:foobarE})

        it "register bad emitter event", ->
          isolate = new isolator()

          expect(isolate.registerEmitter.bind(isolate, "foobar")).to.throw('Cannot register a non emitter/autorelease')
          expect(isolate.registerEmitter.bind(isolate, "foobar", null)).to.throw('Cannot register a non emitter/autorelease')
          expect(isolate.registerEmitter.bind(isolate, "foobar", "foo")).to.throw('Cannot register a non emitter/autorelease')
          expect(isolate.registerEmitter.bind(isolate, "foobar", {})).to.throw('Cannot register a non emitter/autorelease')

          foobarE = isolate.event("foobar")

          expect(foobarE).to.be.an.instanceof(observables.autoRelease)
          expect(isolate._releaseList).to.deep.equal({foobar:foobarE})

          expect(isolate.registerEmitter.bind(isolate, "foobar")).to.throw('Conflict with existing key')

        it "register emitter event", ->
          isolate = new isolator()

          newEmitter = new observables.emitter()
          console.log "newEmitter", newEmitter instanceof observables.emitter ? 't':'f'
          foobarE = isolate.registerEmitter("foobar", newEmitter)

          expect(foobarE).to.be.an.instanceof(observables.autoRelease)
          expect(isolate._releaseList).to.deep.equal({foobar:foobarE})

          isolate = new isolator()
          newEmitter = new observables.autoRelease(new observables.emitter())
          foobarE2 = isolate.registerEmitter("foobar2", newEmitter)

          expect(foobarE2).to.be.an.instanceof(observables.autoRelease)
          expect(isolate._releaseList).to.deep.equal({foobar2:foobarE2})

        it "getting an event (in a isolate) always return identical reference", ->
          isolate = new isolator()

          foobarE = isolate.event("foobar")
          expect(foobarE).to.be.an.instanceof(observables.autoRelease)

          foobarE_2 = isolate.event("foobar")
          expect(foobarE_2).to.be.an.instanceof(observables.autoRelease)

          expect(foobarE_2).to.equal(foobarE)

          expect(isolate._releaseList).to.deep.equal({foobar:foobarE})

        it "getting an event (in a child isolate) always return wrapped reference", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          foobarE = isolate.event("foobar")
          expect(foobarE).to.be.an.instanceof(observables.autoRelease)

          foobarE_2 = childIsolate.event("foobar")
          expect(foobarE_2).to.be.an.instanceof(observables.autoRelease)

          expect(foobarE_2).to.not.equal(foobarE)

          expect(isolate._releaseList).to.deep.equal({foobar:foobarE, _$0:childIsolate})
          expect(childIsolate._releaseList).to.deep.equal({foobar:foobarE_2})

        it "allow multiple events (by name)", ->
          isolate = new isolator()

          foobarE = isolate.event("foobar")
          expect(foobarE).to.be.an.instanceof(observables.autoRelease)

          foobarE_2 = isolate.event("foobar2")
          expect(foobarE_2).to.be.an.instanceof(observables.autoRelease)

          expect(foobarE_2).to.not.equal(foobarE)

          expect(isolate._releaseList).to.deep.equal({foobar:foobarE, foobar2:foobarE_2})

        it "throw exception if event trying to overwrite existing key of wrong type", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          expect(isolate.event.bind(isolate, "_$0")).to.throw('Conflict with existing key')

          foobarE = isolate.event("foobar")

          expect(isolate.coordinator.bind(isolate, "foobar", "testCoordinator")).to.throw('Conflict with existing key')

          testCoordinator = isolate.coordinator("foobar2", "testCoordinator")

          expect(isolate.event.bind(isolate, "foobar2")).to.throw('Conflict with existing key')

        it "track emits and auto release", ->
          isolate = new isolator()

          cbCount = 0

          foobarE = isolate.event('foobar')
          foobarE.on ()->
            cbCount++

          foobarE.emit()
          foobarE.emit()
          foobarE.emit()

          expect(isolate._releaseList).to.deep.equal({foobar:foobarE})
          expect(cbCount).to.equal(3)

          isolate.release()

          expect(isolate._releaseList).to.deep.equal({})
          foobarE.emit()

          expect(cbCount).to.equal(3)

        it "on release do not destroy the emitter", ->
          isolate = new isolator()

          cbCount = 0
          cbCount_raw = 0

          foobarE = isolate.event('foobar')
          foobarE.__obs.onValue ()->
            cbCount_raw++

          foobarE.on ()->
            cbCount++

          foobarE.emit()
          foobarE.emit()

          expect(cbCount).to.equal(2)
          expect(cbCount_raw).to.equal(2)

          isolate.release()

          foobarE_2 = isolate.event('foobar')

          expect(foobarE_2).to.not.equal(foobarE)

          foobarE_2.emit()
          foobarE.emit()

          expect(cbCount).to.equal(2)
          expect(cbCount_raw).to.equal(4)

        it "child share parent events", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          cbCount = 0
          propCount = 0

          isolate.prop2 = ->
            propCount++

          foobarE = isolate.event('foobar')
          foobarE.on ->
            cbCount++

          isolate.event('foobar').emit()
          isolate.prop2()

          expect(cbCount).to.equal(1)
          expect(propCount).to.equal(1)

          childIsolate.event('foobar').emit();
          childIsolate.prop2();

          expect(cbCount).to.equal(2)
          expect(propCount).to.equal(2)

          isolate.event('foobar').emit()
          foobarE.emit()
          isolate.prop2()

          expect(cbCount).to.equal(4)
          expect(propCount).to.equal(3)

        it "child isolate share event with parent", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          cbCount = 0
          cbCount_2 = 0

          foobarE = isolate.event('foobar')
          foobarE.on ->
            cbCount++

          foobarE_2 = childIsolate.event('foobar')
          foobarE_2.on ->
            cbCount_2++

          foobarE.emit()
          expect(cbCount).to.equal(1)
          expect(cbCount_2).to.equal(1)

          foobarE_2.emit()
          expect(cbCount).to.equal(2)
          expect(cbCount_2).to.equal(2)


        # child isolate do not share properies! ie if you update a child it will not update parent!

        it "child isolate define event on root isolate", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          cbCount = 0
          cbCount_2 = 0

          foobarE_2 = childIsolate.event('foobar')
          foobarE_2.on ->
            cbCount_2++

          foobarE = isolate.event('foobar')
          foobarE.on ->
            cbCount++

          foobarE.emit()
          expect(cbCount).to.equal(1)
          expect(cbCount_2).to.equal(1)

          foobarE_2.emit()
          expect(cbCount).to.equal(2)
          expect(cbCount_2).to.equal(2)

        it "child isolate track auto release separately", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          cbCount = 0
          cbCount_2 = 0

          foobarE = isolate.event('foobar')
          foobarE.on ->
            cbCount++

          foobarE_2 = childIsolate.event('foobar')
          foobarE_2.on ->
            cbCount_2++

          foobarE.emit()
          expect(cbCount).to.equal(1)
          expect(cbCount_2).to.equal(1)

          childIsolate.release()

          foobarE_2.emit()
          expect(cbCount).to.equal(2)
          expect(cbCount_2).to.equal(1)

          foobarE.emit()
          expect(cbCount).to.equal(3)
          expect(cbCount_2).to.equal(1)

          isolate.release()

          foobarE.emit()
          foobarE_2.emit()
          expect(cbCount).to.equal(3)
          expect(cbCount_2).to.equal(1)

          foobarE.on ->
            cbCount++

          foobarE_2.on ->
            cbCount_2++

          foobarE.emit()
          expect(cbCount).to.equal(4)
          expect(cbCount_2).to.equal(2)

          foobarE_2.emit()
          expect(cbCount).to.equal(5)
          expect(cbCount_2).to.equal(3)

          isolate.event('foobar').emit()
          childIsolate.event('foobar').emit()
          expect(cbCount).to.equal(7)
          expect(cbCount_2).to.equal(5)

        it "track auto release via pellet register isolate", ->
          isolate = new isolator()

          cbCount = 0
          cbCount_2 = 0

          testCoordinator = isolate.coordinator("foobar", "testCoordinator")

          foobarE = testCoordinator.event("test")
          foobarE.on ->
            cbCount++

          testCoordinator.go()
          expect(cbCount).to.equal(1)

          isolate.release()

          testCoordinator.go()
          expect(cbCount).to.equal(1)

        it "pellet register isolate are independent to all isolate", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          testCoordinator = isolate.coordinator("foobar", "testCoordinator")
          testCoordinator_2 = childIsolate.coordinator("foobar", "testCoordinator")

          expect(testCoordinator).to.not.equal(testCoordinator_2)

        it "pellet register isolate auto relaese is tracked", ->
          isolate = new isolator()
          childIsolate = isolate.createChild()

          testCoordinator = isolate.coordinator("foobar", "testCoordinator")
          testCoordinator_2 = childIsolate.coordinator("foobar", "testCoordinator")

          cbCount = 0
          cbCount_2 = 0

          testCoordinator.event("test").on ->
            cbCount++

          testCoordinator_2.event("test").on ->
            cbCount_2++

          testCoordinator.go()
          expect(cbCount).to.equal(1)
          expect(cbCount_2).to.equal(1)

          testCoordinator_2.go()
          expect(cbCount).to.equal(2)
          expect(cbCount_2).to.equal(2)

          isolate = pellet.getCoordinator("foobar")
          isolate.go()

          expect(cbCount).to.equal(3)
          expect(cbCount_2).to.equal(3)

          testCoordinator.release()
          testCoordinator_2.release()

          isolate.go()
          testCoordinator.go()
          testCoordinator_2.go()

          expect(cbCount).to.equal(3)
          expect(cbCount_2).to.equal(3)
