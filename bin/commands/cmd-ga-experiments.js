var path = require('path')
  , fs = require('fs')
  , inquirer = require('inquirer')
  , async = require('async')
  , google = require('googleapis')
  , manifest = require('../../src/manifest')
  , utils = require('../utils')
  , exec = require('child_process').exec
  , ejs = require('ejs');

var analytics = google.analytics('v3');

var CWD = process.cwd();

module.exports = function(program, addToReadyQue) {

  var PELLET_PROJECT_PATH = (program.pelletConfig && program.pelletConfig._filepath && path.dirname(program.pelletConfig._filepath)) || CWD;

  program
    .command('gaexperiments')
    .alias('gaexp')
    .description('Build GA A/B/N experiment config')
    .option('--output <path>', 'output directory', PELLET_PROJECT_PATH)
    .option('--name <name>', 'name of config file', 'ga_abn_config.js')
    .option('--filter <regex>', 'filter', (program.pelletConfig && program.pelletConfig.abnFilter) || "\\(active\\)")

    .action(function (options) {
      // setup a callback hook that lets this sub command register
      // the logic needed to execute when the parent process is ready.
      // We do this so the parent process can load all the config info
      // before execute ourself.
      addToReadyQue(function() {
        var configPath = path.join(PELLET_PROJECT_PATH, '.ga-experiments');

        // make sure the paths are absolute and resolve from cwd
        options.output = path.resolve(CWD, options.output);
        options.filter = new RegExp(options.filter, 'i');

        function accessGA(config) {

          function dumpExperiments(config) {

            // create a oauth credentials to access GA analytics
            var oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({
              access_token: config.access_token,
              refresh_token: config.refresh_token
            });

            // prompt the user for what analytics a/b/n they want to use
            inquirer.prompt([{
              type: 'input',
              name: 'accountId',
              message: 'Account Id',
              'default': config.accountId
            },{
              type: 'input',
              name: 'webPropertyId',
              message: 'Web Property Id',
              'default': config.webPropertyId
            },{
              type: 'input',
              name: 'profileId',
              message: 'Profile Id',
              'default': config.profileId
            }], function(answer) {
              answer.auth = oauth2Client;

              // update the config for next time the user
              // runs this command. This will also update
              // email account, etc.
              config.accountId = answer.accountId;
              config.webPropertyId = answer.webPropertyId;
              config.profileId = answer.profileId;

              var bk_access_token = config.access_token; delete config.access_token;
              fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
              config.access_token = bk_access_token;

              // now ask for all the experiments so we can extract (titles to build out abn details file)
              analytics.management.experiments.list(answer, function (err, body) {
                if (err) {
                  console.error('\nCannot get experiments list because:', err.message, '\n');

                  // force the user to reauth
                  if(err.code === 401) {
                    config.access_token = null;
                    config.refresh_token = null;
                    config.emailAccount = null;

                    accessGA(config);
                  }
                } else {
                  var i, j, k, experimentId, variations, details, parts, key, emptyVariations;
                  var validate = {};
                  var output = {
                    experiments: [],
                    config: {}
                  };

                  console.info('\n');

                  body = body.items;
                  i = body.length;
                  while(i--) {
                    if(body[i].status === 'ENDED') {
                      console.info('Skip ended experiment:', body[i].name);
                      continue;
                    }

                    if(body[i].status === 'DRAFT') {
                      console.info('Skip draft experiment:', body[i].name);
                      continue;
                    }
                    if(!body[i].name.match(options.filter)) {
                      console.log('Skip filtered experiment:', body[i].name, '(name dosn\'t match', options.filter.toString()+')');
                      continue;
                    }

                    console.log('Adding', body[i].status.toLowerCase(), 'experiment:', body[i].name);

                    experimentId = body[i].id;
                    output.experiments.push(experimentId);

                    variations = body[i].variations;
                    validate[experimentId] = variations.length;

                    for(j=0; j < variations.length; j++) {
                      details = variations[j].name.split(';');
                      //validateCount = variations[j].variations.length;
                      k = details.length;

                      emptyVariations = true;
                      while(k--) {
                        parts = details[k].trim().match(/(.+)([@=])(.+)/);
                        if(parts) {
                          emptyVariations = false;
                          key = parts[2] + parts[1];

                          if(!output.config[key]) {
                            output.config[key] = {};
                          }

                          if(!output.config[key][experimentId]) {
                            output.config[key][experimentId] = [];
                          }

                          output.config[key][experimentId].push(parts[3]);
                          validate[experimentId].versions++;
                        }
                      }

                      if(emptyVariations) {
                        validate[experimentId]--;
                      }
                    }
                  }

                  if(output.experiments.length) {

                    console.log(JSON.stringify(output, null, 2)
                      .replace(/\s+[{},\]]+/g, "")
                      .replace(/[{\[":,]/g, ""));

                    k = false;
                    for (i in output.config) {
                      details = output.config[i];
                      for (j in details) {
                        if (details[j].length !== validate[j]) {
                          if (!k) {
                            console.log('\n#######################################################\n')
                            k = true;
                          }
                          console.log('WARNING!!', '"' + i + '"', 'has the wrong number of variations');
                          console.log('          for', j, 'found', details[j].length, 'and', validate[j], 'required.\n');
                        }
                      }
                    }

                    if (k) {
                      console.log('Please make sure you each experiment has the correct');
                      console.log('number of variations for each component or value or');
                      console.log('the default version (non test version) will be used');
                      console.log('instead.');
                      console.log('\n#######################################################\n')
                    }
                  }

                  // TODO: because we have all the information need to pick variations
                  // we can load the existing manifest and generate new manifest for each
                  // test. Then we can build all the manifest files.
                  // Then we can build a file to can be loaded by the broswer that will have
                  // this mapping for variations to what manifest packing we wnat to use.

                  var outputPath = path.join(options.output, options.name);
                  output = JSON.stringify(output);
                  output = 'var pellet = require("pellet"); pellet.__gaExperimentConfig =' + output+';';
                  fs.writeFileSync(outputPath, output);

                  // try to find and load the manifestFile to add our data
                  var manifestFile = utils.getManifestFile(options.output);
                  var newManifest = new manifest();
                  newManifest.load(manifestFile, {ignoreUpdatingWebpackEP:true}, function(err) {
                    if(newManifest.manifest['ga_experiment@0.0.0']) {
                      console.log('\nDONE\n');
                      return;
                    }

                    inquirer.prompt({
                      type: 'confirm',
                      name: 'isOk',
                      'default': true,
                      message: 'Update ' + manifestFile
                    }, function(answer) {
                      if(answer.isOk) {
                        var newComponent = {
                          name: 'ga_experiment',
                          version: '0.0.0',
                          'code': '.' + path.sep + path.relative(path.dirname(manifestFile),outputPath)
                        };

                        newManifest.merge(manifestFile, newComponent, {ignoreUpdatingWebpackEP:true, overwrite:true}, function(err) {
                          if(err) {
                            console.error('Cannot create manifest because:', err.message);
                          }

                          newManifest.save(manifestFile, function(err) {
                            if(err) {
                              console.error('Error updating manifest file', manifestFile);
                              return;
                            }

                            console.log('\nDONE\n');
                          });
                        });
                      }
                    });
                  });
                }
              });
            });
          }

          // If no emailAccount the use has not granted us permission
          // to access GA so prompt the user to sign-in
          if(!config.emailAccount) {
            var oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, config.redirect_url);

            var url = 'https://accounts.google.com/o/oauth2/auth?redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&client_id='+config.client_id+'&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly&approval_prompt=force&access_type=offline'
            console.log('Make sure your sign-in as the user that has access to GA');
            console.log('Please visit, accept, and copy the authorization code:');
            console.log(url + '\n');
            exec('open "' + url + '"');

            inquirer.prompt([{
              type: 'input',
              name: 'authorization_code',
              message: 'Authorization Code'
            },{
              type: 'input',
              name: 'emailAccount',
              message: 'Account Email'
            }], function(answer) {
              config.emailAccount = answer.emailAccount;

              var bk_access_token = config.access_token; delete config.access_token;
              fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
              config.access_token = bk_access_token;

              var oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret, config.redirect_url);
              oauth2Client.getToken(answer.authorization_code, function(err, tokens) {
                if(err) {
                  console.error('\nError accessing ga because:', err.code, err.message);
                  console.log();
                  return;
                }

                config.access_token = tokens.access_token;
                config.refresh_token = tokens.refresh_token;
                config.expiry_date = tokens.expiry_date;

                dumpExperiments(config);
              });
            });

            return;
          }

          // At this point the user has granted us access to GA
          // so we can ask google to get us a token on behalf
          // of the user
          var authClient = new google.auth.JWT(
              config.account_email,
          	  path.join(options.output, '.ga.pem'),
              null,
              ['https://www.googleapis.com/auth/analytics', 'https://www.googleapis.com/auth/analytics.readonly'],
              config.emailAccount);

          authClient.authorize(function(err, tokens) {
            if (err) {
              console.log('Cannot authorize', config.emailAccount, 'because:', err);
              config.emailAccount = null;

              accessGA(config);
              return;
            }

            config.access_token = tokens.access_token;
            config.refresh_token = tokens.refresh_token;

            dumpExperiments(config);
          });
        }

        if(!fs.existsSync(configPath)) {
          console.log('\nTo enable google a/b/n testing you will need to')
          console.log('update you common.json to include');
          console.log('application.options.googleExperiments.');

          console.log('\nThen you need to create a google service');
          console.log('that will manage access to you GA data.');

          console.log('\nVisit: http://console.developers.google.com');
          console.log('Create a new Project\n');
          console.log('Click on APIs & auth > Consent screen (left hand side)');
          console.log('and fill out the required fields and click save\n');

          console.log('Click on APIs & auth > Credentials (left hand side)');
          console.log('Click on "Create new Client ID" under the OAuth');
          console.log('Click on "Service account"');
          console.log('Download the {your-file}.p12 to', options.output);
          console.log('On command line run "openssl pkcs12 -in '+options.output+'/{your-file}.p12 -out '+options.output+'/.ga.pem -nocerts -nodes"');
          console.log('At prompt type "notasecret"');
          console.log('\nNOTE: DO NOT share this pem file with anyone!');

          inquirer.prompt([{
            type: 'input',
            name: 'account_email',
            message: 'Service Account Email Address'
          }], function(answer2) {

            console.log('\nNow create a google app that pellet can oauth ageist');
            console.log('to access your GA data on your behalf.');

            console.log('\nVisit: http://console.developers.google.com');
            console.log('Click on APIs & auth > APIs (left hand side)');
            console.log('Find Analytics API and click on OFF (so its trued ON)');
            console.log('\nThen click on APIs & auth > Credentials (left hand side)');
            console.log('Click on "Create new Client ID" under the OAuth');
            console.log('Click on "Installed application"');
            console.log('Click on "Other"');
            console.log('\n');

            inquirer.prompt([{
              type: 'input',
              name: 'client_id',
              message: 'Native App Client Id'
            },{
              type: 'input',
              name: 'client_secret',
              message: 'Native App Client Secret'
            }], function(answer) {
              answer.account_email = answer2.account_email;
              answer.redirect_url = 'urn:ietf:wg:oauth:2.0:oob';

              var bk_access_token = answer.access_token; delete answer.access_token;
              fs.writeFileSync(configPath, JSON.stringify(answer, null, 2));
              answer.access_token = bk_access_token;

              accessGA(answer);
            });
          });

        } else {
          accessGA(JSON.parse(fs.readFileSync(configPath).toString()));
        }
      });
    }).on('--help', function () {
      console.log(fs.readFileSync(configPath.join(__dirname, '..', 'help', 'gaexperiments.txt')).toString());
    });
};



