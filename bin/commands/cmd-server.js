var path = require('path')
  , fs = require('fs-extra')
  , ejs = require('ejs')
  , os = require('os')
  , util = require('util')
  , webpack = require('webpack')
  , glob = require('glob')
  , spdy = require('spdy')
  , osexec = require('child_process').exec
  , winston = require('winston')
  , winstonMail = require('winston-mail')
  , progressBar = require('progress')
  , nconf = require('nconf')
  , cluster = require('cluster-master')
  , polyfill = require('polyfills')
  , compression = require('compression')
  , react = require('react')
  , instrumentation = require('../../src/instrumentation')
  , manifest = require('../../src/manifest')
  , utils = require('../utils')
  , url = require('url')
  , pelletUtils = require('../../src/utils');

var PELLET_BIN_PATH = path.resolve(__dirname, '..');
var LAUNCH_CWD = process.cwd();

var LAUNCH_TIME = new Date();

/*
 * helper function to parse the nconf webpack overrides
 * and conver the strings into RegExp
 */
function fixWebpackOverrideNConf(config) {
  if(config.module) {
    if (config.module.noParse) {
      if (!Array.isArray(config.module.noParse)) {
        config.module.noParse = [config.module.noParse];
      }

      config.module.noParse = config.module.noParse.map(function (exp) {
        return new RegExp(exp);
      });
    }

    if (config.module.loaders) {
      if (!Array.isArray(config.module.loaders)) {
        config.module.loaders = [config.module.loaders];
      }

      config.module.loaders = config.module.loaders.map(function (item) {
        if (item.test) {
          item.test = new RegExp(item.test);
        }

        return item;
      });
    }
  }
}

module.exports = function(program, addToReadyQue) {

  var PELLET_PROJECT_PATH = (program.pelletConfig && program.pelletConfig._filepath && path.dirname(program.pelletConfig._filepath)) || LAUNCH_CWD;

  function buildRunPackage(manifestGlob, options) {
    var logException = false;

    utils.overwriteNconfWithArgs(nconf, options);

    if (nconf.get('verbose')) {
      nconf.set('winston:containers:console:console:level', nconf.get('verbose'));
    }

    if(!nconf.get('application:config:jsMountPoint')) {
      // merge in the mount point for pellet so we can render the correct js directory
      nconf.set('application:config:jsMountPoint', nconf.get('server:webpackMountPoint'));
    }

    // set mode using the config flag
    options.mode = program.env;

    // setup the apps default logger and overwrite the javascript console to use our logger
    var pelletLogger = winston.loggers.add('pellet', nconf.get('winston:containers:console'));
    pelletLogger.extend(console);
    console.log = pelletLogger.info;

    // now setup instrumentation using statsd and winston logger
    var instrument = new instrumentation(nconf.get('statsd'));
    if(nconf.get('winston:containers:instrumentation')) {
      var instrumentationLogger = winston.loggers.add('instrumentation', nconf.get('winston:containers:instrumentation'));

      var instrumentClientSide = instrument;
      if(nconf.get('statsd:browserNamespace')) {
        var instrumentClientSide = instrument.namespace(nconf.get('statsd:browserNamespace'));
      }

      instrument.setInstrumentationTransport(function (sessionId, type, namespace, payload) {
        var level = 'info';
        if(payload && payload._level) {
          level = payload._level;
          delete payload._level; // not a good idea to delete data but I think its ok for log data
        }

        if(type === 'statsd') {
          instrumentClientSide[payload.c].apply(instrumentClientSide, JSON.parse(payload.a));
          return;
        }

        instrumentationLogger.log(level, {sid:sessionId, type:type, n:namespace, data:payload});
      });
    }

    var mesureLaunch = instrument.elapseTimer(null, 'pellet_launch.');

    // catch all uncaught exception and try to email them
    if (nconf.get('winston:containers:alert')) {
      var alertLogger = winston.loggers.add('alert', nconf.get('winston:containers:alert'));
      logException = function (err, subject) {
        var body, isAlert;

        if(typeof err === 'string') {
          body = 'Alert' + (subject?(' ' + subject):'') + ':\n\n' + err + '\n\n';
          isAlert = true;
        } else {
          body = 'Stack Trace' + (subject?(' ' + subject):'') + ':\n\n' + err.stack + '\n\n';
          isAlert = false;
        }

        // only include the system information if requested
        // in development mode this is a lot of information to parse
        if (nconf.get('stackTrace:includeSystemInfo')) {
          try {
            body += 'VERSION: ' + program._version + '\n';
            body += 'CWD: ' + process.cwd() + '\n';
            body += 'SYSTEM: ' + process.platform + ' pid: ' + process.pid;

            // on windows cannot use getuid or getgid
            if (process.getuid && process.getgid) {
              body += ' uid: ' + process.getuid() + ' gid: ' + process.getgid() + '\n';
            } else {
              body += '\n';
            }

            body += JSON.stringify(process.versions, null, 1)
              .replace(/\s+[{},\]]/g, '')
              .replace(/[{\[":,]/g, '') + '\n\n';

            if(program._running) {
              body += 'PACKAGE:\n';
              body += JSON.stringify(program._running, null, 1)
                .replace(/\s+[{},\]]/g, '')
                .replace(/[{\[":,]/g, '') + '\n\n';
            }

            body += 'CONFIGURATION ' + (options.env || '') + ':\n';
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

        if(isAlert) {
          instrument.increment('alerts');
          alertLogger.info(body);
        } else {
          instrument.increment('uncaughtException');
          alertLogger.error(body);
        }
      }

      process.on('uncaughtException', logException);
    }

    // helper function to allow the config have access to dynamic paths
    // set at runtime i.e. CWD, path to bin dir, etc.
    function resolveConfigPaths(fullpath, skipResolve) {
      if (!fullpath) {
        return fullpath;
      }

      fullpath = fullpath.replace('#CWD#', LAUNCH_CWD)
        .replace('#PELLET_PROJECT_PATH#', PELLET_PROJECT_PATH)
        .replace('#PELLET_BIN_DIR#', PELLET_BIN_PATH)
        .replace('#PELLET_TMP_DIR#', os.tmpDir().replace(/\/$/, ''));

      if (fullpath.indexOf('#SERVER_STATIC_DIR#') != -1) {
        fullpath = fullpath.replace('#SERVER_STATIC_DIR#', resolveConfigPaths(nconf.get('server:static'), skipResolve));
      }

      if (skipResolve) {
        return path.normalize(fullpath);
      }

      return path.resolve(LAUNCH_CWD, path.normalize(fullpath));
    }

    // spawn a StatsD server
    if(options.startStatsD) {
      options.startStatsD = resolveConfigPaths(nconf.get('statsd').serverConfig||'');
      statsdCommand = path.join(PELLET_BIN_PATH, '..', 'node_modules','statsd', 'bin', 'statsd') + ' ' + options.startStatsD;

      console.info('Starting StatsD:', options.startStatsD);
      console.info('  NOTE: nc 127.0.0.1 8126 (StatsD CLI)');
      osexec(statsdCommand, function(error, stdout, stderr) {
        if(stderr && stderr.trim() != '') {
          console.error('StatsD stderr: ' + stderr);
        }
        if (error !== null) {
          console.error('Can not spawn statsd server because:', error);
          process.exit(1);
        }
      });
    }

    // add --harmony flag if running in ES6 mode
    if (options.es6) {
      if (!(options.es6 = process.version.match(/v\d+\.(\d+)\./)) || parseInt(options.es6[1], 10) < 11) {
        console.error('Requests node v0.11 or higher to run ES6');
        process.exit(1);
      }

      if (process.argv.indexOf('--harmony') == -1) {
        process.argv.push('--harmony');
      }
    }

    /*
     * helper function called once we are done building
     * the webpack files. This will load and start pellet
     * so that we can start express or koa with pellet
     * middleware.
     */

    function startServer(componentModule, isManifestFile) {
      var app, server, pellet, mesureServerLaunch;

      mesureServerLaunch = instrument.elapseTimer(null, 'server_launch.');

      if (isManifestFile) {
        try {
          componentModule = require(componentModule);
          program._running = componentModule;
        } catch (ex) {
          console.error('Cannot load manifest', componentModule, 'because:', ex.message);
          process.exit(1);
        }

        if (componentModule.mode !== options.mode) {
          console.error('Cannot use manifest because it was build in', componentModule.mode, 'mode and you are running in', options.mode);
          process.exit(1);
        }
      }

      // get base node dir by using _MANIFEST.json and its relative path to node version
      var baseServerDir = path.resolve(options.output, componentModule.server.relativePath)
        , componentFile = path.join(baseServerDir, componentModule.server.component);

      mesureServerLaunch.mark('load_manifest');

      if (!fs.existsSync(componentFile)) {
        console.error('Cannot find build output. Please build and insure', componentModule, 'exists.');
        process.exit(1);
      }

      var appConfig = nconf.get('application:config');
      var appOptions = nconf.get('application:options');
      appOptions.skeletonPage = resolveConfigPaths(appOptions.skeletonPage);
      appOptions.assetFileName = componentModule.browser.assets;
      appOptions.componentFileName = componentModule.browser.component;
      appOptions.manifest = componentModule;

      // add the instrumentation and logger to config
      appOptions.instrumentation = instrument;
      appOptions.logger = pelletLogger;

      var sampleInterval = nconf.get('pellet:insterumentation:interval');
      var lastRSS = 0, heapTotal = 0;
      if(sampleInterval) {
        setInterval(function() {
          var namespace = os.hostname() + '.';
          var memoryUsage = process.memoryUsage();

          instrument.gauge(namespace + 'loadavg', os.loadavg());
          instrument.gauge(namespace + 'totalmem', os.totalmem());
          instrument.gauge(namespace + 'freemem', os.freemem());

          namespace = namespace + process.pid + '.';
          instrument.gauge(namespace + 'runtime', new Date() - LAUNCH_TIME);
          instrument.gauge(namespace + 'rss', memoryUsage.rss);
          instrument.gauge(namespace + 'heapTotal', memoryUsage.heapTotal);
          instrument.gauge(namespace + 'heapUsed', memoryUsage.heapUsed);

          console.info('Interval sample loadavg:', os.loadavg());
          console.info('  totalmem:', os.totalmem(), 'freemem:', os.freemem(), 'runtime:', new Date() - LAUNCH_TIME);
          console.info('  rss:', memoryUsage.rss, 'heapTotal:', memoryUsage.heapTotal, 'heapUsed:', memoryUsage.heapUsed);
          if(lastRSS && heapTotal) {
            console.info('  ^delta rss:', memoryUsage.rss - lastRSS, 'heapTotal:', memoryUsage.heapTotal - heapTotal);
          }

          lastRSS = memoryUsage.rss; heapTotal = memoryUsage.heapTotal;

        }, sampleInterval);
      }

      var heapSnapshotThreshold = nconf.get('pellet:heapSnapshot');
      if(heapSnapshotThreshold == 'true') {
        heapSnapshotThreshold = 1;
      } else {
        heapSnapshotThreshold = ~~heapSnapshotThreshold;
      }

      if(heapSnapshotThreshold) {
        var nextThreshold = process.memoryUsage().rss + heapSnapshotThreshold
          , heapdump = require('heapdump')

        console.info('Enabled strongloop heapdump: to snapshot "kill -USR2', process.pid + '"');
        console.info('  Read http://strongloop.com/strongblog/how-to-heap-snapshots/');

        // default to 30sec if not set
        if(!sampleInterval) {
          sampleInterval = 30000;
        }

        if(heapSnapshotThreshold > 1) { // i.e not false or true but a value
          console.info('  Start watching: threshold', heapSnapshotThreshold, 'interval:', sampleInterval);

          setInterval(function () {
            rss = process.memoryUsage().rss;
            if(rss > nextThreshold) {
              heapdump.writeSnapshot(function (err, filename) {
                if (err) {
                  console.error('Can not write heap snapshot because:', err.message || err);
                }

                console.log('Take a heap snapshot:',  path.join(process.cwd(), filename));
              });

              nextThreshold = rss + heapSnapshotThreshold;
            }
          }, sampleInterval);
        }
      }

      mesureServerLaunch.mark('heap_snapshot');

      try {
        console.log('Loading', componentFile, 'webpack into pellet server.');
        require('source-map-support').install({handleUncaughtExceptions: false});
        global.__pellet__bootstrap = {config:appConfig, options:appOptions};
        pellet = require(componentFile);
      } catch (ex) {
        console.error('Cannot load', componentFile, 'because:', ex.message);
        console.error(ex.stack);
        process.exit(1);
      }

      mesureServerLaunch.mark('load_isomorphic_code');

      if (componentModule.server.translation) {
        var translationFile = path.join(baseServerDir, componentModule.server.translation);

        try {
          console.log('Loading', translationFile, 'translation into pellet server.');
          require(translationFile);
        } catch (ex) {
          console.error('Cannot load', translationFile, 'because:', ex.message);
          console.error(ex.stack);
          process.exit(1);
        }
      }

      mesureServerLaunch.mark('load_translation');

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
        morgan.token('pid', function (req, res) {
          return process.pid;
        });

        server = require('express');
        app = server();

        mesureServerLaunch.mark('server_container');

        if (nconf.get('server:accessLog')) {
          var loggingFormat, httpLogger;
          if(nconf.get('server:accessLog:transport') === 'winston' &&
            (httpLogger = nconf.get('winston:containers:httplogger')) &&
            (loggingFormat = nconf.get('server:accessLog:format'))) {

            httpLogger = winston.loggers.add('httplogger', httpLogger);

            if(morgan[loggingFormat]) {
              loggingFormat = morgan[loggingFormat];
            }

            if(nconf.get('server:accessLog:mode') === 'object') {
              loggingFormat = 'return {' + loggingFormat.replace(/"/g, '\\"').replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function (_, name, arg) {
                return '"'+name+'":'+'(tokens["' + name + '"](req, res, ' + String(JSON.stringify(arg)) + ') || null),';
              }) + '};'
            } else {
              loggingFormat = 'return "' + loggingFormat.replace(/"/g, '\\"').replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function (_, name, arg) {
                return '"\n    + (tokens["' + name + '"](req, res, ' + String(JSON.stringify(arg)) + ') || "-") + "';
              }) + '";'
            }

            try {
              loggingFormat = new Function('tokens, req, res', loggingFormat);
            } catch(ex) {
              console.error('Error setting up httplogger (fix format config) because:', ex.message);
              process.exit(1);
            }

            app.use(morgan(function(morgan, req, res) {
              httpLogger.log('info', loggingFormat(morgan, req, res));
              return null;
            }));
          } else if(nconf.get('server:accessLog:logFile') === 'STDOUT') {
            app.use(morgan(nconf.get('server:accessLog:format')));
          } else {
            var logFile = resolveConfigPaths(nconf.get('server:accessLog:logFile'));

            var logStream = fs.createWriteStream(logFile, {flags: 'a'});
            logStream.write("START LOGGING:" + (new Date()).toJSON() + " PID:" + process.pid + "\n");
            app.use(morgan(nconf.get('server:accessLog:format'), {stream: logStream}));
          }
        }

        // setup express static assets including the facicon.ico (replace __DEFAULT_STATIC_DIR with pellet internal path)
        app.use(require('serve-favicon')(resolveConfigPaths(nconf.get('server:favicon'))));

        if(nconf.get('pellet:runInstrumentationTrackServer') &&
          appConfig.instrumentation &&
          appConfig.instrumentation.url) {

          // now setup the tracking pixel server
          var pixelUrl = url.parse(appConfig.instrumentation.url, false, true).path;
          var trackPixel = new Buffer([71,73,70,56,57,97,1,0,1,0,128,0,0,255,255,255,0,0,0,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59]);
          app.use(function(req, res, next) {
            var _s, _n, _t;

            if (req.path !== pixelUrl || req.method !== 'GET') {
              return next();
            }

            if(!req.query) {
              req.query = url.parse(req.url, true).query;
            }

            res.writeHead(200, {
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Content-Length': 43,
              'Content-Type': 'image/gif',
              'Expires':'Fri, 01 Jan 1990 00:00:00 GMT',
              'Last-Modified':'Sun, 17 May 1998 03:00:00 GMT',
              'Pragma':'no-cache'
            });

            res.end(trackPixel, 'binary');

            if(!(_s = req.query._s)) {
              return;
            }

            _n = req.query._n;
            _t = req.query._t;

            delete req.query._s;
            delete req.query._n;
            delete req.query._t;

            instrument.log(_t, req.query, _s, _n);
          });
        }

        var compressionOpts = nconf.get('server:compression')
        if(compressionOpts) {
          app.use(compression(compressionOpts));
        }

        app.use(server.static(resolveConfigPaths(nconf.get('server:static'))));
        app.use(nconf.get('server:webpackMountPoint'), server.static(options.outputBrowser));

        // init the polyfill and rebuild cache is needed
        var polyfillOptions = nconf.get('polyfill');
        polyfillOptions.cache = resolveConfigPaths(polyfillOptions.cache);

        if (!nconf.get('silent')) {
          console.info('Polyfill:', polyfillOptions);
        }

        var _polyfill = polyfill();

        // create a polyfill endpoint
        app.use(function (req, res, next) {
          if (req.path !== appOptions.polyfillPath) return next();
          _polyfill(req.headers['user-agent']).then(function (data) {
            var ext = _polyfill.select(data, true, true);

            if(ext[1]) {
              res.setHeader('Content-Encoding', 'gzip');
            }

            res.setHeader('Content-Length', data.length[ext[0]]);
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('ETag', '"' + data.hash + '"');
            if(data.date) {
              res.setHeader('Last-Modified', data.date);
            }

            if (req.fresh) {
              // if expressjs or nodejs
              if(res.status) {
                res.status(304).end();
              } else {
                res.statusCode = 304;
                res.end();
              }

              return
            }

            return _polyfill.read(data.name, ext[0]).then(function (buf) {
              res.end(buf);
            });
          }).catch(next);

        });

        mesureServerLaunch.mark('polyfill_db_ready');

        // add the express cookie parser
        app.use(require('cookie-parser')());

        // add the express body parser
        var bodyParser = require('body-parser');
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());

        // wire up pellet middleware, but first sort the stack
        pellet.middlewareStack = pellet.middlewareStack.sort(function (a, b) {
          return (a.priority || 1000) - (b.priority || 1000)
        });
        for (var i in pellet.middlewareStack) {
          if (pellet.middlewareStack[i] && pellet.middlewareStack[i].fn) {
            app.use(pellet.middlewareStack[i].fn);
          }
        }

        if (appOptions.missingPage) {
          appOptions.missingPage = resolveConfigPaths(appOptions.missingPage);
          appOptions.missingPage = ejs.compile(fs.readFileSync(appOptions.missingPage).toString());
          app.use(function (req, res, next) {

            // if expressjs or nodejs
            if(res.status) {
              res.status(404).send(appOptions.missingPage({config: appOptions, req: req, res: res}));
            } else {
              res.statusCode = 404;
              res.end(appOptions.missingPage({config: appOptions, req: req, res: res}));
            }

            instrument.increment('http.status.404');
          });
        }

        if (appOptions.errorPage) {
          appOptions.errorPage = resolveConfigPaths(appOptions.errorPage);
          appOptions.errorPage = ejs.compile(fs.readFileSync(appOptions.errorPage).toString());
          app.use(function (err, req, res, next) {

            // if expressjs or nodejs
            if(res.status) {
              res.status(500).send(appOptions.errorPage({config: appOptions, req: req, res: res, err: err}));
            } else {
              res.statusCode = 500;
              res.end(appOptions.errorPage({config: appOptions, req: req, res: res, err: err}));
            }

            instrument.increment('http.status.500');

            console.error('Error rendering page:', err);
            if (logException) {
              logException(err);
            }
          });
        }
      }

      mesureServerLaunch.mark('middleware_loaded');

      if(logException && nconf.get('server:alertOnLaunch')) {
        // send out an alert that we just launched the server so restart can be tracked
        logException('pellet server started on ' + new Date(), 'launch');
        mesureServerLaunch.mark('sent_launch_alert');
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

        mesureServerLaunch.mark('spdy');

        pellet.startInit();
        pellet.onReady(function (err) {
          mesureServerLaunch.mark('ready');

          if (err) {
            console.error('Error in initializing Pellet:', err.message);
            process.exit(1);
          }

          spdy.createServer(opt, app).listen(nconf.get('https:port'), function () {
            mesureServerLaunch.mark('listening');
            if (!nconf.get('silent')) {
              console.log('Listen on', nconf.get('https:port'), nconf.get('https:address'));
            }
          });
        });
      } else {
        pellet.startInit();
        pellet.onReady(function (err) {
          mesureServerLaunch.mark('ready');
          if (err) {
            console.error('Error in initializing Pellet:', err.message);
            process.exit(1);
          }

          app.listen(nconf.get('http:port'), nconf.get('http:address'), nconf.get('http:max_syn_backlog'), function () {
            mesureServerLaunch.mark('listening');
            if (!nconf.get('silent')) {
              console.log('Listen on', nconf.get('http:port'), nconf.get('http:address'));
            }
          });

          //TODO: app.maxConnections
        });
      }
    }

    // make sure the paths are absolute
    options.output = path.resolve(LAUNCH_CWD, (resolveConfigPaths(nconf.get('pellet:output')) || 'build'));
    options.outputBrowser = path.resolve(options.output, resolveConfigPaths(nconf.get('pellet:outputBrowser'), true) || 'browser');
    options.outputServer = path.resolve(options.output, resolveConfigPaths(nconf.get('pellet:outputServer'), true) || 'server');
    options.intlLocaleDataPath = nconf.get('pellet:intlLocaleData') && path.resolve(PELLET_PROJECT_PATH, resolveConfigPaths(nconf.get('pellet:intlLocaleData')));
    options.projectRootPath = PELLET_PROJECT_PATH;
    options.mountPoint = nconf.get('server:webpackMountPoint');
    options.uglifyOptions = nconf.get('pellet:uglifyOptions');
    options.useInternalDependencies = !!nconf.get('pellet:useInternalDependencies');
    options.ignoreCoreManifest = !!nconf.get('pellet:skipIncludedInternalCoreManifest');
    options.includeFallbackPaths = !!nconf.get('pellet:includeFallbackPaths');
    options.jadeTemplateSupport = !!nconf.get('pellet:jadeTemplateSupport');

    var componentModule = path.join(options.output, '_MANIFEST.json');

    mesureLaunch.mark('config');

    if (options.clean) {
      console.log('Cleaning:', options.output);
      fs.deleteSync(options.output);

      glob(path.join(LAUNCH_CWD, 'heapdump-*.*.heapsnapshot'), function (err, fileList) {
        if (err) {
          console.error('Error finding heapdump files to clean because:', err.message || err);
        }

        if(fileList && fileList.length) {
          for(var i in fileList) {
            console.log('Cleaning:', fileList[i]);
            fs.deleteSync(fileList[i]);
          }
        }
      });
    }

    mesureLaunch.mark('clean');

    // For cluster(master) and standalone we need to build the manifest and load pellet
    // main entry point. For slave processed we DO NOT want to build the manifest
    // because their parent process is doing that work so, all we need to do is
    // load pellet and start the web server.
    if (!process.env.CLUSTER_SLAVE) {
      if (options.watch || options.build) {
        var ourManifest = new manifest();

        // embed the manifest index into the webpack so pellet can find all the components
        options.embedManifestIndex = path.join(options.output, '_EMBED_INDEX.js');

        // embed the manifest index into the webpack so pellet can find all the components
        options.useIntermediateAssets = path.join(options.output, '_INTERMEDIATE_ASSETS');

        // build the translation map
        options.translationMapFile = path.join(options.output, '_TRANSLATIONS.json');

        //if(options.ignoreCoreManifest) {
        // include our core manifest so our webpack will include pellet internal mixin, components, etc.
        // try to make this one of the first manifest so webpack will load it first (some of the core components)
        // augment the pellet class/interface.
        manifestGlob.unshift(path.resolve(__dirname, '../../src/components/core.manifest.json'));

        // todo: if running in the debug load more manifest stuff (i.e. translator tool, preview tool, etc.)
        //}

        ourManifest.buildWebpackConfig(manifestGlob, options, function (err, config) {
          mesureLaunch.mark('build_webpack_config');

          if (err) {
            console.error('Cannot build Webpack config because:', err.message);
            process.exit(1);
          }

          if (config.translationDictionary && Object.keys(config.translationDictionary).length > 0) {
            options.translationDetails = {
              server: null,
              browser: []
            };

            var serverOutput = [];
            for (var i in config.translationDictionary) {
              serverOutput.push(config.translationDictionary[i].i18n);

              options.translationDetails.browser.push(i + '.js');
              fs.outputFileSync(path.join(options.outputBrowser, i + '.js'),
                config.translationDictionary[i].i18n + config.translationDictionary[i].localeData);
            }

            options.translationDetails.server = 'all-translations.js';
            fs.outputFileSync(path.join(options.outputServer, options.translationDetails.server), serverOutput.join('\n'));
          }

          mesureLaunch.mark('build_translation');

          // cache to help clean up build files
          var lastManifestDetails = false;

          // build a function that sync the two step build into a single step that
          // builds the manifest profile and map. This also handles duplicate errors
          var doneFn = utils.syncNodeAndBrowserBuilds(utils.buildManifestProfileAndMap(
            options, function (err, buildManifestMap, browserStats, nodeStats) {
              if(browserStats) {
                instrument.timing('pellet_launch.browser_pack_time', browserStats.time);
              }

              if(nodeStats) {
                instrument.timing('pellet_launch.server_pack_time', nodeStats.time);
              }

              if (err) {
                console.error('Cannot build webpack files because:', err.message, err.trace);
                return;
              }

              if(options.exitOnBuild) {
                if(typeof options.exitOnBuild === 'function') {
                  options.exitOnBuild(buildManifestMap, options);
                  return;
                }

                console.log('Build done with out errors');
                process.exit(0);
              }

              if (!buildManifestMap.server.component) {
                console.error('Cannot load because no component in manifest');
                return;
              }

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
                startServer(buildManifestMap);
              }

              if (lastManifestDetails && lastManifestDetails.browser.hash != buildManifestMap.browser.hash && options['cluster:count'] > 0) {
                cluster.restart();
              }

              lastManifestDetails = buildManifestMap;
            }));

          // merge in our webpack override config
          var overrides = nconf.get('webpackConfig');
          if (overrides) {
            var serverOverrides, browserOverrides;

            if (overrides.browser) {
              browserOverrides = overrides.browser;
              fixWebpackOverrideNConf(browserOverrides);
              delete overrides.browser;
              browserOverrides = [overrides, browserOverrides];
            } else {
              browserOverrides = [overrides];
            }

            if (overrides.server) {
              serverOverrides = overrides.server;
              fixWebpackOverrideNConf(serverOverrides);
              delete overrides.server;
              serverOverrides = [overrides, serverOverrides];
            } else {
              serverOverrides = [overrides];
            }

            fixWebpackOverrideNConf(overrides);

            pelletUtils.objectUnion(browserOverrides, config.browserConfig, {arrayCopyMode: 2});
            pelletUtils.objectUnion(serverOverrides, config.serverConfig, {arrayCopyMode: 2});
          }

          // do not need to build server assets
          //delete config.serverConfig.entry.assets;

          config.browserConfig.bail = false;
          config.serverConfig.bail = false;

          /*
           console.info('[Browser webpack config]');
           console.info(JSON.stringify(config.browserConfig, null, 2)
           .replace(/\s+[{},\]]+/g, "")
           .replace(/[{\[":,]/g, ""));

           console.info('[Server webpack config]');
           console.info(JSON.stringify(config.serverConfig, null, 2)
           .replace(/\s+[{},\]]+/g, "")
           .replace(/[{\[":,]/g, ""));
           */

          mesureLaunch.mark('custom_webpack_config');

          if(process.env.NODE_ENV !== 'production') {
            var bar = new progressBar('build [:bar] :percent', {
              complete: '=',
              incomplete: ' ',
              width: 30,
              total: 100
            });

            config.browserConfig.plugins = config.browserConfig.plugins.concat(new webpack.ProgressPlugin(function (percentage) {
              if (bar.complete || bar.skip) {
                bar.skip = true;
                return;
              }
              bar.update(percentage);
            }));
          }

          if (options.watch) {
            // build both the server and browser webpack files
            webpack(config.browserConfig).watch(100, doneFn(0));
            webpack(config.serverConfig).watch(100, doneFn(1));
          } else {
            webpack(config.browserConfig).run(doneFn(0));
            webpack(config.serverConfig).run(doneFn(1));
          }
        });
      } else if (!options['cluster:count']) {
        startServer(componentModule, true);
        return;
      }

      // after we have make sure we have all the configuration
      // and error handling start the cluster.
      if (options['cluster:count'] > 0) {
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
          repl: nconf.get('cluster:repl') && {
            port: parseInt(nconf.get('cluster:repl:port')),
            address: nconf.get('cluster:repl:address')
          },
          onMessage: function (message) {
            console.error('SLAVE %s %j', this.uniqueID, message);
          }
        });
      }
    } else {
      startServer(componentModule, true);
    }
  }

  function exec(manifestGlob, options) {
    if (!manifestGlob) {
      manifestGlob = [program.pelletConfig && program.pelletConfig.manifestFiles &&
      path.resolve(PELLET_PROJECT_PATH, program.pelletConfig.manifestFiles)];
    } else if (program.args) {
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
      buildRunPackage(manifestGlob, options);
    })
  }

  program
    .command('server [manifest]')
    .alias('run')
    .description('Start Pellet server')
    .option('-v, --verbose [silly|debug|verbose|info|warn|error]', 'verbose mode', false)
    .option('-n, --cluster:count <size>', 'number of process', 0)
    .option('--http:port <port>', 'http server port', process.env.PORT || 8080)
    .option('--http:address <ip>', 'http bind address', process.env.BIND_ADDR || '0.0.0.0')
    .option('--https:port <port>', 'https server port', process.env.SSL_PORT || 8081)
    .option('--https:address <ip>', 'https bind address', process.env.BIND_ADDR || '0.0.0.0')
    .option('--pellet:output <path>', 'path to the build dir')
    .option('--pellet:output-browser <dir>', 'Directory browser packed version saved to')
    .option('--pellet:output-server <dir>', 'Directory nodejs packed version saved to')
    .option('--server:webpack-mount-point <path>', 'Path the packed browser assets are served')
    .option('--pellet:heap-snapshot <threshold>', 'enable heapdump for memory leaks', false)
    .option('--startStatsD', 'run local statsd server')
    .option('--watch', 'Watch manifest dependencies and rebuild', false)
    .option('--build', 'Build manifest dependencies and run', false)
    .option('--clean', 'Clean the build dir', false)
    .option('--polyfill-rebuild', 'Rebuild polyfill files')
    .option('--es6', 'run with es6 support', false)
    .option('--spdy', 'path to directory with spdy cert', false)
    .action(exec)
    .on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'server.txt')).toString());
    });

  program
    .command('build [manifest]')
    .description('Build and webpack for a server/CDN')
    .option('--clean', 'Clean the build dir', false)
    .action(function(manifestGlob, options) {
      options.build = true;
      options.exitOnBuild = true;
      exec(manifestGlob, options)
    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'build.txt')).toString());
    });

  // export our build function so other commands
  // can use our logic with duplicating it.
  program.serverCommandFn = {
    buildRunPackage: buildRunPackage
  };

//TODO: boost number of http.request.count

};
