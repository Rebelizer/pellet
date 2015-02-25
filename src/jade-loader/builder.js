'use strict';

/**
 * Make a program.
 *
 * @param {Statement[]} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.program = function (body, loc) {
  return {
    type: 'Program',
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a program?
 *
 * @param {Node} node
 * @api public
 */

exports.isProgram = function (node) {
  return node && node.type === 'Program';
};

/**
 * Make an empty statement.
 *
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.emptyStatement = function (loc) {
  return {
    type: 'EmptyStatement',
    loc: loc || null
  };
};

/**
 * Is `node` a function?
 *
 * @param {Node} node
 * @api public
 */

exports.isFunction = function (node) {
  return node && node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression';
};

/**
 * Is `node` an empty statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isEmptyStatement = function (node) {
  return node && node.type === 'EmptyStatement';
};

/**
 * Make a block statement.
 *
 * @param {Statement[]} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.blockStatement = function (body, loc) {
  return {
    type: 'BlockStatement',
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a block statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isBlockStatement = function (node) {
  return node && node.type === 'BlockStatement';
};

/**
 * Make an expression statement.
 *
 * @param {Statement} expr
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.expressionStatement = function (expr, loc) {
  return {
    type: 'ExpressionStatement',
    expression: expr,
    loc: loc || null
  };
};

/**
 * Is `node` an expression statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isExpressionStatement = function (node) {
  return node && node.type === 'ExpressionStatement';
};

/**
 * Make a labeled statement.
 *
 * @param {Identifier} label
 * @param {Statement} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.labeledStatement = function (label, body, loc) {
  return {
    type: 'LabeledStatement',
    label: label,
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a labeled statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isLabeledStatement = function (node) {
  return node && node.type === 'LabeledStatement';
};

/**
 * Make an if statement.
 *
 * @param {Expression} test
 * @param {Statement} cons
 * @param {Statement} alt
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.ifStatement = function (test, cons, alt, loc) {
  return {
    type: 'IfStatement',
    test: test,
    consequent: cons,
    alternate: alt || null,
    loc: loc || null
  };
};

/**
 * Is `node` an if statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isIfStatement = function (node) {
  return node && node.type === 'IfStatement';
};

/**
 * Make a switch statement.
 *
 * @param {Expression} disc
 * @param {SwitchCase[]} cases
 * @param {Boolean} isLexical
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.switchStatement = function (disc, cases, isLexical, loc) {
  return {
    type: 'SwitchStatement',
    discriminant: disc,
    cases: cases,
    lexical: isLexical,
    loc: loc || null
  };
};

/**
 * Is `node` a switch statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isSwitchStatement = function (node) {
  return node && node.type === 'SwitchStatement';
};

/**
 * Make a switch case.
 *
 * @param {Expression} test
 * @param {Statement[]} cons
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.switchCase = function (test, cons, loc) {
  return {
    type: 'SwitchCase',
    test: test || null,
    consequent: cons || [],
    loc: loc || null
  };
};

/**
 * Is `node` a switch case?
 *
 * @param {Node} node
 * @api public
 */

exports.isSwitchCase = function (node) {
  return node && node.type === 'SwitchCase';
};

/**
 * Make a while statement.
 *
 * @param {Expression} test
 * @param {Statement[]} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.whileStatement = function (test, body, loc) {
  return {
    type: 'WhileStatement',
    test: test,
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a while statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isWhileStatement = function (node) {
  return node && node.type === 'WhileStatement';
};

/**
 * Make a do/while statement.
 *
 * @param {Expression} test
 * @param {Statement[]} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.doWhileStatement = function (body, test, loc) {
  return {
    type: 'DoWhileStatement',
    body: body,
    test: test,
    loc: loc || null
  };
};

/**
 * Is `node` a do/while statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isDoWhileStatement = function (node) {
  return node && node.type === 'DoWhileStatement';
};

/**
 * Make a for statement.
 *
 * @param {VariableDeclaration|Expression|null} init
 * @param {Expression|null} test
 * @param {Expression|null} update
 * @param {Statement} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.forStatement = function (init, test, update, body, loc) {
  return {
    type: 'ForStatement',
    init: init || null,
    test: test || null,
    update: update || null,
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a for statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isForStatement = function (node) {
  return node && node.type === 'ForStatement';
};

/**
 * Make a for/in statement.
 *
 * @param {VariableDeclaration|Expression} left
 * @param {Expression} right
 * @param {Statement} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.forInStatement = function (left, right, body, loc) {
  return {
    type: 'ForInStatement',
    left: left,
    right: right,
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a for/in statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isForInStatement = function (node) {
  return node && node.type === 'ForInStatement';
};

/**
 * Make a break statement.
 *
 * @param {Identifier} label
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.breakStatement = function (label, loc) {
  return {
    type: 'BreakStatement',
    label: label || null,
    loc: loc || null
  };
};

/**
 * Is `node` a break statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isBreakStatement = function (node) {
  return node && node.type === 'BreakStatement';
};

/**
 * Make a continue statement.
 *
 * @param {Identifier} label
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.continueStatement = function (label, loc) {
  return {
    type: 'ContinueStatement',
    label: label || null,
    loc: loc || null
  };
};

/**
 * Is `node` a continue statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isContinueStatement = function (node) {
  return node && node.type === 'ContinueStatement';
};

/**
 * Make a with statement.
 *
 * @param {Expression} obj
 * @param {Statement} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.withStatement = function (obj, body, loc) {
  return {
    type: 'WithStatement',
    object: obj,
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a with statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isWithStatement = function (node) {
  return node && node.type === 'WithStatement';
};

/**
 * Make a return statement.
 *
 * @param {Expression} arg
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.returnStatement = function (arg, loc) {
  return {
    type: 'ReturnStatement',
    argument: arg,
    loc: loc || null
  };
};

/**
 * Is `node` a return statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isReturnStatement = function (node) {
  return node && node.type === 'ReturnStatement';
};

/**
 * Make a try statement.
 *
 * @param {Statement} body
 * @param {CatchClause} handler
 * @param {Statement} fin
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.tryStatement = function (body, handler, fin, loc) {
  return {
    type: 'TryStatement',
    body: body,
    handler: handler,
    finalizer: fin,
    loc: loc || null
  };
};

/**
 * Is `node` a try statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isTryStatement = function (node) {
  return node && node.type === 'TryStatement';
};

/**
 * Make a catch clause.
 *
 * @param {Identifier} arg
 * @param {Statement} body
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.catchClause = function (arg, body, loc) {
  return {
    type: 'CatchClause',
    param: arg,
    body: body,
    loc: loc || null
  };
};

/**
 * Is `node` a catch clause?
 *
 * @param {Node} node
 * @api public
 */

exports.isCatchClause = function (node) {
  return node && node.type === 'CatchClause';
};

/**
 * Make a throw statement.
 *
 * @param {Expression} arg
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.throwStatement = function (arg, loc) {
  return {
    type: 'ThrowStatement',
    argument: arg,
    loc: loc || null
  };
};

/**
 * Is `node` a throw statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isThrowStatement = function (node) {
  return node && node.type === 'ThrowStatement';
};

/**
 * Make a debugger statement.
 *
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.debuggerStatement = function (loc) {
  return {
    type: 'DebuggerStatement',
    loc: loc || null
  };
};

/**
 * Is `node` a debugger statement?
 *
 * @param {Node} node
 * @api public
 */

exports.isDebuggerStatement = function (node) {
  return node && node.type === 'DebuggerStatement';
};

/**
 * Make a function declaration.
 *
 * @param {String} name
 * @param {Identifier[]} args
 * @param {Statement|Expression} body
 * @param {Boolean} isGenerator
 * @param {Boolean} isExpression
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.functionDeclaration = function (name, args, body, isGenerator, isExpression, loc) {
  return {
    type: 'FunctionDeclaration',
    id: name,
    params: args,
    body: body,
    generator: isGenerator,
    expression: isExpression,
    loc: loc || null
  };
};

/**
 * Is `node` a function declaration?
 *
 * @param {Node} node
 * @api public
 */

exports.isFunctionDeclaration = function (node) {
  return node && node.type === 'FunctionDeclaration';
};

/**
 * Make a variable declaration.
 *
 * @param {"const" | "let" | "var"} [kind="var"]
 * @param {Declarator[]} dtor
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.variableDeclaration = function (kind, dtors, loc) {
  if (typeof kind !== 'string') loc = dtors, dtors = kind, kind = 'var';
  return {
    type: 'VariableDeclaration',
    declarations: dtors,
    kind: kind,
    loc: loc || null
  };
};

/**
 * Is `node` a variable declaration?
 *
 * @param {Node} node
 * @api public
 */

exports.isVariableDeclaration = function (node) {
  return node && node.type === 'VariableDeclaration';
};

/**
 * Make a variable declarator.
 *
 * @param {Identifier} name
 * @param {Expression|null} init
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.variableDeclarator = function (name, init, loc) {
  return {
    type: 'VariableDeclarator',
    id: name,
    init: init || null,
    loc: loc || null
  };
};

/**
 * Is `node` a variable declarator?
 *
 * @param {Node} node
 * @api public
 */

exports.isVariableDeclarator = function (node) {
  return node && node.type === 'VariableDeclarator';
};

/**
 * Make a sequence expression.
 *
 * @param {Expressions[]} exprs
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.sequenceExpression = function (exprs, loc) {
  return {
    type: 'SequenceExpression',
    expressions: exprs,
    loc: loc || null
  };
};

/**
 * Is `node` a sequence expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isSequenceExpression = function (node) {
  return node && node.type === 'SequenceExpression';
};

/**
 * Make a conditional expression.
 *
 * @param {Expression} test
 * @param {Expression} cons
 * @param {Expression} alt
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.conditionalExpression = function (test, cons, alt, loc) {
  return {
    type: 'ConditionalExpression',
    test: test,
    consequent: cons,
    alternate: alt || null,
    loc: loc || null
  };
};

/**
 * Is `node` a conditional expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isConditionalExpression = function (node) {
  return node && node.type === 'ConditionalExpression';
};

/**
 * Make a unary expression.
 *
 * @param {UnaryOperator} op
 * @param {Expression} arg
 * @param {Boolean} isPrefix
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.unaryExpression = function (op, arg, isPrefix, loc) {
  return {
    type: 'UnaryExpression',
    operator: op,
    prefix: isPrefix,
    argument: arg,
    loc: loc || null
  };
};

/**
 * Is `node` a unary expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isUnaryExpression = function (node) {
  return node && node.type === 'UnaryExpression';
};

/**
 * Make a binary expression.
 *
 * @param {BinaryOperator} op
 * @param {Expression} left
 * @param {Expression} right
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.binaryExpression = function (op, left, right, loc) {
  return {
    type: 'BinaryExpression',
    operator: op,
    left: left,
    right: right,
    loc: loc || null
  };
};

/**
 * Is `node` a binary expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isBinaryExpression = function (node) {
  return node && node.type === 'BinaryExpression';
};

/**
 * Make an assignment expression.
 *
 * @param {AssignmentOperator} op
 * @param {Expression} left
 * @param {Expression} right
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.assignmentExpression = function (op, left, right, loc) {
  return {
    type: 'AssignmentExpression',
    operator: op,
    left: left,
    right: right,
    loc: loc || null
  };
};

/**
 * Is `node` an assignment expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isAssignmentExpression = function (node) {
  return node && node.type === 'AssignmentExpression';
};

/**
 * Make a logical expression.
 *
 * @param {LogicalOperator} op
 * @param {Expression} left
 * @param {Expression} right
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.logicalExpression = function (op, left, right, loc) {
  return {
    type: 'LogicalExpression',
    operator: op,
    left: left,
    right: right,
    loc: loc || null
  };
};

/**
 * Is `node` a logical expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isLogicalExpression = function (node) {
  return node && node.type === 'LogicalExpression';
};

/**
 * Make an update expression.
 *
 * @param {UpdateOperator} op
 * @param {Expression} arg
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.updateExpression = function (op, arg, isPrefix, loc) {
  return {
    type: 'UpdateExpression',
    operator: op,
    argument: right,
    loc: loc || null
  };
};

/**
 * Is `node` an update expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isUpdateExpression = function (node) {
  return node && node.type === 'UpdateExpression';
};

/**
 * Make a new expression.
 *
 * @param {Expression} callee
 * @param {Expression[]} args
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.newExpression = function (callee, args, loc) {
  return {
    type: 'NewExpression',
    callee: callee,
    arguments: args,
    loc: loc || null
  };
};

/**
 * Is `node` a new expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isNewExpression = function (node) {
  return node && node.type === 'NewExpression';
};

/**
 * Make a call expression.
 *
 * @param {Expression} callee
 * @param {Expression[]} args
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.callExpression = function (callee, args, loc) {
  return {
    type: 'CallExpression',
    callee: callee,
    arguments: args,
    loc: loc || null
  };
};

/**
 * Is `node` a call expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isCallExpression = function (node) {
  return node && node.type === 'CallExpression';
};

/**
 * Make a member expression.
 *
 * @param {Expression} obj
 * @param {Identifier|Expression} prop
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.memberExpression = function (obj, prop, isComputed, loc) {
  return {
    type: 'MemberExpression',
    object: obj,
    property: prop,
    computed: isComputed != null ? isComputed : !exports.isIdentifier(prop),
    loc: loc || null
  };
};

/**
 * Is `node` a member expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isMemberExpression = function (node) {
  return node && node.type === 'MemberExpression';
};

/**
 * Make a function expression.
 *
 * @param {Identifier|null} name
 * @param {Identifier[]} args
 * @param {Statement|Expression} body
 * @param {Boolean} isGenerator
 * @param {Boolean} isExpression
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.functionExpression = function (name, args, body, isGenerator, isExpression, loc) {
  return {
    type: 'FunctionExpression',
    id: name || null,
    params: args || [],
    body: body,
    generator: isGenerator != null ? isGenerator : false,
    expression: isExpression != null ? isExpression : false,
    loc: loc || null
  };
};

/**
 * Is `node` a function expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isFunctionExpression = function (node) {
  return node && node.type === 'FunctionExpression';
};

/**
 * Make an array expression.
 *
 * @param {Expression[]} elts
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.arrayExpression = function (elts, loc) {
  return {
    type: 'ArrayExpression',
    elements: elts,
    loc: loc || null
  };
};

/**
 * Is `node` an array expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isArrayExpression = function (node) {
  return node && node.type === 'ArrayExpression';
};

/**
 * Make an object expression.
 *
 * @param {Expression[]} props
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.objectExpression = function (props, loc) {
  return {
    type: 'ObjectExpression',
    properties: props || [],
    loc: loc || null
  };
};

/**
 * Is `node` an object expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isObjectExpression = function (node) {
  return node && node.type === 'ObjectExpression';
};

/**
 * Make a property.
 *
 * @param {"init" | "get" | "set"} [kind]
 * @param {Literal | Identifier} key
 * @param {Expression} val
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.property = function (kind, key, val, loc) {
  if (typeof kind !== 'string') {
    loc = val, val = key, key = kind, kind = 'init';
  }
  return {
    type: 'Property',
    kind: kind,
    key: key,
    value: val,
    loc: loc || null
  };
};

/**
 * Is `node` a property?
 *
 * @param {Node} node
 * @api public
 */

exports.isProperty = function (node) {
  return node && node.type === 'Property';
};

/**
 * Make a this expression.
 *
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.thisExpression = function (loc) {
  return {
    type: 'ThisExpression',
    loc: loc || null
  };
};

/**
 * Is `node` a this expression?
 *
 * @param {Node} node
 * @api public
 */

exports.isThisExpression = function (node) {
  return node && node.type === 'ThisExpression';
};

/**
 * Make an identifier.
 *
 * @param {String} name
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.identifier = function (name, loc) {
  return {
    type: 'Identifier',
    name: name,
    loc: loc || null
  };
};

/**
 * Is `node` an identifier?
 *
 * @param {Node} node
 * @api public
 */

exports.isIdentifier = function (node) {
  return node && node.type === 'Identifier';
};

/**
 * Make a literal.
 *
 * @param {string | boolean | null | number | RegExp} val
 * @param {SourceLocation} [loc]
 * @api public
 */

exports.literal = function (val, loc) {
  return {
    type: 'Literal',
    value: val,
    loc: loc || null
  };
};

/**
 * Is `node` a literal?
 *
 * @param {Node} node
 * @param {"string" | "boolean" | "null" | "number" | "RegExp" | null} type
 * @api public
 */

exports.isLiteral = function (node, type) {
  return node && node.type === 'Literal' && (
    type == null || typeof node.value === type ||
    type === 'null' && node.value == null ||
    type === 'RegExp' && node.value instanceof RegExp);
};

/**
 * Is `node` `undefined`?
 *
 * @param {Node} node
 * @api public
 */

exports.isUndefined = function (node) {
  return node && node.type === 'Identifier' && node.name == 'undefined';
};

/**
 * Is `node` `null` or `undefined`?
 *
 * @param {Node} node
 * @api public
 */

exports.isEmpty = function (node) {
  return exports.isUndefined(node) || exports.isLiteral(node, 'null');
};
