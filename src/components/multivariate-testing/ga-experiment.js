var pellet = require('../../pellet');

function gaExperiment(experiments, config) {
  this.experiments = experiments;
  this.allVariations = (config && config.config) || {};
  this.instrument = pellet.instrumentation.namespace('ga_experiment');
  this.variationCache = {};
}

gaExperiment.prototype.select = function(name, ctx, experimentId, _renderOptions) {
  var i, type, choice, version, allExperiments;

  if(name === null) {
    return;
  }

  // find out the name's type. It can be a component
  // or a string if the format of '@component' or
  // '=variationValue' or just a string
  if(typeof name === 'function') {
    // look up the component's version/key
    for(i in pellet.components) {
      if(pellet.components[i] === name) {
        name = i;
        break;
      }
    }

    // if not found return undefined
    if(typeof name === 'function') {
      return;
    }

    name = name.substring(0, name.indexOf('@'));
    type = 1;
  } else if(typeof name !== 'string') {
    console.warn('GA experiment: invalid version experiment:', experimentId, 'type:', typeof name, 'name:', name);
    this.instrument.increment(experimentId + '.missing_component');
    throw new Error('invalid experiment version type');
  } else {
    if (name[0] === '@') {
      type = 1;
      name = name.substring(1);
    } else if (name[0] === '=') {
      type = 2;
      name = name.substring(1);
    }

    if (!name) {
      return;
    }

    // if the key has a version use the specified version
    // and ignore the experiment version
    if (type !== 2 && name.indexOf('@') !== -1) {
      return pellet.components[name];
    }

    if (type !== 1 && (i = name.indexOf('=')) !== -1) {
      return name.substring(i + 1);
    }
  }

  if(type === 1) {
    allExperiments = this.allVariations['@'+name];
  } else if(type === 2) {
    allExperiments = this.allVariations['='+name];
  } else {
    if((allExperiments = this.allVariations['@'+name])) {
      type = 1;
    } else if((allExperiments = this.allVariations['='+name])) {
      type = 2;
    }
  }

  // if no experiment data try to find the
  // default component or the variation value
  if(!allExperiments) {
    if(type === 1) return pellet.components[name];
    else if(type === 2) return name;
    return pellet.components[name] || name;
  }

  if(typeof experimentId === 'string') {
    if(!allExperiments[experimentId]) {
      console.warn('Cannot find component for experiment', experimentId, 'its missing from our variations list', allExperiments);
      this.instrument.increment(experimentId+'.missing_component');

      if(type === 1) return pellet.components[name];
      else if(type === 2) return name;
      return pellet.components[name] || name;
    }

    version = this.getVariation(experimentId);
    choice = allExperiments[experimentId][version];

  } else {
    for(i in allExperiments) {
      version = this.getVariation(i);
      version = allExperiments[i][version];

      if(choice && choice !== version) {
        console.warn('Ambiguous experiment cannot pick component because to many:', name, 'in', allExperiments);
        this.instrument.increment(allExperiments[i]+'.ambiguous');
      }

      choice = version;
    }
  }

  if(type === 1) {
    version = pellet.components[name+'@'+choice];
  } else if(type === 2) {
    version = choice;
  } else {
    version = pellet.components[name+'@'+choice] || name;
  }

  if(!version) {
    console.error('Cannot find component ', name, 'for choice', choice, 'because component not in manifest');
    this.instrument.increment((experimentId||'NA')+'.missing_component_choice');
    return pellet.components[name];
  }

  return version;
}

/**
 *
 * @param experimentId
 * @return {*} null if not participating, else 0-n
 */
gaExperiment.prototype.getVariation = function(experimentId) {
  if(experimentId in this.variationCache) {
    console.debug('experiment: using cache');
    return this.variationCache[experimentId];
  }

  var variation = cxApi.getChosenVariation(experimentId);
  if (variation === cxApi.NO_CHOSEN_VARIATION) {
    console.debug('experiment:', experimentId, 'NO_CHOSEN_VARIATION');
    variation = cxApi.chooseVariation(experimentId);
    cxApi.setChosenVariation(variation, experimentId);

    this.variationCache[experimentId] = variation;

    this.instrument.increment(experimentId+'.pick.'+variation);
  } else if (variation === cxApi.NOT_PARTICIPATING) {
    // not A/B testing
    console.debug('experiment:', experimentId, 'NOT_PARTICIPATING');
    this.instrument.increment(experimentId+'.not_participating');
    return null;
  }

  console.debug('experiment:', experimentId, 'using variation:', variation);
  return variation;
}

// Do not run GA experiments on SERVER
// only on the client.
if(process.env.BROWSER_ENV) {
  // wait for pellet to be initialized because
  // __pellet_gaExperiments is async loaded
  pellet.onReady(function () {
    pellet.setExperimentInterface(new gaExperiment(window.__pellet_gaExperiments, pellet.__gaExperimentConfig));
  });
}
