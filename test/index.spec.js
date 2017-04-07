'use strict';
/*eslint no-console: 0*/
const ReactDocumentEvents = require('../src/ReactDocumentEvents');
const expect = require('chai').expect;
const React = require('react');
const ReactDOM = require('react-dom');
const ReactDOMServer = require('react-dom/server');
const jsdom = require('jsdom');

const DummyTarget = function() {
  this._events = {};
};
DummyTarget.prototype.addEventListener = function(name) {
  if (typeof this._events[name] !== 'number') this._events[name] = 0;
  this._events[name]++;
};
DummyTarget.prototype.removeEventListener = function(name) {
  this._events[name]--;
};

class DummyComponent extends React.Component{
  render() {
    return React.createElement('div', {},
      React.createElement('div', {}, 'Title'),
      React.createElement(ReactDocumentEvents, {
        enabled: this.props.enabled,
        target: this.props.target,
        onClick(e) {}
      })
    );
  }
}
DummyComponent.defaultProps = {enabled: true};

class ParentComponent extends React.Component {
  constructor(props, state) {
    super(props, state);
    this.state = {enabled: true};
  }
  render() {
    return React.createElement(DummyComponent, {
      key: 'barf',
      enabled: this.state.enabled,
      target: this.props.target
    });
  }
}

describe('react-document-events', function () {

  describe('Server rendering', function () {

    const originalWindow = global.window;
    const originalDocument = global.document;

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
      const target = new DummyTarget();
      const str = ReactDOMServer.renderToStaticMarkup(React.createElement(DummyComponent, {
        target: target
      }));
      expect(str).to.equal('<div><div>Title</div></div>');
      expect(target._events).to.deep.equal({});
    });
  });

  describe('DOM tests', function () {

    const originalWindow = global.window;
    const originalDocument = global.document;

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
      const target = new DummyTarget();
      const container = document.createElement('div');
      ReactDOM.render(React.createElement(DummyComponent, {
        target: target
      }), container);
      expect(target._events).to.deep.equal({click: 1});
      ReactDOM.unmountComponentAtNode(container);
      expect(target._events).to.deep.equal({click: 0});
    });

    it('should assign a listener to a target returned by a function', function () {
      const target = new DummyTarget();
      const container = document.createElement('div');
      ReactDOM.render(React.createElement(DummyComponent, {
        target() { return target; }
      }), container);
      expect(target._events).to.deep.equal({click: 1});
      ReactDOM.unmountComponentAtNode(container);
      expect(target._events).to.deep.equal({click: 0});
    });

    it('should attach/unattach listener when enabled/disabled', function () {
      const target = new DummyTarget();
      const container = document.createElement('div');
      const component = ReactDOM.render(React.createElement(ParentComponent, {
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
      const container = document.createElement('div');
      class BadComponent extends React.Component{
        render() {
          return React.createElement(ReactDocumentEvents, {
            target: document,
            onResize(){}
          });
        }
      }
      const _warn = console.warn;
      let called = false;
      console.warn = function() { called = true; };
      ReactDOM.render(React.createElement(BadComponent), container);
      expect(called).to.equal(true);
      console.warn = _warn;
    });

    it('Should not warn when attaching window events to window', function () {
      const container = document.createElement('div');
      class GoodComponent extends React.Component{
        render() {
          return React.createElement(ReactDocumentEvents, {
            target: window,
            onResize(){}
          });
        }
      }
      const _warn = console.warn;
      let called = false;
      console.warn = function() { called = true; };
      ReactDOM.render(React.createElement(GoodComponent), container);
      expect(called).to.equal(false);
      console.warn = _warn;
    });
  });

});
