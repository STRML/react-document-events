'use strict';
const React = require('react');
const PropTypes = require('prop-types');
const shallowequal = require('shallowequal');
const NODE_ENV = process.env.NODE_ENV;
let EventKeys = {};
if (NODE_ENV !== 'production') {
  // Gated behind flag so bundlers can strip the import
  EventKeys = require('./events');  // arrays of event names
}

class DocumentEvents extends React.Component {
  // propTypes are generated below from all possible events

  constructor(props) {
    super(props);
    this._allHandlers = {};
  }

  componentDidMount() {
    if (this.props.enabled) this.bindHandlers(this.props);
  }

  componentWillUnmount() {
    this.unbindHandlers(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!shallowequal(Object.keys(this.props).sort(), Object.keys(nextProps).sort())) {
      this.unbindHandlers(this.props);
      this.bindHandlers(nextProps);
    } else if (this.props.enabled && !nextProps.enabled) {
      this.unbindHandlers(this.props);
    } else if (!this.props.enabled && nextProps.enabled) {
      this.bindHandlers(nextProps);
    }
  }

  getKeys(props) {
    props = props || this.props;
    const isWindow = props.target === window;
    return Object.keys(props)
    .filter((k) => { return k.slice(0, 2) === 'on'; })
    .map((k) => {
      if (NODE_ENV !== 'production' && EventKeys.windowEvents.indexOf(k) !== -1 && !isWindow) {
        // eslint-disable-next-line
        console.warn("You attached the handler " + k + ", but this handler is only valid on the Window object.");
      }
      return [k, k.slice(2).toLowerCase()];
    });
  }

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
    // If `passive` is not supported, the third param is `useCapture`, which is a bool - and we won't
    // be able to use passive at all. Otherwise, it's safe to use an object.
    const options = SUPPORTS_PASSIVE ? {passive: props.passive, capture: props.capture} : props.capture;
    this.getKeys(props).forEach((keyArr) => {
      const handler = this._allHandlers[keyArr[0]] || ((event) => this.props[keyArr[0]](event));
      this._allHandlers[keyArr[0]] = handler;
      fn(target, keyArr[1], handler, options);
    });
  }

  render() {
    if (this.props.target) return null;

    // If no target, we'll have to render an el to figure out which document we're in.
    return <noscript ref={(c) => {this.node = c;}} />;
  }
}

DocumentEvents.displayName = 'DocumentEvents';

DocumentEvents.defaultProps = {
  capture: false,
  enabled: true,
  passive: false,
};

function on(element, event, callback, options) {
  !element.addEventListener && (event = 'on' + event);
  (element.addEventListener || element.attachEvent).call(element, event, callback, options);
  return callback;
}

function off(element, event, callback, options) {
  !element.removeEventListener && (event = 'on' + event);
  (element.removeEventListener || element.detachEvent).call(element, event, callback, options);
  return callback;
}

const SUPPORTS_PASSIVE = (function passiveFeatureTest() {
  try {
    let support = false;
    document.createElement("div").addEventListener("test", function() {}, { get passive() { support = true; }});
    return support;
  } catch (e) {
    return false;
  }
})();

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
