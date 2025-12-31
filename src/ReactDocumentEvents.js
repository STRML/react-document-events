'use strict';
const React = require('react');
const PropTypes = require('prop-types');
const {NODE_ENV} = process.env;
let EventKeys = {};
if (NODE_ENV !== 'production') {
  // Gated behind flag so bundlers can strip the import
  EventKeys = require('./events');  // arrays of event names
}

class DocumentEvents extends React.Component {
  static displayName = 'DocumentEvents';
  static defaultProps = {
    capture: false,
    enabled: true,
    passive: false,
  };

  // Handler storage. Required so we can maintain a constant reference
  // and properly unbind handlers.
  _allHandlers = {};

  // propTypes are generated at bottom of file from all possible events
  componentDidMount() {
    if (this.props.enabled) this.bindHandlers(this.props);
  }

  componentWillUnmount() {
    this.unbindHandlers(this.props);
  }

  componentDidUpdate(prevProps) {
    const keysChanged = Object.keys(this.props).sort().toString() !== Object.keys(prevProps).sort().toString();
    const targetChanged = this.getTarget(prevProps) !== this.getTarget(this.props);

    if (keysChanged || targetChanged) {
      // Handlers or target changed. Rebind.
      this.unbindHandlers(prevProps);
      if (this.props.enabled) this.bindHandlers(this.props);
    } else if (!prevProps.enabled && this.props.enabled) {
      // We became enabled
      this.bindHandlers(this.props);
    } else if (prevProps.enabled && !this.props.enabled) {
      // We became disabled
      this.unbindHandlers(prevProps);
    }
  }

  // Returns an array of event names created from event handler names.
  // For example, `onMouseOver` becomes `['onMouseOver', 'mouseover']`
  getKeys(props) {
    props = props || this.props;
    const isWindow = props.target === window;

    return Object.keys(props)
    .filter((k) => k.slice(0, 2) === 'on')
    .map((k) => {
      if (NODE_ENV !== 'production' && EventKeys.windowEvents.indexOf(k) !== -1 && !isWindow) {
        // eslint-disable-next-line
        console.warn("You attached the handler " + k + ", but this handler is only valid on the Window object.");
      }
      return [k, k.slice(2).toLowerCase()];
    });
  }

  // Returns the target we're meant to attach events to.
  getTarget(props) {
    props = props || this.props;
    let target = typeof props.target === 'function' ? props.target() : props.target;
    // Ensure that, by default, we get the ownerDocument of our render target
    // Useful if we render into <iframe>s or new windows.
    if (!target) target = this.node && this.node.ownerDocument;
    return target;
  }

  bindHandlers(props) {
    this._adjustHandlers(on, props);
  }

  unbindHandlers(props) {
    this._adjustHandlers(off, props);
  }

  _adjustHandlers(fn, props) {
    const target = this.getTarget(props);
    if (!target) return;
    const options = {passive: props.passive, capture: props.capture};
    this.getKeys(props).forEach(([eventHandlerName, eventName]) => {
      // Note that this is a function that looks up the latest handler on `this.props`.
      // This ensures that if the function in `props` changes, the most recent handler will
      // still be called, so it's intentional that we're calling on `this.props` and not on `props`.

      // Storage in _allHandlers ensures that when we call unbindHandlers(), the handler is
      // properly removed.
      const handler = this._allHandlers[eventHandlerName] || ((event) => this.props[eventHandlerName](event));
      this._allHandlers[eventHandlerName] = handler;
      fn(target, eventName, handler, options);
    });
  }

  render() {
    if (this.props.target) return null;

    // If no target, we'll have to render an el to figure out which document we're in.
    return <noscript ref={(c) => {this.node = c;}} />;
  }
}

function on(element, event, callback, options) {
  element.addEventListener(event, callback, options);
}

function off(element, event, callback, options) {
  element.removeEventListener(event, callback, options);
}

// Generate and assign propTypes from all possible events
if (NODE_ENV !== 'production') {
  const propTypes = EventKeys.allEvents.reduce(function(result, key) {
    result[key] = PropTypes.func;
    return result;
  }, {});
  propTypes.enabled = PropTypes.bool;
  propTypes.target = PropTypes.oneOfType([PropTypes.object, PropTypes.func]);
  propTypes.passive = PropTypes.bool;
  propTypes.capture = PropTypes.bool;
  DocumentEvents.propTypes = propTypes;
}

module.exports = DocumentEvents;
