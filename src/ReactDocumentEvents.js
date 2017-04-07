'use strict';
var React = require('react');
var PropTypes = require('prop-types');
var NODE_ENV = process.env.NODE_ENV;
var EventKeys = {};
if (NODE_ENV !== 'production') {
  // Gated behind flag so bundlers can strip the import
  EventKeys = require('./events');  // arrays of event names
}

class DocumentEvents extends React.Component {
  // propTypes are generated below from all possible events

  componentDidMount() {
    if (this.props.enabled) this.bindHandlers();
  }

  componentWillUnmount() {
    this.unbindHandlers();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.enabled && !nextProps.enabled) {
      this.unbindHandlers();
    } else if (!this.props.enabled && nextProps.enabled) {
      this.bindHandlers();
    }
  }

  getKeys() {
    var isWindow = this.props.target === window;
    return Object.keys(this.props)
    .filter(function(k) { return k.slice(0, 2) === 'on'; })
    .map(function(k) {
      if (NODE_ENV !== 'production' && EventKeys.windowEvents.indexOf(k) !== -1 && !isWindow) {
        // eslint-disable-next-line
        console.warn("You attached the handler " + k + ", but this handler is only valid on the Window object.");
      }
      return [k, k.slice(2).toLowerCase()];
    });
  }

  bindHandlers() {
    this._adjustHandlers(on);
  }

  unbindHandlers() {
    this._adjustHandlers(off);
  }

  _adjustHandlers(fn) {
    var props = this.props;
    var target = typeof props.target === 'function' ? props.target() : props.target;
    if (!target) return;
    // If `passive` is not supported, the third param is `useCapture`, which is a bool - and we won't
    // be able to use passive at all. Otherwise, it's safe to use an object.
    var options = SUPPORTS_PASSIVE ? {passive: props.passive, capture: props.capture} : props.capture;
    this.getKeys().forEach(function(keyArr) {
      fn(target, keyArr[1], props[keyArr[0]], options);
    });
  }

  render() {
    return null;
  }
}

DocumentEvents.displayName = 'DocumentEvents';

DocumentEvents.defaultProps = {
  capture: false,
  enabled: true,
  passive: false,
  target: process.browser ? document : null
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

var SUPPORTS_PASSIVE = (function passiveFeatureTest() {
  try {
    var support = false;
    document.createElement("div").addEventListener("test", function() {}, { get passive() { support = true; }});
    return support;
  } catch (e) {
    return false;
  }
})();

// Generate and assign propTypes from all possible events
if (NODE_ENV !== 'production') {
  var propTypes = EventKeys.allEvents.reduce(function(result, key) {
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
