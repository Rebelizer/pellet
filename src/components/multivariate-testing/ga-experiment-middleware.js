var pellet = require('pellet')
  , superAgent = require('superagent')
  , async = require('async')
  , config = pellet.options.googleExperiments;

// NOTE: you can use http://jsbeautifier.org/ to view https://www.google-analytics.com/cx/api.js?experiment
// to build the regex
var EXTRACT_EXPERIMENT_DATA = /experiments_=(.*);([A-Z])\.DEFAULT/m;

if(config) {

  console.info('Google Experiments: Load middleware at', config.bootloaderPath);

  pellet.middlewareStack.push({
    priority: 7,
    fn: function(req, res, next) {
      var experiments, experiment, gaCode, gaExperiments = {};

      if (req.path.indexOf(config.bootloaderPath) !== 0) {
        return next();
      }

      if(req.path === config.bootloaderPath) {
        if(!pellet.__gaExperimentConfig) {
          return next();
        }

        experiments = pellet.__gaExperimentConfig.experiments;
      } else {
        experiments = req.path.substring(config.bootloaderPath.length).split(',');
      }

      var i = experiments.length
        , count = i;

      console.debug('Google Experiments: bootloader:', experiments);

      function done(experiment) {
        return function(err, response) {
          if(err || response.status !== 200) {
            count = -1;
            res.writeHead(500, {'Content-Type': 'text/javascript'});
            res.end();

            console.error('Google Experiments: Cannot load', experiment, 'because:', err&&(err.message||err), response&&(response.status + ' - ' + response.text));
          }

          //console.debug('Google Experiments: GET:', response.text);

          if(experiment === null) {
            gaCode = response.text;
          } else {
            try {
              gaExperiments[experiment] = JSON.parse(response.text.match(EXTRACT_EXPERIMENT_DATA)[1])[experiment];
            } catch(ex) {
              count = -1;
              res.writeHead(500, {'Content-Type': 'text/javascript'});
              res.end();
              console.error('Google Experiments: Cannot load', experiment, 'because parsing error:', ex.message||ex);
            }
          }

          if(count-- === 0) {
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            gaCode = gaCode.replace(EXTRACT_EXPERIMENT_DATA, 'experiments_=window.__pellet_gaExperiments='+JSON.stringify(gaExperiments)+';$2.DEFAULT');

            gaCode += ';console.log(window.__pellet_gaExperiments);';

            res.end(gaCode);

            //console.debug('Google Experiments: code', JSON.stringify(gaExperiments,null,2));
          }
        }
      }

      // now get the raw version so we can patch the file with out version
      superAgent.get('https://www.google-analytics.com/cx/api.js').end(done(null));

      // get all the experiment to extract the GA code
      while(i--) {
        experiment = experiments[i];
        //console.debug('Google Experiments: request:', 'http://www.google-analytics.com/cx/api.js?experiment='+experiment);
        superAgent.get('https://www.google-analytics.com/cx/api.js?experiment='+experiment).end(done(experiment));
      }
    }
  });
}
