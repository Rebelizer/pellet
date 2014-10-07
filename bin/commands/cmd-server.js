var path = require('path')
  , fs = require('fs-extra')
  , os = require('os')
  , webpack = require('webpack')
  , glob = require('glob')
  , spdy = require('spdy')
  , winston = require('winston')
  , winstonMail = require('winston-mail')
  , nconf = require('nconf')
  , cluster = require('cluster-master')
  , polyfill = require('polyfills')
  , ejs = require('ejs')
  , react = require('react')
  , manifest = require('../../src/manifest')
  , utils = require('../utils');

var PELLET_BIN_PATH = path.resolve(__dirname, '..');
var LAUNCH_CWD = process.cwd();

module.exports = function(program, addToReadyQue) {

  var PELLET_PROJECT_PATH = (program.pelletConfig && program.pelletConfig._filepath && path.dirname(program.pelletConfig._filepath)) || LAUNCH_CWD;

  program
    .command('server [manifest]')
    .alias('run')
    .description('Start Pellet server')
    .option('-v, --verbose [silly|debug|verbose|info|warn|error]', 'verbose mode', false)
    .option('-n, --cluster:count <size>', 'number of process', 0)
    .option('--http:port <port>', 'http server port', process.env.PORT || 3000)
    .option('--http:address <ip>', 'http bind address', process.env.BIND_ADDR || '0.0.0.0')
    .option('--https:port <port>', 'https server port', process.env.SSL_PORT || 3001)
    .option('--https:address <ip>', 'https bind address', process.env.BIND_ADDR || '0.0.0.0')
    .option('--pellet:output <path>', 'path to the build dir')
    .option('--pellet:output-browser <dir>', 'Directory browser packed version saved to')
    .option('--pellet:output-server <dir>', 'Directory nodejs packed version saved to')
    .option('--server:webpack-mount-point <path>', 'Path the packed browser assets are served')
    .option('--watch', 'Watch manifest dependencies and rebuild', false)
    .option('--build', 'Build manifest dependencies and run', false)
    .option('--clean', 'Clean the build dir', false)
    .option('--mode <prod|dev>', 'Packaging mode')
    .option('--polyfill-rebuild', 'Rebuild polyfill files')
    .option('--es6', 'run with es6 support', false)
    .option('--spdy', 'path to directory with spdy cert', false)
    .action(function (manifestGlob, options) {

      if(!manifestGlob) {
        manifestGlob = [program.pelletConfig && program.pelletConfig.manifestFiles &&
          path.resolve(PELLET_PROJECT_PATH, program.pelletConfig.manifestFiles)];
      } else if(program.args) {
        program.args.push(manifestGlob);
        manifestGlob = program.args;
      } else {
        manifestGlob = [manifestGlob];
      }

      // setup a callback hook that lets this sub command register
      // the logic needed to execute when the parent process is ready.
      // We do this so the parent process can load all the config info
      // before execute ourself.
      addToReadyQue(function() {

        utils.overwriteNconfWithArgs(nconf, options);

        if(nconf.get('verbose')) {
          nconf.set('winston:containers:console:console:level', nconf.get('verbose'));
        }

        // merge in the mount point to pellet can render the correct js directory
        nconf.set('publicAppConfig:jsMountPoint', nconf.get('server:webpackMountPoint'));

        // setup the apps default logger and overwrite the javascript console to use our logger
        var pelletLogger = winston.loggers.add('pellet', nconf.get('winston:containers:console'));
        pelletLogger.extend(console);
        console.log = pelletLogger.info;

        // catch all uncaught exception and try to email them
        if(nconf.get('winston:containers:alert')) {
          var alertLogger = winston.loggers.add('alert', nconf.get('winston:containers:alert'));
          process.on('uncaughtException', function (err) {
            var body = 'Stack Trace:\n\n' + err.stack + '\n\n';

            // only include the system information if requested
            // in development mode this is a lot of information to parse
            if (nconf.get('stackTrace:includeSystemInfo')) {
              try {
                body += 'VERSION: ' + version + '\n';
                body += 'CWD: ' + process.cwd() + '\n';
                body += 'SYSTEM: ' + process.platform + ' pid: ' + process.pid;

                // on windows cannot use getuid or getgid
                if(process.getuid && process.getgid) {
                  body += ' uid: ' + process.getuid() + ' gid: ' + process.getgid() + '\n';
                } else {
                  body += '\n';
                }

                body += JSON.stringify(process.versions, null, 1)
                  .replace(/\s+[{},\]]/g, '')
                  .replace(/[{\[":,]/g, '') + '\n\n';

                body += 'CONFIGURATION ' + (options.config || '') + ':\n';
                body += JSON.stringify(nconf.get(), null, 1)
                  .replace(/\s+[{},\]]/g, '')
                  .replace(/[{\[":,]/g, '')
                  .replace(program.scrubLogs, '$1 ################') + '\n\n';

                body += 'NETWORK:\n' + util.inspect(os.networkInterfaces(), {showHidden: true, depth: 5}) + '\n';
                body += 'LOAD AVE: ' + util.inspect(os.loadavg(), {showHidden: true, depth: 5}) + '\n';
                body += 'UPTIME: ' + os.uptime() + '\n';
                body += 'TOTALMEM: ' + os.totalmem() + '\n';
                body += 'FREEMEM: ' + os.freemem() + '\n';
                body += 'CPUS:\n\n' + util.inspect(os.cpus(), {showHidden: true, depth: 5}) + '\n';
              } catch (ex) {
                body += 'FORMAT ERROR:\n\n' + ex.message + '\n\n' + err.stack + '\n\n';
              }
            }

            alertLogger.error(body);
          });
        }

        // helper function to allow the config have access to dynamic paths
        // set at runtime i.e. CWD, path to bin dir, etc.
        function resolveConfigPaths(fullpath, skipResolve) {
          if(!fullpath) {
            return fullpath;
          }

          fullpath = fullpath.replace('#CWD#', LAUNCH_CWD)
            .replace('#PELLET_PROJECT_PATH#', PELLET_PROJECT_PATH)
            .replace('#PELLET_BIN_DIR#', PELLET_BIN_PATH)
            .replace('#PELLET_TMP_DIR#', os.tmpDir().replace(/\/$/,''));

          if(fullpath.indexOf('#SERVER_STATIC_DIR#') != -1) {
            fullpath = fullpath.replace('#SERVER_STATIC_DIR#', resolveConfigPaths(nconf.get('server:static'), skipResolve));
          }

          if(skipResolve) {
            return path.normalize(fullpath);
          }

          return path.resolve(LAUNCH_CWD, path.normalize(fullpath));
        }

        // add --harmony flag if running in ES6 mode
        if(options.es6) {
          if(!(options.es6 = process.version.match(/v\d+\.(\d+)\./)) || parseInt(options.es6[1], 10) < 11) {
            console.error('Requests node v0.11 or higher to run ES6');
            process.exit(1);
          }

          if(process.argv.indexOf('--harmony') == -1) {
            process.argv.push('--harmony');
          }
        }

        if (options.mode) {
          if (options.mode.toLowerCase().trim().indexOf('prod') === 0) {
            options.mode = 'production';
          } else {
            options.mode = 'development';
          }
        }

        /*
         * helper function called once we are done building
         * the webpack files. This will load and start pellet
         * so that we can start express or koa with pellet
         * middleware.
         */

        function startServer(componentModule, isManifestFile) {
          var app, server, pellet;

          if(isManifestFile) {
            try {
              componentModule = require(componentModule);
            } catch (ex) {
              console.error('Cannot load manifest', componentModule, 'because:', ex.message);
              process.exit(1);
            }

            if(componentModule.mode !== options.mode) {
              console.error('Cannot use manifest because it was build in', componentModule.mode, 'mode and you are running in', options.mode);
              process.exit(1);
            }

            // get base node dir by using _MANIFEST.json and its relative path to node version
            var baseServerDir = path.resolve(options.output, componentModule.server.relativePath)
              , componentModule = path.join(baseServerDir, componentModule.server.component);
          }

          if(!fs.existsSync(componentModule)) {
            console.error('Cannot find build output. Please build and insure', componentModule, 'exists.');
            process.exit(1);
          }

          try {
            console.log('Loading', componentModule, 'webpack into pellet server.');
            require('source-map-support').install({handleUncaughtExceptions: false});
            pellet = require(componentModule);
          } catch(ex) {
            console.error('Cannot load', componentModule, 'because:', ex.message);
            console.error(ex.stack);
            process.exit(1);
          }

          // using Koa for ES6 mode else express
          if ('function' === typeof Map) {
            if (!nconf.get('silent')) {
              console.info('Running in ES6 mode');
            }

            // create Koa server
            server = require('koa');
            app = server();

          } else {
            if (!nconf.get('silent')) {
              console.info('Running in ES5 mode');
            }

            // create express server
            var morgan = require('morgan');
            morgan.token('pid', function(req, res) {
              return process.pid;
            });

            server = require('express');
            app = server();

            if (nconf.get('server:accessLog')) {
              if (nconf.get('server:accessLog:logFile') === 'STDOUT') {
                app.use(morgan(nconf.get('server:accessLog:format')));
              } else {
                var logFile = resolveConfigPaths(nconf.get('server:accessLog:logFile'));

                var logStream = fs.createWriteStream(logFile, {flags: 'a'});
                logStream.write("START LOGGING:"+(new Date()).toJSON()+" PID:"+process.pid+"\n");
                app.use(morgan(nconf.get('server:accessLog:format'), {stream: logStream, buffer: 1000}));
              }
            }

            // setup express static assets including the facicon.ico (replace __DEFAULT_STATIC_DIR with pellet internal path)
            app.use(require('serve-favicon')(resolveConfigPaths(nconf.get('server:favicon'))));
            app.use(server.static(resolveConfigPaths(nconf.get('server:static'))));
            app.use(nconf.get('server:webpackMountPoint'), server.static(options.outputBrowser));

            // init the polyfill and rebuild cache is needed
            var polyfillOptions = nconf.get('polyfill');
            polyfillOptions.cache = resolveConfigPaths(polyfillOptions.cache);

            if (!nconf.get('silent')) {
              console.info('Polyfill:', polyfillOptions);
            }

            var _polyfill = polyfill(polyfillOptions);

            // create a polyfill endpoint
            app.use(function (req, res, next) {
              if (req.path !== '/js/polyfills.js') return next();

              _polyfill(req.headers['user-agent']).then(function (data) {
                // you probably want to do content negotiation here
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Content-Length', data.length['.min.js.gz']);
                res.setHeader('Content-Type', 'application/javascript');
                res.setHeader('ETag', '"' + data.hash + '"');
                res.setHeader('Last-Modified', data.date.toUTCString());

                if (req.fresh) {
                  res.statusCode = 304;
                  res.end();
                  return
                }

                return _polyfill.read(data.name, '.min.js.gz').then(function (buf) {
                  res.end(buf)
                });
              }).catch(next);

            });

            // wire up pellet middleware
            app.use(pellet.middleware);
          }

          if (nconf.get('spdy')) {
            var spdyPath = resolveConfigPaths(nconf.get('spdy'));
            var opt = {
              key: fs.readFileSync(path.join(spdyPath, 'spdy-key.pem')),
              cert: fs.readFileSync(path.join(spdyPath, 'spdy-cert.pem')),
              ca: fs.readFileSync(path.join(spdyPath, 'spdy-ca.pem')),
              windowSize: 1024 * 1024,
              autoSpdy31: false
            };

            pellet.startInit(nconf.get('publicAppConfig'));
            pellet.onReady(function (err) {
              if (err) {
                console.error('Error in initializing Pellet:', err.message);
                process.exit(1);
              }

              spdy.createServer(opt, app).listen(nconf.get('https:port'), function () {
                if (!nconf.get('silent')) {
                  console.log('Listen on', nconf.get('https:port'), nconf.get('https:address'));
                }
              });
            });
          } else {
            pellet.startInit(nconf.get('publicAppConfig'));
            pellet.onReady(function (err) {
              if (err) {
                console.error('Error in initializing Pellet:', err.message);
                process.exit(1);
              }

              app.listen(nconf.get('http:port'), nconf.get('http:address'), nconf.get('http:max_syn_backlog'), function () {
                if (!nconf.get('silent')) {
                  console.log('Listen on', nconf.get('http:port'), nconf.get('http:address'));
                }
              });
            });
          }
        }

        // make sure the paths are absolute
        options.output = path.resolve(LAUNCH_CWD, (resolveConfigPaths(nconf.get('pellet:output')) || 'build'));
        options.outputBrowser = path.resolve(options.output, resolveConfigPaths(nconf.get('pellet:outputBrowser'), true) || 'browser');
        options.outputServer = path.resolve(options.output, resolveConfigPaths(nconf.get('pellet:outputServer'), true) || 'server');
        options.mountPoint = nconf.get('server:webpackMountPoint');

        var componentModule = path.join(options.output, '_MANIFEST.json');

        if(options.clean) {
          console.log('Cleaning:', options.output);
          fs.deleteSync(options.output);
        }

        // For cluster(master) and standalone we need to build the manifest and load pellet
        // main entry point. For slave processed we DO NOT want to build the manifest
        // because their parent process is doing that work so, all we need to do is
        // load pellet and start the web server.
        if(!process.env.CLUSTER_SLAVE) {
          if(options.watch || options.build) {
            var ourManifest = new manifest();

            // embed the manifest index into the webpack so pellet can find all the components
            options.embedManifestIndex = path.join(options.output, '_EMBED_INDEX.js');

            // build the translation map
            options.translationMapFile = path.join(options.output, '_TRANSLATIONS.json');

            // include our core manifest so our webpack will include pellet internal mixin, components, etc.
            manifestGlob.push(path.resolve(__dirname, '../../components/core.manifest.json'));

            // todo: if running in the debug load more manifest stuff (i.e. translator tool, preview tool, etc.)

            ourManifest.buildWebpackConfig(manifestGlob, options, function (err, config) {
              if (err) {
                console.error('Cannot build Webpack config because:', err.message);
                process.exit(1);
              }

              if (config.translationDictionary) {
                options.translationDetails = {
                  server:null,
                  browser: []
                };

                var serverOutput = [];
                for(var i in config.translationDictionary) {
                  options.translationDetails.browser.push(i+'.js');
                  fs.outputFileSync(path.join(options.outputBrowser, i+'.js'), config.translationDictionary[i]);
                  serverOutput.push(config.translationDictionary[i]);
                }

                options.translationDetails.server = 'all-translations.js';
                fs.outputFileSync(path.join(options.outputServer, options.translationDetails.server), serverOutput.join('\n'));
              }

              // cache to help clean up build files
              var lastManifestDetails = false;

              // build a function that sync the two step build into a single step that
              // builds the manifest profile and map. This also handles duplicate errors
              var doneFn = utils.syncNodeAndBrowserBuilds(utils.buildManifestProfileAndMap(
                options, function (err, buildManifestMap, browserStats, nodeStats) {
                  if (err) {
                    console.error('Cannot build webpack files because:', err.message, err.trace);
                    return;
                  }

                  if (!buildManifestMap.server.component) {
                    console.error('Cannot load because no component in manifest');
                    return;
                  }

                  // todo: I do not think we need this line because componentModule is allready defined above!
                  // get base node dir by using _MANIFEST.json and its relative path to node version
                  var baseServerDir = path.resolve(options.output, buildManifestMap.server.relativePath)
                    , componentModule = path.join(baseServerDir, buildManifestMap.server.component);

                  // in prod mode clean up old manifest files
                  // from the previous build
                  if (options.mode === 'production') {
                    if (lastManifestDetails) {
                      console.log('Clean up last build', lastManifestDetails.browser.hash, lastManifestDetails.server.hash);

                      fs.remove(path.resolve(options.output, lastManifestDetails.browser.relativePath, lastManifestDetails.browser.assets));
                      fs.remove(path.resolve(options.output, lastManifestDetails.browser.relativePath, lastManifestDetails.browser.component));
                      fs.remove(path.resolve(options.output, lastManifestDetails.browser.relativePath, lastManifestDetails.browser.assets + '.map'));
                      fs.remove(path.resolve(options.output, lastManifestDetails.browser.relativePath, lastManifestDetails.browser.component + '.map'));
                      fs.remove(path.resolve(options.output, lastManifestDetails.server.relativePath, lastManifestDetails.server.assets));
                      fs.remove(path.resolve(options.output, lastManifestDetails.server.relativePath, lastManifestDetails.server.component));
                    }
                  }

                  if (!lastManifestDetails && !options['cluster:count']) {
                    startServer(componentModule);
                  }

                  if (lastManifestDetails && lastManifestDetails.browser.hash != buildManifestMap.browser.hash && options['cluster:count'] > 0) {
                    cluster.restart();
                  }

                  lastManifestDetails = buildManifestMap;
                }));

              config.browserConfig.bail = false;
              config.serverConfig.bail = false;

              // todo: move this into manifest (we want to use our version of react! and globalize
              // because its a core part of our system!
              config.browserConfig.externals = {
                React: 'React',
                react: 'React'
              };

              config.serverConfig.externals = {
                React: require.resolve('react'),
                react: require.resolve('react')
              };

              if(options.watch) {
                // build both the server and browser webpack files
                webpack(config.browserConfig).watch(100, doneFn(0));
                webpack(config.serverConfig).watch(100, doneFn(1));
              } else {
                webpack(config.browserConfig).run(doneFn(0));
                webpack(config.serverConfig).run(doneFn(1));
              }
            });
          } else if(!options['cluster:count']) {
            startServer(componentModule, true);
            return;
          }

          // after we have make sure we have all the configuration
          // and error handling start the cluster.
          if(options['cluster:count'] > 0) {
            process.env.CLUSTER_SLAVE = true;

            // update args for the worker version
            var args = process.argv.splice(2);
            args.push('--silent');

            cluster({
              exec: path.resolve(__dirname, '..', 'pellet.js'),
              size: parseInt(options['cluster:count'], 10),
              env: process.env,
              args: args,
              silent: false,
              signals: true,
              repl: nconf.get('cluster:repl') && {port:parseInt(nconf.get('cluster:repl:port')), address:nconf.get('cluster:repl:address')},
              onMessage: function (message) {
                console.error('SLAVE %s %j', this.uniqueID, message);
              }
            });
          }
        } else {
          startServer(componentModule, true);
        }
      });

//TODO: boost number of http.request.count

    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'server.txt')).toString());
    });
};
