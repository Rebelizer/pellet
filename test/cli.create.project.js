var bash = require('bashful')
  , path = require('path')
  , spawn = require('child_process').spawn,
  , fs = require('fs-extra')
  , chai = require('chai')
  , expect = chai.expect
  , should = chai.should();

chai.use(require('chai-fs'));

var SCRATCh_TEST_DIR_= '/tmp/pellet_tests';

var shell = bash({
  env: process.env,
  spawn: spawn,
  write: fs.createWriteStream,
  read: fs.createReadStream,
  exists: fs.exists
});

beforeEach(function(next){
  fs.remove(SCRATCh_TEST_DIR_, next);
});

describe('CLI: create project', function(){
  describe('with no arguments', function(){
    it('should return -1 when the value is not present', function(){



    })
    it('xxxx', function(){
      //assert.equal(-1, [1,2,3].indexOf(5));
    })
  });

})
