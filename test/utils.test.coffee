#mocha --compilers coffee:coffee-script test/utils.test.coffee

chai = require "chai"
chai.should()
expect = chai.expect

utils = require "../src/utils"

describe "Utils", ->
  describe "camelcase", ->
    it "throw exception if empty", ->
      expect(utils.camelcase.bind(this)).to.throw()
      expect(utils.camelcase.bind(this, null)).to.throw()

    it "throw exception if non string", ->
      expect(utils.camelcase.bind(this, 1)).to.throw()

    it "convert strings with spaces", ->
      utils.camelcase('a b').should.be.a('string').equal('aB')
      utils.camelcase('a\tb').should.be.a('string').equal('aB')
      utils.camelcase('a\nb').should.be.a('string').equal('aB')
      utils.camelcase('a\rb').should.be.a('string').equal('aB')
      #utils.camelcase('A b').should.be.a('string').equal('aB')
      utils.camelcase('a B').should.be.a('string').equal('aB')
      utils.camelcase('a Bb Cc').should.be.a('string').equal('aBbCc')
      utils.camelcase('a   Bb   Cc').should.be.a('string').equal('aBbCc')
      utils.camelcase('abc').should.be.a('string').equal('abc')
      utils.camelcase('1234').should.be.a('string').equal('1234')
      utils.camelcase('1a2b').should.be.a('string').equal('1a2b')
    it "convert strings with out of range characters", ->
      utils.camelcase('a-b').should.be.a('string').equal('aB')
      utils.camelcase('a!b').should.be.a('string').equal('aB')
      utils.camelcase('a~b').should.be.a('string').equal('aB')
      utils.camelcase('a~b').should.be.a('string').equal('aB')
      utils.camelcase('a#!@#b').should.be.a('string').equal('aB')

  describe "merge", ->
    it "throw exception if empty", ->
      expect(utils.objectUnion.bind(this)).to.throw()

    it "throw exception if missing arguments", ->
      expect(utils.objectUnion.bind(this, null)).to.throw('both objects and result are required')
      expect(utils.objectUnion.bind(this, true, null)).to.throw('both objects and result are required')

    it "throw exception if merge objects are not of type object", ->
      out = {}
      expect(utils.objectUnion.bind(this, [{}, 'str'], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [{}, 1], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [{}, false], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [{}, undefined], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [{}, null], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, ['str'], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [1], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [false], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [undefined], out)).to.throw('cannot merge non object types')
      expect(utils.objectUnion.bind(this, [null], out)).to.throw('cannot merge non object types')

    it "should not return anything", ->
      a = {a:1}
      out = {}
      result = utils.objectUnion([a], out)
      expect(result).to.equal(undefined)

    it "can add an object", ->
      a = {a:1}
      out = {}
      utils.objectUnion([a], out)
      expect(out).to.deep.equal(a)

    it "can add an array with single object", ->
      a = {a:1}
      out = {}
      utils.objectUnion(a, out)
      expect(out).to.deep.equal(a)

    it "can add an array of objects", ->
      a = {a:1}
      b = {b:2}
      c = {c:3}
      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:1, b:2})

      out = {}
      utils.objectUnion([a, b, c], out)
      expect(out).to.deep.equal({a:1, b:2, c:3})

    it "overrite order works", ->
      a = {a:1}
      b = {a:10}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:10})

      out = {}
      utils.objectUnion([b, a], out)
      expect(out).to.deep.equal({a:1})

    it "preserver the target value (true merge)", ->
      a = {a:1}
      out = {org:'obj'}
      utils.objectUnion([a], out)
      expect(out).to.deep.equal({a:1, org:'obj'})

    it "can overrite target values", ->
      a = {a:10}
      out = {a:1, b:2}
      utils.objectUnion([a], out)
      expect(out).to.deep.equal({a:10, b:2})

    it "do not change merge arguments", ->
      bk = a = {a:10}
      out = {a:1, b:2}
      utils.objectUnion([a], out)
      expect(out).to.deep.equal({a:10, b:2})
      expect(a).to.deep.equal({a:10})
      expect(a).to.equal(bk)

    it "merge primitive types", ->
      a = {str:-1, num:-1, _null:-1, bool:-1, bool2:-1}
      b = {str:'str', num:123, _null:null, bool:true, bool2:false}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({str:'str', num:123, _null:null, bool:true, bool2:false})

      a = {aa:{str:-1, num:-1, _null:-1, bool:-1, bool2:-1}}
      b = {aa:{str:'str', num:123, _null:null, bool:true, bool2:false}, bb:{str:'str', num:123, _null:null, bool:true, bool2:false}}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({aa:{str:'str', num:123, _null:null, bool:true, bool2:false}, bb:{str:'str', num:123, _null:null, bool:true, bool2:false}})

    it "deep merge values", ->
      a = {a:1, b:2, aa:{}}
      b = {a:10, aa:{cc:'deep val'}}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:10, b:2, aa:{cc:'deep val'}})

    it "upgrade target type to object", ->
      a = {a:1}
      b = {a:{cc:'deep val'}}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:{cc:'deep val'}})

    it "blat target deep object value to flag value", ->
      a = {a:{bb:{cc:'deep val'}}}
      b = {a:'blat'}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:'blat'})

      b = {a:{bb:'blat'}}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:{bb:'blat'}})

      b = {a:{bb:'blat'}}
      c = {a:'blat C'}

      out = {}
      utils.objectUnion([a, b, c], out)
      expect(out).to.deep.equal({a:'blat C'})

    it "allow undefined values to blat target values", ->
      a = {a:1}
      b = {a:undefined}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:undefined})

    it "delete undefined values for options.delUndefined=true", ->
      a = {a:1}
      b = {a:undefined}

      out = {}
      utils.objectUnion([a, b], out, {deleteUndefined:true})
      expect(out).to.deep.equal({})

      out = {}
      utils.objectUnion([a, b], out, {deleteUndefined:false})
      expect(out).to.deep.equal({a:undefined})

    it "deep clone all values", ->
      x = {y:2}
      a = {a:1}
      b = {b:{x:x}}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:1, b:{x:{y:2}}})
      x.y = 100
      expect(out).to.deep.equal({a:1, b:{x:{y:2}}})
      expect(b).to.deep.equal({b:{x:{y:100}}})

    it "blat target array values (non clone)", ->
      a = {a:[1,2,3]}
      b = {a:'blat'}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:'blat'})

      b = {a:[10,20]}
      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:[10,20]})

      b.a.push(30)
      expect(out).to.deep.equal({a:[10,20,30]})

    it "blat target array values (non clone via options)", ->
      a = {a:[1,2,3]}
      b = {a:'blat'}

      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:0})
      expect(out).to.deep.equal({a:'blat'})

      b = {a:[10,20]}
      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:0})
      expect(out).to.deep.equal({a:[10,20]})

      b.a.push(30)
      expect(out).to.deep.equal({a:[10,20,30]})

    it "create target array values (non clone via options)", ->
      a = {a:1}
      b = {b:[10,20]}
      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:0})
      expect(out).to.deep.equal({a:1, b:[10,20]})

      b.b.push(30)
      expect(out).to.deep.equal({a:1, b:[10,20,30]})

    it "blat target array values (with clone)", ->
      a = {a:[1,2,3]}
      b = {a:'blat'}

      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:1})
      expect(out).to.deep.equal({a:'blat'})

      b = {a:[10,20]}
      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:1})
      expect(out).to.deep.equal({a:[10,20]})

      b.a.push(30)
      expect(out).to.deep.equal({a:[10,20]})
      expect(b).to.deep.equal({a:[10,20,30]})

    it "create target array values (with clone)", ->
      a = {a:1}
      b = {b:[10,20]}
      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:1})
      expect(out).to.deep.equal({a:1, b:[10,20]})

      b.b.push(30)
      expect(out).to.deep.equal({a:1, b:[10,20]})
      expect(b).to.deep.equal({b:[10,20,30]})

    it "merge target array values", ->
      a = {a:[1,2,3]}
      b = {a:[4,5]}

      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:2})
      expect(out).to.deep.equal({a:[1,2,3,4,5]})

    it "create target array values", ->
      a = {a:[1,2,3]}

      out = {}
      utils.objectUnion([a], out, {arrayCopyMode:2})
      expect(out).to.deep.equal({a:[1,2,3]})
      a.a.push(4)
      expect(out).to.deep.equal({a:[1,2,3]})
      expect(a.a).to.deep.equal([1,2,3,4])

    it "blat deep target array values (with clone)", ->
      a = {a:{b:{c:[1,2,3]}}}
      b = {a:{b:{c:[10,20]}}}
      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:1})
      expect(out).to.deep.equal({a:{b:{c:[10,20]}}})

      b.a.b.c.push(30)
      expect(out).to.deep.equal({a:{b:{c:[10,20]}}})
      expect(b).to.deep.equal({a:{b:{c:[10,20,30]}}})

    it "merge target array values with flat value", ->
      a = {a:'str'}
      b = {a:[1,2]}

      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:2})
      expect(out).to.deep.equal({a:['str',1,2]})

      a = {a:0}
      b = {a:[1,2]}

      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:2})
      expect(out).to.deep.equal({a:[0,1,2]})

      a = {a:{aa:1}}
      b = {a:[1,2]}

      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:2})
      expect(out).to.deep.equal({a:[{aa:1},1,2]})

    it "copy empty array", ->
      a = {a:'str'}
      b = {a:[]}

      out = {}
      utils.objectUnion([a, b], out, {arrayCopyMode:1})
      expect(out).to.deep.equal({a:[]})

    it "handle regex and functions", ->
      fn = ()->
      a = {a:1}
      b = {b:{regex:/test/i, key:'test'}}
      c = {c:fn}

      out = {}
      utils.objectUnion([a, b, c], out, {noneCopyTypes:[RegExp]})
      expect(out).to.deep.equal({a:1, c:fn, b:{regex:/test/i, key:'test'}})
      out.c.should.be.a('function')
      out.b.regex.should.be.instanceof(RegExp)

    it "handle date and functions", ->
      now = new Date()
      fn = ()->
      a = {a:1}
      b = {b:{date:now, key:'test'}}
      c = {c:fn}

      out = {}
      utils.objectUnion([a, b, c], out, {noneCopyTypes:[Date]})
      expect(out).to.deep.equal({a:1, c:fn, b:{date:now, key:'test'}})
      out.c.should.be.a('function')
      out.b.date.should.be.instanceof(Date)

    it "skip deep obj copy and user ref copy for leafs", ->
      x = {y:2}
      a = {a:1, aa:{a:'str1'}}
      b = {b:{x:x}, aa:{b:'str2'}}

      out = {}
      utils.objectUnion([a, b], out, {refCopy:true})
      expect(out).to.deep.equal({a:1, aa:{a:'str1', b:'str2'}, b:{x:{y:2}}})
      x.y = 100
      expect(out).to.deep.equal({a:1, aa:{a:'str1', b:'str2'}, b:{x:{y:100}}})

    it "blat regex target type", ->
      a = {a:/test/i}
      b = {a:'test'}

      out = {}
      utils.objectUnion([a, b], out)
      expect(out).to.deep.equal({a:'test'})

      out = {}
      utils.objectUnion([a, b], out, {refCopy:true})
      expect(out).to.deep.equal({a:'test'})

      #b = {a:{aa:1}}

      #out = {}
      #utils.objectUnion([a, b], out)
      #expect(out).to.deep.equal({a:{aa:1}})

      #out = {}
      #utils.objectUnion([a, b], out, {refCopy:true})
      #expect(out).to.deep.equal({a:{aa:1}})

    it "should be fast", ->
      count = 100000
      start = new Date()
      while count--
        a = {a:{aa:{bb:{cc:1}}}}
        b = {b:{y:"", u:true}, a:{aa:{i:"test"}}}
        c = {a:{aa:{bb:'haha'}}}
        out = {}
        utils.objectUnion([a, b, c], out)

      elapse = new Date() - start
      expect(elapse).to.be.at.most(800)

    it "should be fast (refCopy)", ->
      count = 100000
      start = new Date()
      while count--
        a = {a:{aa:{bb:{cc:1}}}}
        b = {b:{y:"", u:true}, a:{aa:{i:"test"}}}
        c = {a:{aa:{bb:'haha'}}}
        out = {}
        utils.objectUnion([a, b, c], out, {refCopy:true})

      elapse = new Date() - start
      expect(elapse).to.be.at.most(500)

    it "should be fast (with Array)", ->
      count = 100000
      start = new Date()
      while count--
        a = {a:{aa:{bb:{cc:1}}}}
        b = {b:{y:[1,2,3,4], u:true}, a:{aa:{i:"test"}}}
        c = {b:{y:[5]}}
        out = {}
        utils.objectUnion([a, b, c], out, {arrayCopyMode:2, refCopy:true})

      elapse = new Date() - start
      expect(elapse).to.be.at.most(500)
