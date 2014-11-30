#mocha --compilers coffee:coffee-script test/route.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

isomorphicConstructionContext = require "../src/isomorphic/construction-context.js"

describe "Isomorphic Context", ->
    describe "namespace", ->
        it "ignore empty namespace switching", ->
            container = new isomorphicConstructionContext()
            childContainer = container.namespace()

            expect(childContainer).to.equal(container)

            childContainer = container.namespace('')
            expect(childContainer).to.equal(container)

            childContainer = container.namespace(null)
            expect(childContainer).to.equal(container)

            childContainer = container.namespace(false)
            expect(childContainer).to.equal(container)
        it "can create child namespaces", ->

            # make sure the namespace does not change any of the parent value
            # make sure the parentContext is updated and our path is correct now
            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")
            childChildContainer = childContainer.namespace("sub-ns2")

            expect(container.parentContext).to.be.null
            expect(container.insertAt).equal("")
            expect(container.insertNode.key).to.be.false

            expect(childContainer).not.equal(container)
            expect(childContainer.parentContext).equal(container)
            expect(childContainer.insertAt).equal("ns1")
            expect(childContainer.insertNode.key).equal("ns1")
            expect(childContainer.insertNode.head).eql({})
            expect(childContainer.insertNode.root).eql({})
            expect(childContainer.insertNode.head).not.equal(container.insertNode.head)
            expect(childContainer.insertNode.root).not.equal(container.insertNode.root)

            expect(childChildContainer).not.equal(container)
            expect(childChildContainer).not.equal(childContainer)
            expect(childChildContainer.parentContext).equal(childContainer)
            expect(childChildContainer.insertAt).equal("ns1.sub-ns2")
            expect(childChildContainer.insertNode.key).equal("sub-ns2")
            expect(childChildContainer.insertNode.head).eql({})
            expect(childChildContainer.insertNode.root).eql({ns1:{}})
            expect(childChildContainer.insertNode.head).not.equal(childContainer.insertNode.head)
            expect(childChildContainer.insertNode.root).not.equal(childContainer.insertNode.root)
            expect(childChildContainer.insertNode.head).not.equal(container.insertNode.head)
            expect(childChildContainer.insertNode.root).not.equal(container.insertNode.root)

        it "can create merge objects using current namespace", ->
            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")
            childChildContainer = childContainer.namespace("sub-ns2")
            childChildChildContainer = childChildContainer.namespace("sub-ns3")

            expect(container.buildMergeObjFromNamespace({test:true})).eql({test:true})
            expect(childContainer.buildMergeObjFromNamespace({test:true})).eql({ns1:{test:true}})
            expect(childChildContainer.buildMergeObjFromNamespace({test:true})).eql({ns1:{"sub-ns2":{test:true}}})
            expect(childChildChildContainer.buildMergeObjFromNamespace({test:true})).eql({ns1:{"sub-ns2":{"sub-ns3":{test:true}}}})

            expect(container.insertAt).equal("")
            expect(container.insertNode.key).to.be.false
            expect(container.insertNode.head).eql({})
            expect(container.insertNode.root).eql({})

            expect(childContainer.insertAt).equal("ns1")
            expect(childContainer.insertNode.key).equal("ns1")
            expect(childContainer.insertNode.head).eql({ns1:{test:true}})
            expect(childContainer.insertNode.root).eql({ns1:{test:true}})

            expect(childChildContainer.insertAt).equal("ns1.sub-ns2")
            expect(childChildContainer.insertNode.key).equal("sub-ns2")
            expect(childChildContainer.insertNode.head).eql({"sub-ns2":{test:true}})
            expect(childChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{test:true}}})

            expect(childChildChildContainer.insertAt).equal("ns1.sub-ns2.sub-ns3")
            expect(childChildChildContainer.insertNode.key).equal("sub-ns3")
            expect(childChildChildContainer.insertNode.head).eql({"sub-ns3":{test:true}})
            expect(childChildChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{"sub-ns3":{test:true}}}})

        it "empty merge objects", ->
            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")
            childChildContainer = childContainer.namespace("sub-ns2")

            # todo: think if we want root node getting empty values?

            expect(container.buildMergeObjFromNamespace({})).eql({})
            expect(childContainer.buildMergeObjFromNamespace({})).eql({ns1:{}})
            expect(childChildContainer.buildMergeObjFromNamespace({})).eql({ns1:{"sub-ns2":{}}})

            expect(container.buildMergeObjFromNamespace()).to.be.undefined
            expect(childContainer.buildMergeObjFromNamespace()).eql({ns1:undefined})
            expect(childChildContainer.buildMergeObjFromNamespace()).eql({ns1:{"sub-ns2":undefined}})

            expect(container.buildMergeObjFromNamespace(false)).eql(false)
            expect(childContainer.buildMergeObjFromNamespace(false)).eql({ns1:false})
            expect(childChildContainer.buildMergeObjFromNamespace(false)).eql({ns1:{"sub-ns2":false}})

        it "merge all primitive types", ->
            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")
            childChildContainer = childContainer.namespace("sub-ns2")

            expect(container.buildMergeObjFromNamespace({num:1, str:'str', _null:null, bool:true})).eql({num:1, str:'str', _null:null, bool:true})
            expect(childContainer.buildMergeObjFromNamespace({num:1, str:'str', _null:null, bool:true})).eql({ns1:{num:1, str:'str', _null:null, bool:true}})
            expect(childChildContainer.buildMergeObjFromNamespace({num:1, str:'str', _null:null, bool:true})).eql({ns1:{"sub-ns2":{num:1, str:'str', _null:null, bool:true}}})

            container = new isomorphicConstructionContext()

            container.setProps({num:1, str:'str', _null:null, bool:true})
            expect(container.props).eql({num:1, str:'str', _null:null, bool:true})

            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")

            childContainer.setProps({num:1, str:'str', _null:null, bool:true})
            expect(container.props).eql({ns1:{num:1, str:'str', _null:null, bool:true}})

            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")
            childChildContainer = childContainer.namespace("sub-ns2")

            childChildContainer.setProps({num:1, str:'str', _null:null, bool:true})
            expect(container.props).eql({ns1:{"sub-ns2":{num:1, str:'str', _null:null, bool:true}}})

        it "merge objects always clean up after themselves", ->
            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")
            childChildContainer = childContainer.namespace("sub-ns2")
            childChildChildContainer = childChildContainer.namespace("sub-ns3")

            container.buildMergeObjFromNamespace({test:true})
            childContainer.buildMergeObjFromNamespace({test:true})
            childChildContainer.buildMergeObjFromNamespace({test:true})
            childChildChildContainer.buildMergeObjFromNamespace({test:true})

            expect(container.buildMergeObjFromNamespace({test:123})).eql({test:123})
            expect(childContainer.buildMergeObjFromNamespace({test:123})).eql({ns1:{test:123}})
            expect(childChildContainer.buildMergeObjFromNamespace({test:123})).eql({ns1:{"sub-ns2":{test:123}}})
            expect(childChildChildContainer.buildMergeObjFromNamespace({test:123})).eql({ns1:{"sub-ns2":{"sub-ns3":{test:123}}}})

            # validate we overwrote the {test:true} with out leaving stuff around
            expect(container.insertNode.head).eql({})
            expect(container.insertNode.root).eql({})
            expect(childContainer.insertNode.head).eql({"ns1":{test:123}})
            expect(childContainer.insertNode.root).eql({"ns1":{test:123}})
            expect(childChildContainer.insertNode.head).eql({"sub-ns2":{test:123}})
            expect(childChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{test:123}}})
            expect(childChildChildContainer.insertNode.head).eql({"sub-ns3":{test:123}})
            expect(childChildChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{"sub-ns3":{test:123}}}})

            # build a merge object with {test2:123} to make sure {test:123} is removed from the root & head
            expect(container.buildMergeObjFromNamespace({test2:123})).eql({test2:123})
            expect(childContainer.buildMergeObjFromNamespace({test2:123})).eql({ns1:{test2:123}})
            expect(childChildContainer.buildMergeObjFromNamespace({test2:123})).eql({ns1:{"sub-ns2":{test2:123}}})
            expect(childChildChildContainer.buildMergeObjFromNamespace({test2:123})).eql({ns1:{"sub-ns2":{"sub-ns3":{test2:123}}}})

            # validate we overwrote the {test:true} with out leaving stuff around
            expect(container.insertNode.head).eql({})
            expect(container.insertNode.root).eql({})
            expect(childContainer.insertNode.head).eql({"ns1":{test2:123}})
            expect(childContainer.insertNode.root).eql({"ns1":{test2:123}})
            expect(childChildContainer.insertNode.head).eql({"sub-ns2":{test2:123}})
            expect(childChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{test2:123}}})
            expect(childChildChildContainer.insertNode.head).eql({"sub-ns3":{test2:123}})
            expect(childChildChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{"sub-ns3":{test2:123}}}})

            expect(container.buildMergeObjFromNamespace()).to.be.undefined
            expect(childContainer.buildMergeObjFromNamespace()).eql({ns1:undefined})
            expect(childChildContainer.buildMergeObjFromNamespace()).eql({ns1:{"sub-ns2":undefined}})
            expect(childChildChildContainer.buildMergeObjFromNamespace()).eql({ns1:{"sub-ns2":{"sub-ns3":undefined}}})

            expect(container.buildMergeObjFromNamespace("test")).equal("test")
            expect(childContainer.buildMergeObjFromNamespace("test")).eql({ns1:"test"})
            expect(childChildContainer.buildMergeObjFromNamespace("test")).eql({ns1:{"sub-ns2":"test"}})
            expect(childChildChildContainer.buildMergeObjFromNamespace("test")).eql({ns1:{"sub-ns2":{"sub-ns3":"test"}}})

            # becase this is root container and merge obj is a primitive not an object
            # do not change the head/root but apply directly (that is what is returned)
            # so "test" is merge ontop of the object
            expect(container.insertNode.head).eql({})
            expect(container.insertNode.root).eql({})

            expect(childContainer.insertNode.head).eql({"ns1":"test"})
            expect(childContainer.insertNode.root).eql({"ns1":"test"})

            expect(childChildContainer.insertNode.head).eql({"sub-ns2":"test"})
            expect(childChildContainer.insertNode.root).eql({ns1:{"sub-ns2":"test"}})

            expect(childChildChildContainer.insertNode.head).eql({"sub-ns3":"test"})
            expect(childChildChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{"sub-ns3":"test"}}})

        it "merge objects allow deep objects", ->
            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")
            childChildContainer = childContainer.namespace("sub-ns2")
            childChildChildContainer = childChildContainer.namespace("sub-ns3")

            container.buildMergeObjFromNamespace({test:{a:123, b:456}})
            childContainer.buildMergeObjFromNamespace({test:{a:123, b:456}})
            childChildContainer.buildMergeObjFromNamespace({test:{a:123, b:456}})
            childChildChildContainer.buildMergeObjFromNamespace({test:{a:123, b:456}})

            container.buildMergeObjFromNamespace({test:{a:789}})
            childContainer.buildMergeObjFromNamespace({test:{a:789}})
            childChildContainer.buildMergeObjFromNamespace({test:{a:789}})
            childChildChildContainer.buildMergeObjFromNamespace({test:{a:789}})

            # validate we overwrote the {test:{a:123, b:456}} with out leaving stuff around
            expect(container.insertNode.head).eql({})
            expect(container.insertNode.root).eql({})
            expect(childContainer.insertNode.head).eql({"ns1":{test:{a:789}}})
            expect(childContainer.insertNode.root).eql({"ns1":{test:{a:789}}})
            expect(childChildContainer.insertNode.head).eql({"sub-ns2":{test:{a:789}}})
            expect(childChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{test:{a:789}}}})
            expect(childChildChildContainer.insertNode.head).eql({"sub-ns3":{test:{a:789}}})
            expect(childChildChildContainer.insertNode.root).eql({ns1:{"sub-ns2":{"sub-ns3":{test:{a:789}}}}})

    describe "set property", ->
        it "from root namespace", ->
            container = new isomorphicConstructionContext()

            container.setProps({field1:"f1"})
            container.setProps({field2:"f2"})

            expect(container.props).eql({field1:"f1", field2:"f2"})

            container.setProps({field1:false, field3:"f3"})
            container.setProps({field4:{s1:1, s2:{s3:3}}})
            expect(container.props).eql({field1:false, field2:"f2", field3:"f3", field4:{s1:1, s2:{s3:3}}})

            container.setProps({field1: undefined})
            expect(container.props).eql({field2:"f2", field3:"f3", field4:{s1:1, s2:{s3:3}}})

            expect(container.setProps.bind(container, ("test"))).to.throw("Cannot merge non objects to root namespace")
            expect(container.setProps.bind(container)).to.throw("Cannot merge non objects to root namespace")
            expect(container.setProps.bind(container, (1))).to.throw("Cannot merge non objects to root namespace")
            expect(container.setProps.bind(container, (undefined))).to.throw("Cannot merge non objects to root namespace")

        it "from child namespace", ->
            container = new isomorphicConstructionContext()
            childContainer = container.namespace("ns1")

            childContainer.setProps({field1:"f1"})

            expect(childContainer.props).eql({ns1:{field1:"f1"}});
            expect(container.props).eql({ns1:{field1:"f1"}});

            childContainer.setProps("f2")
            expect(childContainer.props).eql({ns1:"f2"});
            expect(container.props).eql({ns1:"f2"});

            childContainer.setProps({field1:"f1"})
            debugger;
            childContainer.setProps({field2:"f2"})

            expect(childContainer.props).eql({ns1:{field1:"f1", field2:"f2"}});
            expect(container.props).eql({ns1:{field1:"f1", field2:"f2"}});

            expect(childContainer.setProps.bind(childContainer, ("test"))).to.not.throw("Cannot merge non objects to root namespace")
            expect(childContainer.setProps.bind(childContainer)).to.not.throw("Cannot merge non objects to root namespace")
            expect(childContainer.setProps.bind(childContainer, (1))).to.not.throw("Cannot merge non objects to root namespace")
            expect(childContainer.setProps.bind(childContainer, (undefined))).to.not.throw("Cannot merge non objects to root namespace")

    describe "set serialize props", ->
        it "props get set also", ->
            container = new isomorphicConstructionContext()

            container.set({field1:"f1"})
            container.setProps({field2:"f2"})

            expect(container.props).eql({field1:"f1", field2:"f2"})
            expect(container.serialize).eql({field1:"f1"})
