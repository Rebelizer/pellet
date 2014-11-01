
var esprima = require('esprima');
var escodegen = require('escodegen');
var parseJSExpression = require('character-parser').parseMax;
var Rectifier = require('./rectifier');
var UglifyJS = require('uglify-js');
var b = require('./builder');

/**
 * Initialize `Compiler` with the given `token` and `options`.
 *
 * @param {Node} node
 * @param {Object} [options]
 * @api public
 */

var Compiler = module.exports = function Compiler (node, options) {
  this.visit = this.visit.bind(this)
  this.options = options = options || {};
  this.node = node;
};

/**
 * Compiler prototype.
 */

Compiler.prototype = {

  /**
   * Compressor.
   *
   * @api public
   */

  compressor: new UglifyJS.Compressor({
    booleans: false,
    dead_code: false,
    hoist_vars: true,
    sequences: false,
    side_effects: false,
    unused: false,
    warnings: false
  }),

  /**
   * Compile parse tree to JavaScript.
   *
   * @api public
   */

  compile: function () {
    if (!this.buf) this.generate();
    if (!this.ast) this.rectify();
    if (!this.ugly) this.uglify();

    var js = this.ugly.print_to_string({
      beautify: true,
      indent_level: 2
    });

    return [js].concat(this.helpers).join('\n');
  },

  /**
   * Generate intermediate JavaScript.
   *
   * @api public
   */

  generate: function () {
    this.buf = '';
    this.helpers = [];
    this.depth = -1;
    this.visit(this.node);
  },

  /**
   * Transform intermediate JavaScript.
   *
   * @api public
   */

  rectify: function () {
    this.ast = esprima.parse(this.buf);
    var rectifier = new this.rectifier(this.ast);
    this.ast = rectifier.rectify();
  },

  /**
   * Rectifier class.
   *
   * @api public
   */

  rectifier: Rectifier,

  /**
   * Convert to UglifyJS AST and compress.
   *
   * @api public
   */

  uglify: function () {
    this.ugly = UglifyJS.AST_Node.from_mozilla_ast(this.ast);
    this.ugly.figure_out_scope();
    this.ugly = this.ugly.transform(this.compressor);
  },

  /**
   * Interpolate the given `str`.
   *
   * @param {String} str
   * @api public
   */

  interpolate: function (str) {
    var match;
    var range;
    var src;

    var result = [];
    var buf = '""';

    if (str.val != null) str = str.val;
    if (str === '') return [this.text('""')];

    while (str && (match = /(\\)?([#!]){((?:.|\n)*)$$/.exec(str))) {
      buf += ' + ' + JSON.stringify(str.substr(0, match.index));
      str = match[3];

      if (match[1]) { // escape
        buf += ' + ' + JSON.stringify(match[2] + '{');
        continue;
      }

      range = parseJSExpression(str);
      src = range.src;

      if (match[2] === '!') {
        if (buf) result.push(this.text(buf)), buf = '""';
        result.push(this.unescape(src));
      } else {
        buf += ' + ' + src;
      }

      str = str.substr(range.end + 1);
    }

    if (str) buf += ' + ' + JSON.stringify(str);
    if (buf !== '""') result.push(this.text(buf));

    return result;
  },

  /**
   * Wrap the given `str` around a text sentinel.
   *
   * @param {AST_Node} node
   * @api public
   */

  text: function (str) {
    return 'ǃtext＿(' + str + ')';
  },

  /**
   * Wrap the given `str` around an unescape sentinel.
   *
   * @param {AST_Node} node
   * @api public
   */

  unescape: function (str) {
    return 'ǃunescape＿(' + str + ')';
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visit: function (node) {
    this.depth++;
    this['visit' + node.type](node);
    this.depth--;
  },

  /**
   * Visit case `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitCase: function (node) {
    throw new Error('not supported');
    this.buf += 'switch(' + node.expr + '){\n';
    this.visit(node.block);
    this.buf += '}\n';
  },

  /**
   * Visit when `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitWhen: function (node, start) {
    if (node.expr === 'default') {
      this.buf += 'default:\n';
    } else {
      this.buf += 'case ' + node.expr + ':\n';
    }
    if (node.block) {
      this.visit(node.block);
      this.buf += 'break;\n';
    }
  },

  /**
   * Visit literal `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitLiteral: function (node) {
    this.buf += this.text(JSON.stringify(node.str)) + '\n';
  },

  /**
   * Visit all nodes in `block`.
   *
   * @param {Block} block
   * @api public
   */

  visitBlock: function (block, start) {
    block.nodes.forEach(this.visit);
  },

  /**
   * Visit a mixin's `block` keyword.
   *
   * @param {MixinBlock} block
   * @api public
   */

  visitMixinBlock: function (block) {
    this.buf += 'block ? block() : null;\n';
  },

  /**
   * Visit `doctype`.
   *
   * @param {Doctype} doctype
   * @api public
   */

  visitDoctype: function () {
    throw new Error('not supported');
  },

  /**
   * Visit `mixin`, generating a function that
   * may be called within the template.
   *
   * @param {Mixin} mixin
   * @api public
   */

  visitMixin: function (mixin) {
    throw new Error('not implemented');
  },

  /**
   * Visit `tag`, translate the tag name, generate attributes, and
   * visit the `tag`'s code and block.
   *
   * @param {Tag} tag
   * @api public
   */

  visitTag: function (tag) {
    var name = tag.name;

    this.buf += 'ǃDOM＿(' + name + ',';
    this.visitAttributes(tag.attrs, tag.attributeBlocks);
    this.buf += ');\n{\n';

    if (tag.code) this.visitCode(tag.code);
    this.visit(tag.block);
    this.buf += '}\n';
  },

  /**
   * Visit `filter`, throwing when the filter does not exist.
   *
   * @param {Filter} filter
   * @api public
   */

  visitFilter: function (filter) {
    throw new Error('not implemented');
  },

  /**
   * Visit `text` node.
   *
   * @param {Text} text
   * @api public
   */

  visitText: function (text) {
    this.interpolate(text).forEach(function (str) {
      this.buf += str + ';\n';
    }.bind(this));
  },

  /**
   * Visit a `comment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitComment: function (comment) {
    if (comment.buffer) this.buf += '//' + comment.val + '\n';
  },

  /**
   * Visit a `BlockComment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitBlockComment: function (comment) {
    if (!comment.buffer) return;
    this.buf += '/*' + comment.val + '\n';
    this.visit(comment.block);
    this.buf += '*/\n';
  },

  /**
   * Visit `code`, respecting buffer / escape flags.
   * If the code is followed by a block, wrap it in
   * a self-calling function.
   *
   * @param {Code} code
   * @api public
   */

  visitCode: function (code, start) {
    // Wrap code blocks with {}.
    // we only wrap unbuffered code blocks ATM
    // since they are usually flow control

    // Buffer code
    if (code.buffer) {
      if (code.escape) {
        this.buf += 'ǃtext＿(' + code.val + ');\n';
      } else {
        this.buf += this.unescape(code.val) + ';\n';
      }
    } else {
      this.buf += code.val + '\n';
    }

    // Block support
    if (code.block) {
      if (!code.buffer) this.buf += '{\n';
      this.visit(code.block);
      if (!code.buffer) this.buf += '}\n';
    }
  },

  /**
   * Visit `each` block.
   *
   * @param {Each} each
   * @api public
   */

  visitEach: function (each, start) {
    if (!this.hasEachHelper) {
      this.helpers.push(ǃmap＿.toString());
      this.hasEachHelper = true;
    }

    this.buf += 'ǃmap＿(' + each.obj + ', function(';
    this.buf += each.val + ', ' + each.key + '){\n';
    this.visit(each.block);
    this.buf += '\n}';

    if (each.alternative) {
      this.buf += ', function(){\n';
      this.visit(each.alternative);
      this.buf += '\n}';
    }

    this.buf += '\n);';
  },

  /**
   * Visit `attrs`.
   *
   * @param {Array} attrs
   * @api public
   */

  visitAttributes: function (attrs, attributeBlocks) {
    if (attributeBlocks.length) {
      if (attrs.length) {
        var val = this.attrs(attrs);
        attributeBlocks.unshift(val);
      }
      if (!this.hasAttrsHelper) {
        this.helpers.push(ǃattrs＿.toString());
        this.hasAttrsHelper = true;
      }
      if (!this.hasClassHelper) {
        this.helpers.push(ǃclass＿.toString());
        this.hasClassHelper = true;
      }
      this.buf += 'ǃattrs＿(' + attributeBlocks.join(',') + ')';
    } else if (attrs.length) {
      this.attrs(attrs, true);
    } else {
      this.buf += 'null'
    }
  },

  /**
   * Compile attributes.
   */

  attrs: function (attrs, buffer) {
    var classes = [];
    var buf = [];
    var ast;

    attrs.forEach(function (attr) {
      if (!attr.escaped) {
        //console.warn('WARNING: unescaped attributes not supported');
      }

      var key = attr.name;
      var val = attr.val;

      switch (key) {
        case 'class':
          ast = esprima.parse(val).body[0].expression;
          if (b.isArrayExpression(ast)) {
            classes = classes.concat(
              ast.elements.map(escodegen.generate).map(function (it) {
                return 'ǃclass＿(' + it + ')';
              }));
          } else if (b.isLiteral(ast)) {
            if (ast.value == null || ast.value === '') return;
            classes.push(val);
          } else {
            if (!this.hasClassHelper) {
              this.helpers.push(ǃclass＿.toString());
              this.hasClassHelper = true;
            }
            classes.push('ǃclass＿(' + val + ')');
          }
          return;
        case 'for':
          key = 'htmlFor';
          break;
        default:
          if (key.indexOf('data-') === 0) {
            if (val == null || val === 'null') return;
            break;
          }
          if (key.indexOf('aria-') === 0) break;
          key = key.split('-');
          key = key[0] + key.slice(1).map(function (it) {
            return it[0].toUpperCase() + it.substr(1);
          }).join('');
      }

      buf.push(JSON.stringify(key) + ':' + val);
    }.bind(this));

    if (classes.length) buf.push('className:' + classes.join(' + " " + '));

    buf = '{' + buf.join(',') + '}';
    if (buffer) this.buf += buf;
    return buf;
  }

};

function ǃattrs＿ () {
  var classes = [];
  var attrs = {};
  [].slice.call(arguments).forEach(function (it) {
    for (var key in it) {
      var val = it[key];
      switch (key) {
        case 'class':
        case 'className':
          classes.push(val);
          return;
        case 'for':
          key = 'htmlFor';
          break;
        default:
          if (key.indexOf('data-') === 0) {
            if (val == null) return;
            val = JSON.stringify(val);
            break;
          }
          if (key.indexOf('aria-') === 0) break;
          key = key.split('-');
          key = key[0] + key.slice(1).map(function (it) {
            return it.charAt(0).toUpperCase() + it.substr(1);
          }).join('');
      }
      attrs[key] = val;
    }
  });
  if (classes.length) attrs.className = ǃclass＿.apply(null, classes);
  return attrs;
}

function ǃclass＿ () {
  return [].slice.call(arguments).reduce(function (args, it) {
    if (it == null || it === '') {
      return args;
    } if (typeof it.length === 'number') {
      return args.concat(it);
    } else {
      return args.push(it), args;
    }
  }, []).join(' ');
}

function ǃmap＿ (obj, each, alt) {
  var result = [], key;
  if (typeof obj.length === 'number') {
    result = [].map.call(obj, each);
  } else {
    for (key in obj) result.push(each(obj[key], key));
  }
  return result.length ? result : alt && alt();
}
