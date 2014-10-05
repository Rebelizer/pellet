var fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , webpack = require('webpack')
  , glob = require('glob');

var WEBPACK_FIELDS = ['component', 'assets', 'lib', 'dependencies'];

// todo: create a winston logger for pellet (budjs) and use it not console.log (let use ignore the logging if include is someone else project)

/**
 *
 * @param manifestFilePath
 * @param file file can be array or string
 * @param next
 */
function resolvePath(manifestFilePath, file, next) {

  // resolve an array of files in parallel by
  // call our self until all the files are resolved
  if(file instanceof Array) {
    var resolveAssets = [];
    async.each(file, function (file, next) {
      resolvePath(manifestFilePath, file, function (err, file) {
        if (err) {
          next(err);
        } else {
          resolveAssets.push(file);
          next(null);
        }
      });
    }, function(err) {
      next(err, err ? null:resolveAssets);
    });

    return;
  } else if(typeof(file) !== 'string') {
    return next(new Error('file must be a string or array of strings'))
  }

  // parse out loader detail using webpack loader style
  // i.e. "loader-a!loader-b!file" we will need to read loader
  // details before returning the file
  var loader = file.match(/^(.*!)?([^!]+)$/);
  if(loader) {
    file = loader[2];
    loader = loader[1];
  }

  // get the full path to the file relative to the manifest file
  var fullPath = path.resolve(path.dirname(manifestFilePath), file);
  fs.exists(fullPath, function(exists) {

    // try search node_modules if the file does not exist relative to the manifest file
    // and is not a relative path because require.resolve is relative to this file not
    // the manifests file.
    if(!exists && file[0] !== '.') {
      try {
        fullPath = require.resolve(file)
      } catch(ex) {
        console.error('Cannot find', file, 'referenced in manifest', manifestFilePath);
        return next(new Error('Cannot find file'));
      }
    }

    next(null, (loader?loader:'') + fullPath);
  });
}

/**
 * @class
 */
function manifestParser() {
  this.manifest = {};
  this.webpackEP = {};
}

/**
 *
 * @param fullPath
 * @param options
 * @param next
 */
manifestParser.prototype.load = function(fullPath, options, next) {
  var self = this;

  if(typeof options === 'function') {
    next = options;
    options = {};
  }

  fs.readFile(fullPath, function(err, data) {
    try {
      var manifest = JSON.parse(data.toString());
    } catch(err) {
      console.error('Cannot parse manifest file', fullPath, 'because:', err.message);
      return next(new Error('Cannot parse manifest file'));
    }

    self.merge(fullPath, manifest, options, next);
  });
};

/**
 *
 * @param fullPath
 * @param options
 * @param next
 */
manifestParser.prototype.save = function(fullPath, options, next) {
  var output = []
    , sortedUid = Object.keys(this.manifest).sort()
    , i;

  if(typeof options === 'function') {
    next = options;
    options = {};
  }

  if(sortedUid.length > 1) {
    for(i in sortedUid) {
      output.push(this.manifest[sortedUid[i]]);
    }

    fs.writeFile(fullPath, JSON.stringify(output, null, 2), {encoding:'utf8', flag:'w'}, next);
  } else if(sortedUid.length == 1) {
    fs.writeFile(fullPath, JSON.stringify(this.manifest[sortedUid[0]], null, 2), {encoding:'utf8', flag:'w'}, next);
  } else {
    fs.writeFile(fullPath, JSON.stringify({}), {encoding:'utf8', flag:'w'}, next);
  }
};

/**
 *
 * @param file used to resolve paths
 * @param additionalItems
 * @param options
 * @param next
 */
manifestParser.prototype.merge = function(file, additionalItems, options, next) {
  var uid, component, self = this;

  if(typeof options === 'function') {
    next = options;
    options = {};
  }

  // we always batch process so if single object
  // wrap it in an array.
  if(!(additionalItems instanceof Array)) {
    additionalItems = [additionalItems];
  }

  // make sure all required fields are valid and check if overwrite rule
  // are valid. if options.ignoreUpdatingWebpackEP update manifest directly and
  // skip running the resolveComponentPaths.
  for(var i in additionalItems) {
    component = additionalItems[i];

    // todo: validated using hapijs/joi

    if(!component.name) {
      console.error('Cannot merge', file ,'manifest because missing component name');
      return next(new Error('Component require the name field'));
    }

    // bail if we already have this component unless options.overwrite is true
    uid = component.name + '@' + (component.version||'0.0.0');
    if(this.manifest[uid] && !options.overwrite) {
      console.error('Cannot merge because component ',uid,'already exist in manifest');
      return next(new Error('Component already defined'));
    }

    if(!options.ignoreUpdatingWebpackEP) {
      component._id = uid;
    } else {
      this.manifest[uid] = component;
    }
  }

  if(options.ignoreUpdatingWebpackEP) {
    return next(null);
  }

  async.each(additionalItems, function(item, next) {
    self.resolveComponentPaths(file, item, function(err, component) {
      var i, j, field;

      if(err) {
        console.error('Cannot merge', file, 'manifest because:', err.message);
        return next(err);
      }

      // merge all webpack fields into
      for(i in WEBPACK_FIELDS) {
        field = WEBPACK_FIELDS[i];

        if(component[field]) {
          if(!self.webpackEP[field]) {
            if(typeof component[field] == 'string') {
              self.webpackEP[field] = [component[field]];
            } else if(component[field] instanceof Array) {
              self.webpackEP[field] = component[field];
            }
          } else {
            if(typeof component[field] == 'string') {
              if(self.webpackEP[field].indexOf(component[field]) == -1) {
                self.webpackEP[field].push(component[field]);
              }
            } else if(component[field] instanceof Array) {
              for(j in component[field]) {
                if(self.webpackEP[field].indexOf(component[field][j]) == -1) {
                  self.webpackEP[field].push(component[field][j]);
                }
              }
            }
          }
        }
      }

      // add the component to our manifest and cleanup _id
      // we added in the validate step above
      self.manifest[component._id] = component;
      delete component._id;

      next(null);
    });
  }, next);
};

/**
 *
 * @param manifestFilePath
 * @param component
 * @param next
 */
manifestParser.prototype.resolveComponentPaths = function(manifestFilePath, component, next) {
  var steps = [];

  function resolveComponentField(field) {
    steps.push(function(next) {
      if(component[field]) {
        resolvePath(manifestFilePath, component[field], function (err, file) {
          if (err) return next(err);

          component[field] = file;
          next(null);
        });
      } else {
        next(null);
      }
    });
  }

  for(var i in WEBPACK_FIELDS) {
    resolveComponentField(WEBPACK_FIELDS[i]);
  }

  async.parallel(steps, function(err) {
    next(err, component);
  });
};

/**
 *
 * @param manifestGlob
 * @param options
 * @param next
 */
manifestParser.prototype.buildWebpackConfig = function(manifestGlob, options, next) {
  if(typeof next === 'undefined') {
    next = options;
    options = {};
  }

  if(typeof manifestGlob == 'string') {
    manifestGlob = [manifestGlob];
  }

  if(!options.copyright) {
    options.copyright = 'Pellet v' + require('../package.json').version + '\n'+
    'https://github.com/Rebelizer/pellet\n\n'+
    'Copyright 2014 Demetrius Johnson\n'+
    'Released under the MIT license\n'+
    'https://github.com/Rebelizer/pellet/LICENSE\n\n';
  }

  if(!options.filename) {
    if(options.mode === 'production') options.filename = '[name]-[hash].js';
    else options.filename = '[name].js'
  }

  if(!options.chunkFilename) {
    if(options.mode === 'production') options.chunkFilename = '[id]-[hash].js';
    else options.chunkFilename = '[id].js'
  }

  var files = [];
  async.each(manifestGlob, function (globPattern, next) {
    glob(globPattern, function (err, fileList) {
      if (err) {
        console.error('Cannot find manifest using glob', manifestGlob, 'because:', err.message);
        return next(err);
      }
      files = files.concat(fileList);
      next();
    });

  }, function(err) {
    if (err) {
      return next(err);
    }

    var ourManifest = new manifestParser();

    for (var i in files) {
      files[i] = path.resolve(process.cwd(), files[i]);
    }

    async.each(files, function (file, next) {
      console.info('Loading and merge', file);
      ourManifest.load(file, {}, function (err) {
        if (err) {
          console.error('Cannot load', file, 'because', err.message);
          return next(err);
        }

        next(null);
      });
    }, function (err) {
      if (err) {
        console.error('Cannot load manifests file because:', err.message);
        return next(err);
      }

      // dump the webpack entry points.
      console.info('Webpack entry points:');
      console.info(JSON.stringify(ourManifest.webpackEP, null, 2)
            .replace(/\s+[{},\]]+/g, "")
            .replace(/[{\[":,]/g, ""));

      // embed the manifest details to make look up easy
      if(options.embedManifestIndex) {
        var embedFilePath = path.resolve(__dirname, options.embedManifestIndex);

        var subNode, manifestIndex = ourManifest.manifest;
        var indexScript = 'var index = {};';
        for(var ix in manifestIndex) {
          if((subNode = manifestIndex[ix])) {
            if(subNode.component) {
              indexScript += 'index["' + ix + '"] = require("' + subNode.component + '");';
            }
          }
        }

        indexScript += 'require("pellet").loadManifestComponents(index);';

        fs.outputFileSync(embedFilePath, indexScript);
        ourManifest.webpackEP.component.push(embedFilePath);
      }

      // merge in pellet into the components so its loaded and can bootstape environment
      var pelletEntryPointPath = path.resolve(__dirname, './pellet.js');
      ourManifest.webpackEP.component.push(pelletEntryPointPath);

      var config = {
        bail: true,
        cache: true,
        profile: true,
        devtool: '#inline-source-map',
        entry: ourManifest.webpackEP,
        recordsPath: path.join(path.resolve(process.cwd(), options.output || '/tmp/dist'), '_MAP.json'),
        resolve: {
          extensions: ['', '.js', '.coffee', '.jsx', '.cjsx'],
          alias: {
            pellet: pelletEntryPointPath
          }
        },
        resolveLoader: {
          root: [path.resolve(__dirname, '..', 'node_modules'), process.cwd()],
          modulesDirectories: ['node_modules', 'bower_components']
        },
        module: {
          unknownContextCritical: false,
          noParse: /\.min\.js/,
          loaders: [
            // todo: think about moving this into the config (so anyone can update it!)
            { test: /\.json/, loader: 'json' },
            { test: /\.jsx/, loader: 'jsx' },
            { test: /\.cjsx/, loader: 'coffee!cjsx' },
            { test: /\.styl$/, loader: 'style!css!autoprefixer!stylus' },
            { test: /\.less$/, loader: 'style!css!autoprefixer!less' },
            { test: /\.css$/, loader: 'style!css!autoprefixer' },
            { test: /\.coffee/, loader: 'coffee' },

            { test: /\.svg$/, loader: "url-loader?limit=100000&mimetype=image/svg+xml" },
            { test: /\.png$/, loader: 'file-loader' },
            { test: /\.jpg$/, loader: 'file-loader' }
          ]
        }
      };

      var browser = Object.create(config);
      var node = Object.create(config);

      browser.target = 'web';
      browser.output = {
        path: path.resolve(process.cwd(), options.outputBrowser || '/tmp/dist/browser'),
        publicPath: options.mountPoint,
        filename: options.filename,
        chunkFilename: options.chunkFilename,
        hashDigestLength: 8
      };

      browser.plugins = [
        new webpack.optimize.DedupePlugin(),
        //new webpack.NoErrorsPlugin(),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.SERVER_ENV': JSON.stringify(false),
          'process.env.BROWSER_ENV': JSON.stringify(true)
        }),
        new webpack.BannerPlugin(
          options.copyright +
          '\nDate: '+new Date().toJSON()
        )
      ];

      node.target = 'node';
      node.node = {
        __dirname: true,
        __filename: true
      };

      node.output = {
        path: path.resolve(process.cwd(), options.outputNode || '/tmp/dist/node'),
        filename: options.filename,
        chunkFilename: options.chunkFilename,
        hashDigestLength: 8,
        libraryTarget:'commonjs2'
      };

      node.plugins = [
        new webpack.optimize.DedupePlugin(),
        //new webpack.NoErrorsPlugin(),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.SERVER_ENV': JSON.stringify(true),
          'process.env.BROWSER_ENV': JSON.stringify(false)
        }),
        new webpack.BannerPlugin(
            options.copyright +
            '\nDate: '+new Date().toJSON()
        )
      ];

      // for the browser version change to true source maps and minify the js
      if(options.mode === 'production') {
        browser.devtool = '#source-map';

        if(!options.uglifyOptions) {
          options.uglifyOptions = {
            mangle: {},
            output: {
              indent_start  : 0,     // start indentation on every line (only when `beautify`)
              indent_level  : 4,     // indentation level (only when `beautify`)
              quote_keys    : false, // quote all keys in object literals?
              space_colon   : true,  // add a space after colon signs?
              ascii_only    : false, // output ASCII-safe? (encodes Unicode characters as ASCII)
              inline_script : false, // escape "</script"?
              width         : 80,    // informative maximum line width (for beautified output)
              max_line_len  : 32000, // maximum line length (for non-beautified output)
              beautify      : false, // (default is true) beautify output?
              source_map    : null,  // output a source map
              bracketize    : false, // use brackets every time?
              comments      : false, // output comments?
              semicolons    : true,  // use semicolons to separate statements? (otherwise, newlines)
              preamble      : null,
              comments      : /^\**!|@preserve|@license/
            },
            compress: {
              sequences     : true,  // join consecutive statemets with the “comma operator”
              properties    : true,  // optimize property access: a["foo"] → a.foo
              dead_code     : true,  // discard unreachable code
              drop_debugger : true,  // discard “debugger” statements
              unsafe        : false, // some unsafe optimizations (see below)
              conditionals  : true,  // optimize if-s and conditional expressions
              comparisons   : true,  // optimize comparisons
              evaluate      : true,  // evaluate constant expressions
              booleans      : true,  // optimize boolean expressions
              loops         : true,  // optimize loops
              unused        : false, // (default is true) drop unused variables/functions
              hoist_funs    : true,  // hoist function declarations
              hoist_vars    : false, // hoist variable declarations
              if_return     : true,  // optimize if-s followed by return/continue
              join_vars     : true,  // join var declarations
              cascade       : true,  // try to cascade `right` into `left` in sequences
              warnings      : false, // (default is true) warn about potentially dangerous optimizations/code
              negate_iife   : true,
              pure_getters  : false,
              pure_funcs    : null,
              drop_console  : true
            }
          };
        }

        browser.plugins.push(new webpack.optimize.UglifyJsPlugin(options.uglifyOptions));
      }

      //new webpack.optimize.CommonsChunkPlugin(),
      //new webpack.NoErrorsPlugin()

      next(null, {
        baseConfig: config,
        browserConfig: browser,
        nodeConfig: node
      });
    });
  });
};

module.exports = manifestParser;

// if ENV=='testing' exports manifest test functions look at rewire to do this also!