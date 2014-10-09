var fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , webpack = require('webpack')
  , messageFormat = require('messageformat')
  , glob = require('glob');

var WEBPACK_FIELDS = ['component', 'assets', 'server-dependencies', 'client-dependencies'];

// todo: create a winston logger for pellet (budjs) and use it not console.log (let use ignore the logging if include is someone else project)

/**
 * helper function to merge unique fields
 *
 * @param self
 * @param component
 * @param field
 * @param targetField
 */
function mergeUniqueComponentFields(self, component, field, targetField) {
  if(targetField) {
    targetField = self[targetField];
  } else {
    targetField = self;
  }

  if(component[field]) {
    if(!targetField[field]) {
      if(typeof component[field] == 'string') {
        targetField[field] = [component[field]];
      } else if(component[field] instanceof Array) {
        targetField[field] = component[field];
      }
    } else {
      if(typeof component[field] == 'string') {
        if(targetField[field].indexOf(component[field]) == -1) {
          targetField[field].push(component[field]);
        }
      } else if(component[field] instanceof Array) {
        for(j in component[field]) {
          if(targetField[field].indexOf(component[field][j]) == -1) {
            targetField[field].push(component[field][j]);
          }
        }
      }
    }
  }

}

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
  this.translations = [];
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

    fs.outputFile(fullPath, JSON.stringify(output, null, 2), {encoding:'utf8', flag:'w'}, next);
  } else if(sortedUid.length == 1) {
    fs.outputFile(fullPath, JSON.stringify(this.manifest[sortedUid[0]], null, 2), {encoding:'utf8', flag:'w'}, next);
  } else {
    fs.outputFile(fullPath, JSON.stringify({}), {encoding:'utf8', flag:'w'}, next);
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

        mergeUniqueComponentFields(self, component, field, 'webpackEP');
      }

      mergeUniqueComponentFields(self, component, 'translations');

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

  resolveComponentField('translations');

  async.parallel(steps, function(err) {
    next(err, component);
  });
};

/**
 * build a config object that is helpfule to pass to webpack.
 *
 * This step will also build a component index (map file) and translations
 * optionaly you can skip saving this data and do it your self if you want.
 * i.e. if you have a need to handle translation or handle the lookup.
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

  if(typeof manifestGlob === 'string') {
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
      var ix;

      if (err) {
        console.error('Cannot load manifests file because:', err.message);
        return next(err);
      }

      // dump the webpack entry points.
      console.info('Webpack entry points:');
      console.info(JSON.stringify(ourManifest.webpackEP, null, 2)
        .replace(/\s+[{},\]]+/g, "")
        .replace(/[{\[":,]/g, ""));

      /*
       * build a component lookup file that can be added to our webpack, so
       * that the developer does not have to require a component, but referance
       * it via pellet.components.###.
       */

      var subNode, manifestIndex = ourManifest.manifest;
      var indexScript = 'var index = {};';
      for(ix in manifestIndex) {
        if((subNode = manifestIndex[ix])) {
          if(subNode.component) {
            indexScript += 'index["' + ix + '"] = require("' + subNode.component + '");';
          }
        }
      }

      indexScript += 'require("pellet").loadManifestComponents(index);';

      if(options.embedManifestIndex) {
        var embedFilePath = path.resolve(__dirname, options.embedManifestIndex);

        fs.outputFileSync(embedFilePath, indexScript);
        ourManifest.webpackEP.component.push(embedFilePath);
      }

      /*
       * Now build the translation
       */
      var msgFormatBuilder
        , translation
        , translationFiles = ourManifest.translations
        , j, k;

      var translationDictionary = {};

      for(ix in translationFiles) {
        try {
          // load the translation file and merge each key
          translation = JSON.parse(fs.readFileSync(translationFiles[ix]).toString().replace(/\n/g,''));
          for(k in translation) {
            for(j in translation[k]) {
              // insure locale exist
              if(!translationDictionary[j]) {
                translationDictionary[j] = {};
              }

              if(translationDictionary[j][k]) {
                console.warn('warning translation', k, j, 'already exists');
              }

              translationDictionary[j][k] = translation[k][j];
            }
          }
        } catch(ex) {
          console.error('Cannot read translation', translationFiles[ix], 'because:', ex.message);
          next(ex);
          return;
        }
      }

      // save the transactions map file
      if(options.translationMapFile) {
        var translationMapFile = path.resolve(__dirname, options.translationMapFile);
        fs.writeJSONFileSync(translationMapFile, translationDictionary);
      }

      var translationStats = {};

      for(j in translationDictionary) {
        msgFormatBuilder = new messageFormat(j.split('-')[0]);

        translationStats[j] = Object.keys(translationDictionary[j]).length;

        translationDictionary[j] = '(function() {var i18n='+msgFormatBuilder.functions()+';'+
          'i18n._='+msgFormatBuilder.precompileObject(translationDictionary[j])+';'+
          'if(__pellet__ref) {__pellet__ref.loadTranslation("'+j+'",i18n._);}})();\n';
      }

      console.info('Translations Breakdown:');
      console.info(JSON.stringify(translationStats, null, 2)
        .replace(/\s+[{},\]]+/g, "")
        .replace(/[{\[":,]/g, ""));

      // merge in pellet into the components so its loaded and can bootstrap environment
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

      if(ourManifest.webpackEP['client-dependencies'] && browser.entry.component) {
        browser.entry = Object.create(browser.entry);
        browser.entry.component = ourManifest.webpackEP['client-dependencies'].concat(browser.entry.component);
        delete ourManifest.webpackEP['client-dependencies'];
      }

      if(ourManifest.webpackEP['server-dependencies'] && node.entry.component) {
        node.entry = Object.create(node.entry);
        node.entry.component = ourManifest.webpackEP['server-dependencies'].concat(node.entry.component);
        delete ourManifest.webpackEP['server-dependencies'];
      }

      node.target = 'node';
      node.node = {
        __dirname: true,
        __filename: true
      };

      node.output = {
        path: path.resolve(process.cwd(), options.outputServer || '/tmp/dist/node'),
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
        translationDictionary: translationDictionary,
        indexScript: indexScript,
        baseConfig: config,
        browserConfig: browser,
        serverConfig: node
      });
    });
  });
};

module.exports = manifestParser;

// if ENV=='testing' exports manifest test functions look at rewire to do this also!