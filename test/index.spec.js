'use strict';
/*eslint no-console: 0*/
const ReactDocumentEvents = require('../src/ReactDocumentEvents');
const expect = require('chai').expect;
const React = require('react');
const {createRoot} = require('react-dom/client');
const ReactDOMServer = require('react-dom/server');
const {JSDOM} = require('jsdom');
const {act} = require('react');

const DummyTarget = function() {
  this.eventListenerCount = {};
  this.eventListeners = {};
  this.eventListenerOptions = {};
};
DummyTarget.prototype.addEventListener = function(name, callback, options) {
  if (typeof this.eventListenerCount[name] !== "number") {
    this.eventListenerCount[name] = 0;
  }
  this.eventListenerCount[name]++;
  this.eventListeners[name] = callback;
  this.eventListenerOptions[name] = options;
};
DummyTarget.prototype.removeEventListener = function(name, callback) {
  if (this.eventListeners[name] !== callback) return;
  this.eventListenerCount[name]--;
  delete this.eventListeners[name];
  delete this.eventListenerOptions[name];
};

// Target that uses legacy IE attachEvent/detachEvent API
const LegacyTarget = function() {
  this.eventListenerCount = {};
  this.eventListeners = {};
};
LegacyTarget.prototype.attachEvent = function(name, callback) {
  // IE uses 'onclick' format
  const eventName = name.replace(/^on/, '');
  if (typeof this.eventListenerCount[eventName] !== "number") {
    this.eventListenerCount[eventName] = 0;
  }
  this.eventListenerCount[eventName]++;
  this.eventListeners[eventName] = callback;
};
LegacyTarget.prototype.detachEvent = function(name, callback) {
  const eventName = name.replace(/^on/, '');
  if (this.eventListeners[eventName] !== callback) return;
  this.eventListenerCount[eventName]--;
  delete this.eventListeners[eventName];
};

class DummyComponent extends React.Component {
  renderCount = 0;
  getDocumentEvents() {
    return this.docRef;
  }
  render() {
    this.renderCount++;

    const documentEventsProps = Object.assign(
      { onClick: (e) => {} },
      this.props,
      { ref: (c) => { this.docRef = c; } },
    );

    return (
      <div>
        <div>Title</div>
        <ReactDocumentEvents {...documentEventsProps} />
      </div>
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
      expect(target.eventListenerCount).to.deep.equal({});
    });
  });

  describe('DOM tests', function () {

    const originalWindow = global.window;
    const originalDocument = global.document;

    beforeEach(function () {
      const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
      global.window = dom.window;
      global.document = dom.window.document;
    });

    afterEach(function () {
      global.window = originalWindow;
      global.document = originalDocument;
    });

    it('should assign a listener when mounted', function () {
      const target = new DummyTarget();
      const container = document.createElement('div');
      const root = createRoot(container);
      act(() => {
        root.render(React.createElement(DummyComponent, {
          target: target
        }));
      });
      expect(target.eventListenerCount).to.deep.equal({click: 1});
      act(() => {
        root.unmount();
      });
      expect(target.eventListenerCount).to.deep.equal({click: 0});
    });

    it('should assign a listener to a target returned by a function', function () {
      const target = new DummyTarget();
      const container = document.createElement('div');
      const root = createRoot(container);
      act(() => {
        root.render(React.createElement(DummyComponent, {
          target() { return target; }
        }));
      });
      expect(target.eventListenerCount).to.deep.equal({click: 1});
      act(() => {
        root.unmount();
      });
      expect(target.eventListenerCount).to.deep.equal({click: 0});
    });

    it('should attach/unattach listener when enabled/disabled', function () {
      const target = new DummyTarget();
      const container = document.createElement('div');
      const root = createRoot(container);
      let component;
      act(() => {
        root.render(React.createElement(ParentComponent, {
          target: target,
          ref: (c) => { component = c; }
        }));
      });
      expect(target.eventListenerCount).to.deep.equal({click: 1});
      act(() => {
        component.setState({enabled: false});
      });
      expect(target.eventListenerCount).to.deep.equal({click: 0});
      act(() => {
        component.setState({enabled: true});
      });
      expect(target.eventListenerCount).to.deep.equal({click: 1});
      act(() => {
        component.setState({enabled: false});
      });
      expect(target.eventListenerCount).to.deep.equal({click: 0});
      act(() => {
        root.unmount();
      });
      // Expected another 'removeListener' call - this is okay, it's a noop.
      // Count should equal 0 because the function is gone.
      expect(target.eventListenerCount).to.deep.equal({click: 0});
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
      const root = createRoot(container);
      act(() => {
        root.render(React.createElement(BadComponent));
      });
      expect(called).to.equal(true);
      console.warn = _warn;
      act(() => {
        root.unmount();
      });
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
      const root = createRoot(container);
      act(() => {
        root.render(React.createElement(GoodComponent));
      });
      expect(called).to.equal(false);
      console.warn = _warn;
      act(() => {
        root.unmount();
      });
    });

    it('Should automatically set `target`', function () {
      const container = document.createElement('div');
      let renderedComponent;
      const root = createRoot(container);
      act(() => {
        root.render(
          <DummyComponent ref={(c) => { renderedComponent = c; }} />
        );
      });
      const docEvents = renderedComponent.getDocumentEvents();
      expect(docEvents.getTarget()).to.equal(global.document);
      act(() => {
        root.unmount();
      });
    });

    it('Should automatically get correct `target` in a new window', function () {
      const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
      const {createPortal} = require('react-dom');
      class WindowHoister extends React.Component {
        state = {mounted: false};
        componentDidMount() {
          this.openChild();
          this.setState({mounted: true});
        }
        openChild() {
          this.containerEl = document.createElement('div');
          dom.window.document.body.appendChild(this.containerEl);
        }
        render() {
          if (!this.state.mounted) return null;
          return createPortal(this.props.children, this.containerEl);
        }
      }

      let renderedComponent;
      const container = document.createElement('div');
      const root = createRoot(container);
      act(() => {
        root.render(
          <WindowHoister><DummyComponent ref={(c) => { renderedComponent = c; }}/></WindowHoister>
        );
      });
      const docEvents = renderedComponent.getDocumentEvents();
      expect(docEvents.getTarget()).to.equal(dom.window.document);
      act(() => {
        root.unmount();
      });
    });

    it("calls the latest listener passed in", () => {
      const target = new DummyTarget();
      let correctOnClickHandlerCalled = false;
      const firstOnClick = () => {};
      const secondOnClick = () => {
        correctOnClickHandlerCalled = true;
      };
      const container = document.createElement("div");
      let component;
      const root = createRoot(container);
      act(() => {
        root.render(<DummyComponent target={target} onClick={firstOnClick} ref={(c) => { component = c; }} />);
      });
      target.eventListeners.click();
      expect(correctOnClickHandlerCalled).to.equal(false);

      // This doesn't look like a rerender of the same component, but it is - key hasn't changed so it's
      // not a full remount
      act(() => {
        root.render(<DummyComponent target={target} onClick={secondOnClick} ref={(c) => { component = c; }} />);
      });
      target.eventListeners.click();
      expect(component.renderCount).to.equal(2);
      expect(correctOnClickHandlerCalled).to.equal(true);

      act(() => {
        root.unmount();
      });
    });

    it("can add or remove listeners in updates", () => {
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);
      act(() => {
        root.render(<DummyComponent target={target} onMouseDown={() => {}} />);
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 1, mousedown: 1 });

      act(() => {
        root.render(<DummyComponent target={target} onMouseOver={() => {}} />);
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 1, mousedown: 0, mouseover: 1 });

      act(() => {
        root.unmount();
      });
    });

    it("should pass capture option to addEventListener (fallback mode)", () => {
      // In JSDOM, passive event listeners are not supported, so the component
      // falls back to passing just the capture boolean as the third argument
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);
      act(() => {
        root.render(
          <ReactDocumentEvents target={target} capture={true} onClick={() => {}} />
        );
      });
      // When passive is not supported, options is just the capture boolean
      expect(target.eventListenerOptions.click).to.equal(true);
      act(() => {
        root.unmount();
      });
    });

    it("should default capture to false", () => {
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);
      act(() => {
        root.render(
          <ReactDocumentEvents target={target} onClick={() => {}} />
        );
      });
      // Default capture is false
      expect(target.eventListenerOptions.click).to.equal(false);
      act(() => {
        root.unmount();
      });
    });

    it("should handle multiple event types simultaneously", () => {
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);
      const calls = [];
      act(() => {
        root.render(
          <ReactDocumentEvents
            target={target}
            onClick={() => calls.push('click')}
            onKeyDown={() => calls.push('keydown')}
            onMouseMove={() => calls.push('mousemove')}
          />
        );
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 1, keydown: 1, mousemove: 1 });

      // Trigger all events
      target.eventListeners.click();
      target.eventListeners.keydown();
      target.eventListeners.mousemove();
      expect(calls).to.deep.equal(['click', 'keydown', 'mousemove']);

      act(() => {
        root.unmount();
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 0, keydown: 0, mousemove: 0 });
    });

    it("should rebind handlers when target changes", () => {
      const target1 = new DummyTarget();
      const target2 = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);

      act(() => {
        root.render(<ReactDocumentEvents target={target1} onClick={() => {}} />);
      });
      expect(target1.eventListenerCount).to.deep.equal({ click: 1 });
      expect(target2.eventListenerCount).to.deep.equal({});

      // Switch targets only (same handlers)
      act(() => {
        root.render(<ReactDocumentEvents target={target2} onClick={() => {}} />);
      });
      expect(target1.eventListenerCount).to.deep.equal({ click: 0 });
      expect(target2.eventListenerCount).to.deep.equal({ click: 1 });

      act(() => {
        root.unmount();
      });
      expect(target2.eventListenerCount).to.deep.equal({ click: 0 });
    });

    it("should rebind handlers when target function returns different value", () => {
      const target1 = new DummyTarget();
      const target2 = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);

      act(() => {
        root.render(<ReactDocumentEvents target={() => target1} onClick={() => {}} />);
      });
      expect(target1.eventListenerCount).to.deep.equal({ click: 1 });

      // Switch to a function returning a different target
      act(() => {
        root.render(<ReactDocumentEvents target={() => target2} onClick={() => {}} />);
      });
      expect(target1.eventListenerCount).to.deep.equal({ click: 0 });
      expect(target2.eventListenerCount).to.deep.equal({ click: 1 });

      act(() => {
        root.unmount();
      });
    });

    it("should handle removing a handler in update", () => {
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);

      act(() => {
        root.render(
          <ReactDocumentEvents target={target} onClick={() => {}} onKeyDown={() => {}} />
        );
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 1, keydown: 1 });

      // Remove onKeyDown handler - triggers rebind because keys changed
      act(() => {
        root.render(
          <ReactDocumentEvents target={target} onClick={() => {}} />
        );
      });
      // After rebind: old handlers removed, new handlers added
      expect(target.eventListenerCount).to.deep.equal({ click: 1, keydown: 0 });
      expect(target.eventListeners.click).to.be.a('function');
      expect(target.eventListeners.keydown).to.be.undefined;

      act(() => {
        root.unmount();
      });
    });

    it("should use attachEvent/detachEvent when addEventListener not available", () => {
      const target = new LegacyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);

      act(() => {
        root.render(<ReactDocumentEvents target={target} onClick={() => {}} />);
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 1 });

      act(() => {
        root.unmount();
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 0 });
    });

    it("should handle rapid enable/disable toggling without leaking listeners", () => {
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);
      let component;

      act(() => {
        root.render(
          <ParentComponent target={target} ref={(c) => { component = c; }} />
        );
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 1 });

      // Rapidly toggle enabled state
      for (let i = 0; i < 10; i++) {
        act(() => {
          component.setState({ enabled: false });
        });
        act(() => {
          component.setState({ enabled: true });
        });
      }

      // Should still have exactly 1 listener
      expect(target.eventListenerCount).to.deep.equal({ click: 1 });

      // Disable and verify cleanup
      act(() => {
        component.setState({ enabled: false });
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 0 });

      act(() => {
        root.unmount();
      });
    });

    it("should not bind handlers when initially disabled", () => {
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);

      act(() => {
        root.render(
          <ReactDocumentEvents target={target} enabled={false} onClick={() => {}} />
        );
      });
      expect(target.eventListenerCount).to.deep.equal({});

      act(() => {
        root.unmount();
      });
    });

    it("should bind handlers when enabled changes from false to true", () => {
      const target = new DummyTarget();
      const container = document.createElement("div");
      const root = createRoot(container);

      act(() => {
        root.render(
          <ReactDocumentEvents target={target} enabled={false} onClick={() => {}} />
        );
      });
      expect(target.eventListenerCount).to.deep.equal({});

      act(() => {
        root.render(
          <ReactDocumentEvents target={target} enabled={true} onClick={() => {}} />
        );
      });
      expect(target.eventListenerCount).to.deep.equal({ click: 1 });

      act(() => {
        root.unmount();
      });
    });
  });

});
