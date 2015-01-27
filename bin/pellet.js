#!/usr/bin/env node

"use strict";

var program = require('commander')
  , os = require('os')
  , util = require('util')
  , path = require('path')
  , fs = require('fs-extra')
  , nconf = require('nconf')
  , inquirer = require('inquirer')
  , utils = require('./utils')
  , version = require('../package.json').version
  , i;

process.env.SERVER_ENV = true;
process.env.BROWSER_ENV = false;

//todo: remove this because it was added for aws local run but I think I can use PELLET_CONF_DIR todo the same thing!
if(process.env.PELLET_DIR) {
  process.chdir(process.env.PELLET_DIR);
}

// monkey patch inquirer (nicer formatting)
for(i in inquirer.prompts) {
  inquirer.prompts[i].prototype.prefix = function (str) {
    return str;
  };
}

/**
 * search for the pellet config file
 * @param searchPath
 * @returns {*}
 */
function findPelletConfigFile(searchPath) {
  var filePath;

  searchPath = path.resolve(process.cwd(), searchPath);

  filePath = path.join(searchPath, '.pellet');
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // search parent folder for the manifest file
  filePath = path.resolve(searchPath, '..');

  // stop looking when we find the root dir
  if (filePath == searchPath) return null;
  return findPelletConfigFile(filePath);
}

// load the config by walk up (from CWD) looking for the .pellet config
var pelletConfigFile = findPelletConfigFile('.');
if(pelletConfigFile) {
  program.pelletConfig = JSON.parse(fs.readFileSync(pelletConfigFile));
  program.pelletConfig._filepath = pelletConfigFile;
}

program
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'environment config file (override common config)', process.env.NODE_ENV ? process.env.NODE_ENV : 'development')
  .option('--config-common <path>', 'path to common config file', 'common')
  .option('--config-dir <path>', 'path to config directory', process.env.PELLET_CONF_DIR ? path.resolve(process.cwd(), process.env.PELLET_CONF_DIR) : (pelletConfigFile ? path.resolve(pelletConfigFile, '..', program.pelletConfig.configDir) : path.join(__dirname, 'config')))
  .option('--command-dir <path>', 'path to directory containing additional commands', false)
  .option('--env-whitelist <string>', 'environment variable white list separated by ','', false)
  .option('--scrub-logs <string>', 'RegExp used to scrub launchDetails and logs', false)
  .option('--silent', 'will disable all pellet launch logging', false)
  .option('--launch-details', 'will print launch and env details', false);

var readyQue = [];
function addToReadyQue(onReadyFn) {
  readyQue.push(onReadyFn)
}

// scan for command extensions and load them
// i.e. anything starting with cmd-*.js
function mapFilter(basePath) {
  return fs.readdirSync(basePath).map(function(file) {
    if(/^cmd-.+\.js$/.test(file)) return path.join(basePath, file);
    else return false;
  });
}

// load our commands and any additional commands passed into --commandDir
var allCommandFiles = program.commandDir ? mapFilter(program.commandDir) : [];
allCommandFiles = allCommandFiles.concat(mapFilter(path.join(__dirname, 'commands')));
for(i in allCommandFiles) {
  if(allCommandFiles[i]) {
    require(allCommandFiles[i])(program, addToReadyQue);
  }
}

program.parse(process.argv);

// use
if(program.config) {
  if (program.config.toLowerCase().trim().indexOf('prod') === 0) {
    program.config = 'production';
  } if (program.config.toLowerCase().trim().indexOf('dev') === 0) {
    program.config = 'development';
  } if (program.config.toLowerCase().trim().indexOf('stag') === 0) {
    program.config = 'staging';
  }

  process.env.NODE_ENV = program.config;
}

// load the common and environment configuration files before building the nconf
// version because we need have access to things like security, envWhiteList to build
// the nconf. This is why we do not use the built in nconf load config file (nconf.add({type:'file'})) but use
// the memory loader. The load order is arguments -> common config -> environment config
var commonConfigFile = path.resolve(program.configDir, program.configCommon)
  , configFile = path.resolve(program.configDir, program.config)
  , commonConfig = utils.readConfigFile(commonConfigFile)
  , config = utils.readConfigFile(configFile);

if(!commonConfig || !config) {
  console.error('Cannot load common (', commonConfigFile, ') or environment (', configFile, ')');
  process.exit(1);
}

// the scrubLogs is a list of fields we do not want to
// console log in verbose mode i.e. username and passwords to database, etc.
program.scrubLogs = new RegExp(config.scrubLogs || commonConfig.scrubLogs ||
  program.scrubLogs || '\s(user|pass|aws_)\w*\s+.+$','igm');

// the envWhiteList is a list of environment variable
// we will load into the config link NODE_ENV
var envWhiteList = (config.envWhitelist || commonConfig.envWhitelist ||
  program.envWhitelist || 'NODE_ENV,PELLET_CONF_DIR').split(',');

// now build up the configuration starting with environment variable
// then override with the common config and environment config (i.e. dev vs prod)
nconf.env({separator: '__', whitelist:envWhiteList});
nconf.use('memory').merge(commonConfig);
nconf.use('memory').merge(config);

// overwrite configuration with argument passed in
utils.overwriteNconfWithArgs(nconf, program);

// show help and exit (no commands qued)
if(readyQue.length == 0) {
  program.help();
}

// show off!
if(!nconf.get('silent')) {
  console.log('\x1B[32m');
  console.log('            _ _      _                ,;:;;,');
  console.log(' ____   ___| | | ___| |_             ;;;;;');
  console.log('|  _ \\ / _ \\ | |/ _ \\ __|    .=\',    ;:;;:,');
  console.log('| |_) |  __/ | |  __/ |_    /_\', \"=. \';:;:;');
  console.log('|  __/ \\___|_|_|\\___|\\__|   @=:__,  \\\\,;:;:\'');
  console.log('|_|\x1b[33mReactJS favorite buddy\x1B[32m     _(\\\\.=  ;:;;\'');
  console.log('                             \x1B[32m`\"_(  _/=\"`\x1B[0m');
  console.log('\x1B[0m');
  console.log('Version:', version);

  if (nconf.get('launchDetails')) {
    console.log('System:', process.platform, 'pid:', process.pid, 'uid:', process.getuid(), 'gid:', process.getgid(), JSON.stringify(process.versions, null, 2).replace(/\\s+[{},\]]+/g, '').replace(/[{\[":,]/g, ''));
    console.log('Configuration ' + configFile + ' - ' + commonConfigFile + ':', JSON.stringify(nconf.get(), null, 2)
      .replace(/\s+[{},\]]+/g, '')
      .replace(/[{\[":,]/g, '')
      .replace(program.scrubLogs, '$1 ################'));
  }
}

// now exec the commands qued
for(i in readyQue) {
  readyQue[i](nconf);
}
