var path = require('path')
  , fs = require('fs')
  , manifest = require('../../src/manifest')
  , webpack = require('webpack')
  , glob = require('glob')
  , spdy = require('spdy')
  , winston = require('winston')
  , winstonMail = require('winston-mail')
  , nconf = require('nconf')
  , cluster = require('cluster-master')
  , polyfill = require('polyfills')
  , ejs = require('ejs')
  , utils = require('../utils');

var PELLET_BIN_PATH = path.resolve(__dirname, '..');
var LAUNCH_CWD = process.cwd();

module.exports = function(program, addToReadyQue) {

  program
    .command('server <manifest> [name]')
    .alias('run')
    .description('Start Pellet server')
    .option('-v, --verbose [silly|debug|verbose|info|warn|error]', 'verbose mode', false)
    .option('-n, --cluster:count <size>', 'number of process', 0)
    .option("--http:port <port>", "http server port", process.env.PORT || 3000)
    .option("--http:address <ip>", "http bind address", process.env.BIND_ADDR || "0.0.0.0")
    .option("--https:port <port>", "https server port", process.env.SSL_PORT || 3001)
    .option("--https:address <ip>", "https bind address", process.env.BIND_ADDR || "0.0.0.0")
    .option("--output <path>", "path to the pack file and base path for dist output", '___output.js')
    .option("--output-browser <dir>", "Directory browser packed version saved to", 'browser')
    .option("--output-node <dir>", "Directory nodejs packed version saved to", 'node')
    .option('--mode <prod|dev>', 'Packaging mode')
    .option("--es6", "run with es6 support", false)
    .option('--spdy', 'path to directory with spdy cert', false)
    .action(function (manifestGlob, name, options) {
      // setup a callback hook that lets this sub command register
      // the logic needed to execute when the parent process is ready.
      // We do this so the parent process can load all the config info
      // before execute ourself.
      addToReadyQue(function() {

        if(nconf.get('verbose')) {
          nconf.set('winston:containers:console:console:level', nconf.get('verbose'));
        }

        // setup the apps default logger and overwrite the javascript console to use our logger
        var pelletLogger = winston.loggers.add('pellet', nconf.get('winston:containers:console'));
        pelletLogger.extend(console);
        console.log = pelletLogger.info;

        // catch all uncaught exception and try to email them
        if(nconf.get('winston:containers:alert')) {
          var alertLogger = winston.loggers.add('alert', nconf.get('winston:containers:alert'));
          process.on("uncaughtException", function (err) {
            var body = 'Stack Trace:\n\n' + err.stack + '\n\n';

            // only include the system information if requested
            // in development mode this is a lot of information to parse
            if (nconf.get('stackTrace:includeSystemInfo')) {
              try {
                body += 'VERSION: ' + version + '\n';
                body += 'CWD: ' + process.cwd() + '\n';
                body += 'SYSTEM: ' + process.platform + ' pid: ' + process.pid;

                // on windows can not use getuid or getgid
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
        function resolveConfigPaths(fullpath) {
          fullpath = fullpath.replace('#CWD#', LAUNCH_CWD)
            .replace('#PELLET_BIN_DIR#', PELLET_BIN_PATH);

          if(fullpath.indexOf('#SERVER_STATIC_DIR#') != -1) {
            fullpath = fullpath.replace('#SERVER_STATIC_DIR#', resolveConfigPaths(nconf.get('server:static')));
          }

          return path.resolve(LAUNCH_CWD, path.normalize(fullpath));
        }

        // init the polyfill and rebuild cache is needed
        var polyfillOptions = nconf.get('polyfill');
        polyfillOptions.cache = resolveConfigPaths(polyfillOptions.cache);
        polyfill = polyfill(polyfillOptions);
        if(options.rebuild) {
          polyfill.clean();
        }

        if(!nconf.get('silent')) {
          console.info('Polyfill:', polyfillOptions);
          if(options.rebuild) {
            console.info('Cleaned Polyfill');
          }
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

        // build the webpack file (and pass the client/slaves the JSON file that defines
        // all our entry points. I need this to load all the the packages and map all the
        // static files.
        if(!process.env.CLUSTER_SLAVE) {
          var ourManifest = new manifest();
          var isInitLoad = true;

          // make sure the paths are absolute and resolve from cwd
          options.output = path.join(path.dirname(options.output), 'dist');
          options.outputBrowser = path.resolve(options.output, options.outputBrowser);
          options.outputNode = path.resolve(options.output, options.outputNode);

          if(options.mode) {
            if (options.mode.toLowerCase().trim().indexOf('prod') === 0) {
              options.mode = 'production';
            } else {
              options.mode = 'development';
            }
          }

          ourManifest.buildWebpackConfig(manifestGlob, options, function(err, config) {
            if (err) {
              console.error('Can not build Webpack config because:', err.message);
              process.exit(1);
            }

            // build a function that sync the two step build into a single step that
            // builds the manifest profile and map. This also handles duplicate errors
            var doneFn = utils.syncNodeAndBrowserBuilds(options.mode !== 'production',
              utils.buildManifestProfileAndMap(options, function(err, buildManifestMap, browserStats, nodeStats) {
                if (err) {
                  console.error('Can not build webpack files because:', err.message);
                  return;
                }

                if(isInitLoad) {
                  console.log('@@@@@', JSON.stringify(buildManifestMap, null,2));
                  isInitLoad = false;
                  return;
                }

                if(process.env.CLUSTER_SLAVE) {
                  cluster.restart();
                }
              }));

            config.browserConfig.bail = false;
            config.nodeConfig.bail = false;

            // start watching both
            webpack(config.browserConfig).watch(100, doneFn(0));
            webpack(config.nodeConfig).watch(100, doneFn(1));
          });
        }

        // after we have make sure we have all the configuration and error handling
        // start the cluster.
        if(options['cluster:count'] > 0 && !process.env.CLUSTER_SLAVE) {
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
              console.error("SLAVE %s %j", this.uniqueID, message);
            }
          });

          return;
        }

        var app, server;

        // using Koa for ES6 mode else express
        if('function' === typeof Map) {
          if(!nconf.get('silent')) {
            console.info('Running in ES6 mode');
          }

          // create Koa server
          server = require('koa');
          app = server();

        } else {
          if(!nconf.get('silent')) {
            console.info('Running in ES5 mode');
          }

          // create express server
          server = require('express');
          app = server();

          // setup express static assets including the facicon.ico (replace __DEFAULT_STATIC_DIR with pellet internal path)
          app.use(require('serve-favicon')(resolveConfigPaths(nconf.get('server:favicon'))));
          app.use(server.static(resolveConfigPaths(nconf.get('server:static'))));

          // create a polyfill endpoint
          app.use(function (req, res, next) {
            if (req.path !== '/js/polyfills.js') return next();

            polyfill(req.headers['user-agent']).then(function (data) {
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

              return polyfill.read(data.name, '.min.js.gz').then(function (buf) {
                res.end(buf)
              });
            }).catch(next);

          });
        }

        if(nconf.get('spdy')) {
          var spdyPath = resolveConfigPaths(nconf.get('spdy'));
          var opt = {
            key: fs.readFileSync(path.join(spdyPath, 'spdy-key.pem')),
            cert: fs.readFileSync(path.join(spdyPath, 'spdy-cert.pem')),
            ca: fs.readFileSync(path.join(spdyPath, 'spdy-ca.pem')),
            windowSize: 1024 * 1024,
            autoSpdy31: false
          };

          spdy.createServer(opt, app).listen(nconf.get('https:port'), function () {
            if(!nconf.get('silent')) {
              console.log('Listen on', nconf.get('https:port'), nconf.get('https:address'));
            }
          });
        } else {
          app.listen(nconf.get('http:port'), nconf.get('http:address'), nconf.get('http:max_syn_backlog'), function () {
            if(!nconf.get('silent')) {
              console.log('Listen on', nconf.get('http:port'), nconf.get('http:address'));
            }
          });
        }
      });

//TODO: boost number of http.request.count

    }).on('--help', function () {
      console.log(fs.readFileSync(path.join(__dirname, '..', 'help', 'server.txt')).toString());
    });
}
