#mocha --compilers coffee:coffee-script/register test/pellet.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

############ BOOTSTRAP PELLET (with a clean envirment)
delete require.cache[require.resolve('../src/pellet')]
process.env.SERVER_ENV = true
process.env.BROWSER_ENV = false
global.__pellet__bootstrap = {config:{},options:{}}; global.window={__pellet__bootstrap:global.__pellet__bootstrap};
pellet = require "../src/pellet"
############

describe "Pellet", ->
    describe "load manifest components", ->
        it "ignore empty manifest", ->
            pellet.components = {}
            pellet.loadManifestComponents()
            expect(pellet.components).eql({});

        it "ignore non versioned components", ->
            pellet.components = {}
            pellet.loadManifestComponents({test:true, bob:true})
            expect(pellet.components).eql({});

            pellet.components = {}
            pellet.loadManifestComponents({'test':1, 'test@0.1.0':0})
            expect(pellet.components).eql({'test':0, 'test@0.1.0':0});

        it "use highest component version", ->
            pellet.components = {}
            pellet.loadManifestComponents({'test@0.0.0':0, 'test@0.1':1})
            expect(pellet.components).eql({'test':1, 'test@0.1':1, 'test@0.0.0':0});

            pellet.components = {}
            pellet.loadManifestComponents({'test@0.1':1, 'test@0.0.0':0})
            expect(pellet.components).eql({'test':1, 'test@0.1':1, 'test@0.0.0':0});

            pellet.components = {}
            pellet.loadManifestComponents({'test@0.1':1, 'test@0.0.0a':0})
            expect(pellet.components).eql({'test':1, 'test@0.1':1, 'test@0.0.0a':0});

            pellet.components = {}
            pellet.loadManifestComponents({'test@0.1':1, 'test@0.1.0':0})
            expect(pellet.components).eql({'test':0, 'test@0.1':1, 'test@0.1.0':0});

            pellet.components = {}
            pellet.loadManifestComponents({'test@0.1.0':1, 'test@0.13.0':0})
            expect(pellet.components).eql({'test':0, 'test@0.1.0':1, 'test@0.13.0':0});

        it "warn if duplicate component", ->
            called = []
            console.warn = -> called.push(true)

            pellet.components = {}
            pellet.loadManifestComponents({'test@0.0.0':0, 'test@0.1':1})
            expect(pellet.components).eql({'test':1, 'test@0.1':1, 'test@0.0.0':0});

            pellet.loadManifestComponents({'test@0.0.0':0, 'test@0.1':1})
            expect(pellet.components).eql({'test':1, 'test@0.1':1, 'test@0.0.0':0});

            expect(called).eql([true])
