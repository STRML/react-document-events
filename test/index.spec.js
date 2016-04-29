'use strict';
/*eslint no-console: 0*/
var ReactDocumentEvents = require('../index');
var expect = require('chai').expect;
var React = require('react');
var ReactDOM = require('react-dom');
var ReactDOMServer = require('react-dom/server');
var jsdom = require('jsdom');

var DummyTarget = function() {
  this._events = {};
};
DummyTarget.prototype.addEventListener = function(name) {
  if (typeof this._events[name] !== 'number') this._events[name] = 0;
  this._events[name]++;
};
DummyTarget.prototype.removeEventListener = function(name) {
  this._events[name]--;
};

var DummyComponent = React.createClass({
  getDefaultProps: function() {
    return {enabled: true};
  },
  render: function() {
    return React.createElement('div', {},
      React.createElement('div', {}, 'Title'),
      React.createElement(ReactDocumentEvents, {
        enabled: this.props.enabled,
        target: this.props.target,
        onClick: function(e) {}
      })
    );
  }
});

var ParentComponent = React.createClass({
  getInitialState: function() {
    return {enabled: true};
  },
  render: function() {
    return React.createElement(DummyComponent, {
      key: 'barf',
      enabled: this.state.enabled,
      target: this.props.target
    });
  }
});

describe('react-document-events', function () {

  describe('Server rendering', function () {

    var originalWindow = global.window;
    var originalDocument = global.document;

    beforeEach(function () {
      // Remove window/document so we can be sure this works properly
      global.window = undefined;
      global.document = undefined;
    });

    afterEach(function () {
      global.window = originalWindow;
      global.document = originalDocument;
    });

    it('should not assign a listener when rendering to string', function () {
      var target = new DummyTarget();
      var str = ReactDOMServer.renderToStaticMarkup(React.createElement(DummyComponent, {
        target: target
      }));
      expect(str).to.equal('<div><div>Title</div><noscript></noscript></div>');
      expect(target._events).to.deep.equal({});
    });
  });

  describe('DOM tests', function () {

    var originalWindow = global.window;
    var originalDocument = global.document;

    beforeEach(function (done) {
      jsdom.env('<!doctype html><html><head></head><body></body></html>', function (error, window) {
        if (!error) {
          global.window = window;
          global.document = window.document;
        }

        done(error);
      });
    });

    afterEach(function () {
      global.window = originalWindow;
      global.document = originalDocument;
    });

    it('should assign a listener when mounted', function () {
      var target = new DummyTarget();
      var container = document.createElement('div');
      ReactDOM.render(React.createElement(DummyComponent, {
        target: target
      }), container);
      expect(target._events).to.deep.equal({click: 1});
      ReactDOM.unmountComponentAtNode(container);
      expect(target._events).to.deep.equal({click: 0});
    });

    it('should assign a listener to a target returned by a function', function () {
      var target = new DummyTarget();
      var container = document.createElement('div');
      ReactDOM.render(React.createElement(DummyComponent, {
        target: function() { return target; }
      }), container);
      expect(target._events).to.deep.equal({click: 1});
      ReactDOM.unmountComponentAtNode(container);
      expect(target._events).to.deep.equal({click: 0});
    });

    it('should attach/unattach listener when enabled/disabled', function () {
      var target = new DummyTarget();
      var container = document.createElement('div');
      var component = ReactDOM.render(React.createElement(ParentComponent, {
        target: target
      }), container);
      expect(target._events).to.deep.equal({click: 1});
      component.setState({enabled: false});
      expect(target._events).to.deep.equal({click: 0});
      component.setState({enabled: true});
      expect(target._events).to.deep.equal({click: 1});
      component.setState({enabled: false});
      expect(target._events).to.deep.equal({click: 0});
      ReactDOM.unmountComponentAtNode(container);
      // Expected another 'removeListener' call - this is okay, it's a noop
      expect(target._events).to.deep.equal({click: -1});
    });

    it('Should warn when attaching window events to document', function () {
      var container = document.createElement('div');
      var BadComponent = React.createClass({
        render: function() {
          return React.createElement(ReactDocumentEvents, {
            target: document,
            onResize: function(){}
          });
        }
      });
      var _warn = console.warn;
      var called = false;
      console.warn = function() { called = true; };
      ReactDOM.render(React.createElement(BadComponent), container);
      expect(called).to.equal(true);
      console.warn = _warn;
    });

    it('Should not warn when attaching window events to window', function () {
      var container = document.createElement('div');
      var GoodComponent = React.createClass({
        render: function() {
          return React.createElement(ReactDocumentEvents, {
            target: window,
            onResize: function(){}
          });
        }
      });
      var _warn = console.warn;
      var called = false;
      console.warn = function() { called = true; };
      ReactDOM.render(React.createElement(GoodComponent), container);
      expect(called).to.equal(false);
      console.warn = _warn;
    });
  });

});
