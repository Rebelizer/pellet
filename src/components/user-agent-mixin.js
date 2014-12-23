var pellet = require('pellet')

pellet.userAgentMixin = {
  getUA: function() {
    return (this.context.requestContext && this.context.requestContext.userAgentDetails) || {};
  }
};
