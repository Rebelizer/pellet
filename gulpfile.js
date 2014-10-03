'use strict';

var gulp = require('gulp')
  , gutil = require('gulp-util')
  , fs = require('fs')
  , path = require('path')
  , plugins = require('gulp-load-plugins')()
  , git = require("git-promise")
  , through = require('through2')
  , exec = require('child_process').exec
  , runSequence = require('run-sequence')
  , conventionalChangelog = require('conventional-changelog');

plugins.help(gulp);

// ###############################################
// CLEAN THE PROJECT
// ###############################################

gulp.task('clean', 'Clean all the build files', function(next) {
  gulp.src(['./doghouse/docs/**/*'
  ], {read: false})
    .pipe(require('gulp-print')())
    //.pipe(plugins.clean())
});

// ###############################################
// BUILD DOCS
// ###############################################

gulp.task('document', 'Build js documentation for the doghouse', function() {
  gulp.src(['./src/**/isomorphic-*.js', './docs/README.md'])
    .pipe((function(cb) {
      var files = [];

      return through.obj(function (file, enc, callback) {
          files.push(file.path);
          return callback();
        }, function (cb) {
          var cmd = path.join(__dirname, 'node_modules', 'jsdoc', 'jsdoc.js');
          cmd += ' -c ' + path.join(__dirname, 'doghouse', 'jsdoc-template', 'config.json');
          cmd += ' ' + files.join(' ');

          exec(cmd, function(err) {
            if(err) {
              gutil.log(err.message || err);
            }

            cb();
          });
        });
      })());
});

// ###############################################
// TESTS
// ###############################################

gulp.task('test', 'Run unit tests and exit on failure', function () {
  require('coffee-script/register');

  return gulp.src(['test/**/*.test.coffee', '!tests/karma/**'])
    .pipe(plugins.mocha({
      reporter: 'Spec' // dot
    }))
    .on('error', function (err) {
      //process.emit('exit');
    });
});

gulp.task('karma', 'in broswer love', function() {
  return gulp.src('tests/karma/**/*.spec.js')
    .pipe(plugins.karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function (err) {
      throw err;
    });
});

// ###############################################
// DEPLOYMENT SCRIPTS
// ###############################################

gulp.task('release', function(next) {
  git('stash').then(function(output) {
    function cleanUpStash(noCB) {
      git('stash pop').then(function(output) {
        if(!noCB) next();
      }).fail(function (err) {
        gutil.log('#### ERROR CLEANING UP GIT STASH!!!!');
        if(!noCB) next(err);
      });
    }

    git('pull origin master').then(function(output) {

      runSequence([/*'webpack-prod with clean',*/ 'test', 'document'], 'release:tag', function(err) {
        cleanUpStash();
      });

    }).fail(function (err) {cleanUpStash(true); next(err);});
  }).fail(function (err) {next(err);});

});


gulp.task('go', function(next) {
  gutil.log('hide demi');
  next(null);
});

gulp.task('release:tag', 'DO NOT USE! Use release', function(next) {
  var program = require('commander');

  program
    .option('-l, --label <path>', 'name')
    .option('-M, --major', 'bump the major version')
    .option('-m, --minor', 'bump the minor version')
    .option('-p, --patch', 'bump the patch version')
    .option('--prerelease', 'bump the patch version')
    .option('--start-tag <tag>', 'tag used as a starting point')
    .option('--end-tag <tag>', 'tag used as a ending point')

  program.parse(process.argv);

  var bumpOpt = {};
  if(program.major) {
    bumpOpt.type = 'major';
  } else if(program.minor) {
    bumpOpt.type = 'minor';
  } else if(program.prerelease) {
    bumpOpt.type = 'prerelease';
  } else {
    bumpOpt.type = 'patch';
  }

  fs.readFile('./package.json', 'utf8', function(err, data) {
    var pkg = JSON.parse(data);

    var changelog = {
      repository: pkg.repository.url,
      version: pkg.version,
      file: 'CHANGELOG.md'
    };

    if (program.label) {
      changelog.subtitle = program['label'];
    }

    if (program.startTag) {
      changelog.from = program.startTag;
    }

    if (program.endTag) {
      changelog.to = program.endTag;
    }

    gulp.src(['./package.json'])
      .pipe(plugins.bump(bumpOpt))
      .pipe(gulp.dest('./'))
      .on('error', next)
      .on('end', function () {
        conventionalChangelog(changelog, function (err, log) {
          if (err) return next(err);

          fs.writeFile('CHANGELOG.md', log, {flag: 'w', encoding: 'utf8'}, function (err) {
            if (err) return next(err);

            var tagName = 'v'+pkg.version;
            git('add package.json CHANGELOG.md').then(function() {
              git('commit -m "chore(release): '+tagName+'"').then(function() {
                git('tag -a "'+tagName+'" -m "Tagged '+new Date().toString()+'"').then(function() {
                  git('push origin master').then(function() {

                    if(fs.existsSync('.github-api-token')) {
                      fs.readFile('.github-api-token', function(err, data) {
                        if (err) return next(err);

                        var github = new require("github")({
                          version: "3.0.0",
                          protocol: "https",
                          timeout: 5000
                        });

                        github.authenticate({
                          type: "oauth",
                          token: data.toString().trim()
                        });

                        gutil.log('info>>>', tagName, changelog.subtitle, log)
                        github.releases.createRelease({
                          owner: 'Rebelizer',
                          repo: 'react-pellet',
                          tag_name: tagName,
                          name: tagName + (changelog.subtitle ? (' ' + changelog.subtitle) : ''),
                          body: log
                        }, function(err, res) {
                          gutil.log(JSON.stringify(res));
                          next(null);
                        });
                      });
                    } else {
                      next(null);
                    }

                  }).fail(function (err) {next(err);});
                }).fail(function (err) {next(err);});
              }).fail(function (err) {next(err);});
            }).fail(function (err) {next(err);});
          });
        });
      });
  });
});

