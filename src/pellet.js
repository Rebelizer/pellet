var director = require('director');

function pellet() {
  this.readyFnQue = [];
  this.initFnQue = [];
}

/**
 * register a function to be called once pellet is ready
 * @param fn
 */
pellet.prototype.onReady = function(fn) {
  // if all ready running fire immediately with the last know err (or null if no errors)
  if(typeof(this.readyError) != 'undefined') {
    setTimeout(function() {
      fn(module.exports.readyError);
    }, 1);

    // clean up
    delete this.readyFnQue;
    return;
  }

  this.readyFnQue.push(fn);
};

/**
 * register a function needed to complete before pellet is ready
 * @param fn
 */
pellet.prototype.registerInitFn = function(fn) {
  if(this.initFnQue) {
    this.initFnQue.push(fn);
  } else {
    throw new Error('Can not register init function because already running.');
  }
};

/**
 * Called after everyone has register their load functions
 */
pellet.prototype.startInit = function() {
  if(typeof(this.readyError) != 'undefined') {
    throw new Error('Can not reinit because pellet is all ready running.');
  }

  var cbCount = this.initFnQue.length;
  function done(err) {
    if(err) {
      // console log the error and safe the most recent error
      console.error('Error init pellet because:', err.message);
      module.exports.readyError = err;
    }

    if(cbCount-- === 0) {
      // if all callback had no error set to null
      if(!module.exports.readyError) {
        module.exports.readyError = null;
      }

      var fn;
      while(fn = module.exports.readyFnQue.pop()) {
        fn(module.exports.readyError);
      }

      // clean up
      delete module.exports.initFnQue;
    }
  }

  if(cbCount === 0) {
    done(null);
    return;
  }

  // now call all init fn and wait until all done
  for(var i in this.initFnQue) {
    this.initFnQue[i](done);
  }
};

pellet.prototype.middleware = function(req, res, next) {
  next(null);
};

module.exports = new pellet();
