React = require('react')
//pellet = require('pellet')

module.exports = React.createClass({
  render: function() {
    return (
      <footer id="footer" role="contentinfo">
        <section className="section swatch-red-white has-top">
          <div className="decor-top">
            <svg className="decor" height="100%" preserveAspectRatio="none" version="1.1" viewBox="0 0 100 100" width="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0 L50 100 L100 0 L100 100 L0 100" strokeWidth={0} />
            </svg>
          </div>
          <div className="container">
            <div className="row">
              <div className="col-md-12 text-center">
                <div id="swatch_social-2" className="sidebar-widget  widget_swatch_social">
                  <ul className="unstyled inline small-screen-center social-icons social-background social-big">
                    <li>
                      <a target="_blank" href="http://www.twitter.com/vevo">
                        <i className="fa fa-twitter" />
                      </a>
                    </li>
                    <li>
                      <a target="_blank" href="https://github.com/Rebelizer">
                        <i className="fa fa-github" />
                      </a>
                    </li>
                    <li>
                      <a target="_blank" href="https://plus.google.com/+VEVO/posts">
                        <i className="fa fa-google-plus" />
                      </a>
                    </li>
                    <li>
                      <a target="_blank" href="http://www.vevo.com">
                        <i className="fa fa-heart-o" />
                      </a>
                    </li>
                  </ul>
                </div>
                <div id="text-4" className="sidebar-widget widget_text">
                  <div className="textwidget">2014 ALL RIGHTS RESERVED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </footer>
    );
  }
});
