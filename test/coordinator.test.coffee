#mocha --compilers coffee:coffee-script test/route.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

isomorphicConstructionContext = require "../src/coordinator.js"
observables = require "../src/observables.js"
pellet = require "../src/pellet.js"

pellet.registerCoordinatorSpec "testCoordinator",
  initialize: ->
    @fire = @event "test"
  go: (data)->
    @fire.emit(data)

describe "Coordinator", ->
    describe "event", ->
        it "create event ondemand", ->
          coordinator = new isomorphicConstructionContext()

          foobarE = coordinator.event("foobar")

          expect(foobarE).to.be.an.instanceof(observables.autoRelease)
          expect(coordinator._releaseList).to.deep.equal({foobar:foobarE})

        it "register bad emitter event", ->
          coordinator = new isomorphicConstructionContext()

          expect(coordinator.registerEmitter.bind(coordinator, "foobar")).to.throw('Cannot register a non emitter/autorelease')
          expect(coordinator.registerEmitter.bind(coordinator, "foobar", null)).to.throw('Cannot register a non emitter/autorelease')
          expect(coordinator.registerEmitter.bind(coordinator, "foobar", "foo")).to.throw('Cannot register a non emitter/autorelease')
          expect(coordinator.registerEmitter.bind(coordinator, "foobar", {})).to.throw('Cannot register a non emitter/autorelease')

          foobarE = coordinator.event("foobar")

          expect(foobarE).to.be.an.instanceof(observables.autoRelease)
          expect(coordinator._releaseList).to.deep.equal({foobar:foobarE})

          expect(coordinator.registerEmitter.bind(coordinator, "foobar")).to.throw('Conflict with existing key')

        it "register emitter event", ->
          coordinator = new isomorphicConstructionContext()

          newEmitter = new observables.emitter()
          console.log "newEmitter", newEmitter instanceof observables.emitter ? 't':'f'
          foobarE = coordinator.registerEmitter("foobar", newEmitter)

          expect(foobarE).to.be.an.instanceof(observables.autoRelease)
          expect(coordinator._releaseList).to.deep.equal({foobar:foobarE})

          coordinator = new isomorphicConstructionContext()
          newEmitter = new observables.autoRelease(new observables.emitter())
          foobarE2 = coordinator.registerEmitter("foobar2", newEmitter)

          expect(foobarE2).to.be.an.instanceof(observables.autoRelease)
          expect(coordinator._releaseList).to.deep.equal({foobar2:foobarE2})

        it "getting an event (in a coordinator) always return identical reference", ->
          coordinator = new isomorphicConstructionContext()

          foobarE = coordinator.event("foobar")
          expect(foobarE).to.be.an.instanceof(observables.autoRelease)

          foobarE_2 = coordinator.event("foobar")
          expect(foobarE_2).to.be.an.instanceof(observables.autoRelease)

          expect(foobarE_2).to.equal(foobarE)

          expect(coordinator._releaseList).to.deep.equal({foobar:foobarE})

        it "getting an event (in a child coordinator) always return wrapped reference", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          foobarE = coordinator.event("foobar")
          expect(foobarE).to.be.an.instanceof(observables.autoRelease)

          foobarE_2 = childCoordinator.event("foobar")
          expect(foobarE_2).to.be.an.instanceof(observables.autoRelease)

          expect(foobarE_2).to.not.equal(foobarE)

          expect(coordinator._releaseList).to.deep.equal({foobar:foobarE, _$0:childCoordinator})
          expect(childCoordinator._releaseList).to.deep.equal({foobar:foobarE_2})

        it "allow multiple events (by name)", ->
          coordinator = new isomorphicConstructionContext()

          foobarE = coordinator.event("foobar")
          expect(foobarE).to.be.an.instanceof(observables.autoRelease)

          foobarE_2 = coordinator.event("foobar2")
          expect(foobarE_2).to.be.an.instanceof(observables.autoRelease)

          expect(foobarE_2).to.not.equal(foobarE)

          expect(coordinator._releaseList).to.deep.equal({foobar:foobarE, foobar2:foobarE_2})

        it "throw exception if event trying to overwrite existing key of wrong type", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          expect(coordinator.event.bind(coordinator, "_$0")).to.throw('Conflict with existing key')

          foobarE = coordinator.event("foobar")

          expect(coordinator.coordinator.bind(coordinator, "foobar", "testCoordinator")).to.throw('Conflict with existing key')

          testCoordinator = coordinator.coordinator("foobar2", "testCoordinator")

          expect(coordinator.event.bind(coordinator, "foobar2")).to.throw('Conflict with existing key')

        it "track emits and auto release", ->
          coordinator = new isomorphicConstructionContext()

          cbCount = 0

          foobarE = coordinator.event('foobar')
          foobarE.on ()->
            cbCount++

          foobarE.emit()
          foobarE.emit()
          foobarE.emit()

          expect(coordinator._releaseList).to.deep.equal({foobar:foobarE})
          expect(cbCount).to.equal(3)

          coordinator.release()

          expect(coordinator._releaseList).to.deep.equal({})
          foobarE.emit()

          expect(cbCount).to.equal(3)

        it "on release do not destroy the emitter", ->
          coordinator = new isomorphicConstructionContext()

          cbCount = 0
          cbCount_raw = 0

          foobarE = coordinator.event('foobar')
          foobarE.__obs.onValue ()->
            cbCount_raw++

          foobarE.on ()->
            cbCount++

          foobarE.emit()
          foobarE.emit()

          expect(cbCount).to.equal(2)
          expect(cbCount_raw).to.equal(2)

          coordinator.release()

          foobarE_2 = coordinator.event('foobar')

          expect(foobarE_2).to.not.equal(foobarE)

          foobarE_2.emit()
          foobarE.emit()

          expect(cbCount).to.equal(2)
          expect(cbCount_raw).to.equal(4)

        it "child share parent events", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          cbCount = 0
          propCount = 0

          coordinator.prop2 = ->
            propCount++

          foobarE = coordinator.event('foobar')
          foobarE.on ->
            cbCount++

          coordinator.event('foobar').emit()
          coordinator.prop2()

          expect(cbCount).to.equal(1)
          expect(propCount).to.equal(1)

          childCoordinator.event('foobar').emit();
          childCoordinator.prop2();

          expect(cbCount).to.equal(2)
          expect(propCount).to.equal(2)

          coordinator.event('foobar').emit()
          foobarE.emit()
          coordinator.prop2()

          expect(cbCount).to.equal(4)
          expect(propCount).to.equal(3)

        it "child coordinator share event with parent", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          cbCount = 0
          cbCount_2 = 0

          foobarE = coordinator.event('foobar')
          foobarE.on ->
            cbCount++

          foobarE_2 = childCoordinator.event('foobar')
          foobarE_2.on ->
            cbCount_2++

          foobarE.emit()
          expect(cbCount).to.equal(1)
          expect(cbCount_2).to.equal(1)

          foobarE_2.emit()
          expect(cbCount).to.equal(2)
          expect(cbCount_2).to.equal(2)


        # child coordinator do not share properies! ie if you update a child it will not update parent!

        it "child coordinator define event on root coordinator", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          cbCount = 0
          cbCount_2 = 0

          foobarE_2 = childCoordinator.event('foobar')
          foobarE_2.on ->
            cbCount_2++

          foobarE = coordinator.event('foobar')
          foobarE.on ->
            cbCount++

          foobarE.emit()
          expect(cbCount).to.equal(1)
          expect(cbCount_2).to.equal(1)

          foobarE_2.emit()
          expect(cbCount).to.equal(2)
          expect(cbCount_2).to.equal(2)

        it "child coordinator track auto release separately", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          cbCount = 0
          cbCount_2 = 0

          foobarE = coordinator.event('foobar')
          foobarE.on ->
            cbCount++

          foobarE_2 = childCoordinator.event('foobar')
          foobarE_2.on ->
            cbCount_2++

          foobarE.emit()
          expect(cbCount).to.equal(1)
          expect(cbCount_2).to.equal(1)

          childCoordinator.release()

          foobarE_2.emit()
          expect(cbCount).to.equal(2)
          expect(cbCount_2).to.equal(1)

          foobarE.emit()
          expect(cbCount).to.equal(3)
          expect(cbCount_2).to.equal(1)

          coordinator.release()

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

          coordinator.event('foobar').emit()
          childCoordinator.event('foobar').emit()
          expect(cbCount).to.equal(7)
          expect(cbCount_2).to.equal(5)

        it "track auto release via pellet register coordinator", ->
          coordinator = new isomorphicConstructionContext()

          cbCount = 0
          cbCount_2 = 0

          testCoordinator = coordinator.coordinator("foobar", "testCoordinator")

          foobarE = testCoordinator.event("test")
          foobarE.on ->
            cbCount++

          testCoordinator.go()
          expect(cbCount).to.equal(1)

          coordinator.release()

          testCoordinator.go()
          expect(cbCount).to.equal(1)

        it "pellet register coordinator are independent to all coordinator", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          testCoordinator = coordinator.coordinator("foobar", "testCoordinator")
          testCoordinator_2 = childCoordinator.coordinator("foobar", "testCoordinator")

          expect(testCoordinator).to.not.equal(testCoordinator_2)

        it "pellet register coordinator auto relaese is tracked", ->
          coordinator = new isomorphicConstructionContext()
          childCoordinator = coordinator.createChildCoordinator()

          testCoordinator = coordinator.coordinator("foobar", "testCoordinator")
          testCoordinator_2 = childCoordinator.coordinator("foobar", "testCoordinator")

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

          coordinator = pellet.getCoordinator("foobar")
          coordinator.go()

          expect(cbCount).to.equal(3)
          expect(cbCount_2).to.equal(3)

          testCoordinator.release()
          testCoordinator_2.release()

          coordinator.go()
          testCoordinator.go()
          testCoordinator_2.go()

          expect(cbCount).to.equal(3)
          expect(cbCount_2).to.equal(3)
