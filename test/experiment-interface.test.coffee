#mocha --compilers coffee:coffee-script/register test/experiment-interface.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

pellet = null

# MOCK COMPONENTS
A = -> return 'a'
B = -> return 'b'
C = -> return 'c'
D = -> return 'd'

describe "GA Experiment Interface", ->
  before ->
    ############ BOOTSTRAP PELLET (with a clean envirment)
    # Do before setting process.env so we get a pure pellet version
    delete require.cache[require.resolve('../src/pellet')]
    process.env.SERVER_ENV = false;
    process.env.BROWSER_ENV = false;
    global.__pellet__bootstrap = {config:{},options:{}}; global.window={__pellet__bootstrap:global.__pellet__bootstrap};
    pellet = require "../src/pellet"

    process.env.SERVER_ENV = true;
    process.env.BROWSER_ENV = false;
    pellet.startInit();
    ############

  describe "pellet default", ->
      it "empty or non component/string", ->
        replaceWith = pellet.experiment.select(null)
        expect(replaceWith).to.be.an('undefined')

        replaceWith = pellet.experiment.select('')
        expect(replaceWith).to.be.an('undefined')

        replaceWith = pellet.experiment.select('=')
        expect(replaceWith).to.be.an('undefined')

        replaceWith = pellet.experiment.select('@')
        expect(replaceWith).to.be.an('undefined')

        expect(pellet.experiment.select.bind(pellet.experiment, 1)).to.throw('invalid experiment version type')
        expect(pellet.experiment.select.bind(pellet.experiment, true)).to.throw('invalid experiment version type')
        expect(pellet.experiment.select.bind(pellet.experiment, undefined)).to.throw('invalid experiment version type')

      it "use default version if no experiment or version specified", ->

        pellet.components = {'A@10.0.0': A, 'A': A, 'A@0.0.0': B}

        replaceWith = pellet.experiment.select('@A')
        expect(replaceWith).to.be.a('function')
        expect(replaceWith).to.be.equal(A)

      it "return undefined for unknown component", ->

        pellet.components = {'A@0.0.0': A, 'A': A}

        replaceWith = pellet.experiment.select('B@0.0.0')
        expect(replaceWith).to.be.an('undefined')

        replaceWith = pellet.experiment.select('@B')
        expect(replaceWith).to.be.an('undefined')

        replaceWith = pellet.experiment.select(B)
        expect(replaceWith).to.be.an('undefined')

      it "passthru experiment value for unknown component", ->

        pellet.components = {'A@0.0.0': A, 'A': A}

        replaceWith = pellet.experiment.select('=A')
        expect(replaceWith).to.be.a('string')
        expect(replaceWith).to.be.equal('A')

        replaceWith = pellet.experiment.select('abc')
        expect(replaceWith).to.be.a('string')
        expect(replaceWith).to.be.equal('abc')

      it "passthru locked down experiment values and components", ->

        pellet.components = {'A@0.0.0': A, 'A': A, 'A@10.0.0': B, 'A@5.0.0': C}

        replaceWith = pellet.experiment.select('=A=locked')
        expect(replaceWith).to.be.a('string')
        expect(replaceWith).to.be.equal('locked')

        replaceWith = pellet.experiment.select('A=locked')
        expect(replaceWith).to.be.a('string')
        expect(replaceWith).to.be.equal('locked')

        replaceWith = pellet.experiment.select('@A@10.0.0')
        expect(replaceWith).to.be.a('function')
        expect(replaceWith).to.be.equal(B)

        replaceWith = pellet.experiment.select('A@10.0.0')
        expect(replaceWith).to.be.a('function')
        expect(replaceWith).to.be.equal(B)

        replaceWith = pellet.experiment.select('A@0.0.0')
        expect(replaceWith).to.be.a('function')
        expect(replaceWith).to.be.equal(A)

        replaceWith = pellet.experiment.select('A')
        expect(replaceWith).to.be.a('function')
        expect(replaceWith).to.be.equal(A)

        replaceWith = pellet.experiment.select('str=test')
        expect(replaceWith).to.be.a('string')
        expect(replaceWith).to.be.equal('test')

        replaceWith = pellet.experiment.select('str')
        expect(replaceWith).to.be.a('string')
        expect(replaceWith).to.be.equal('str')

      it "handle ambiguous component name vs experiment value", ->

        pellet.components = {'A@0.0.0': A, 'A': A}

        replaceWith = pellet.experiment.select('A')
        expect(replaceWith).to.be.a('function')
        expect(replaceWith).to.be.equal(A)

        replaceWith = pellet.experiment.select('=A')
        expect(replaceWith).to.be.a('string')
        expect(replaceWith).to.be.equal('A')
