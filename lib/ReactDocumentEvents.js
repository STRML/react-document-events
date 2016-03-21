'use strict';
var React = require('react');
var EventKeys = require('./events'); // array of event names

var DocumentEvents = React.createClass({
  displayName: 'DocumentEvents',

  getDefaultProps: function() {
    return {
      enabled: true,
      target: process.browser ? document : null
    };
  },

  // propTypes are generated below from all possible events

  componentDidMount: function() {
    if (this.props.enabled) this.bindHandlers();
  },

  componentWillUnmount: function() {
    this.unbindHandlers();
  },

  componentWillReceiveProps: function(nextProps) {
    if (this.props.enabled && !nextProps.enabled) {
      this.unbindHandlers();
    } else if (!this.props.enabled && nextProps.enabled) {
      this.bindHandlers();
    }
  },

  getKeys: function() {
    var props = this.props;
    return EventKeys
    .filter(function(k) { return props.hasOwnProperty(k); })
    .map(function (k) { return [k, k.slice(2).toLowerCase()]; });
  },

  bindHandlers: function() {
    this._adjustHandlers(on);
  },

  unbindHandlers: function() {
    this._adjustHandlers(off);
  },

  _adjustHandlers: function(fn) {
    var props = this.props;
    var target = typeof props.target === 'function' ? props.target() : props.target;
    if (!target) return;
    this.getKeys().forEach(function(keyArr) {
      fn(target, keyArr[1], props[keyArr[0]]);
    });
  },

  render: function() {
    return null;
  }
});

function on(element, event, callback, capture) {
  !element.addEventListener && (event = 'on' + event);
  (element.addEventListener || element.attachEvent).call(element, event, callback, capture);
  return callback;
}

function off(element, event, callback, capture) {
  !element.removeEventListener && (event = 'on' + event);
  (element.removeEventListener || element.detachEvent).call(element, event, callback, capture);
  return callback;
}

// Generate and assign propTypes from all possible events
var propTypes = EventKeys.reduce(function(result, key) {
  result[key] = React.PropTypes.func;
  return result;
}, {});
propTypes.enabled = React.PropTypes.bool;
propTypes.target = React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.func]);
DocumentEvents.propTypes = propTypes;

module.exports = DocumentEvents;
