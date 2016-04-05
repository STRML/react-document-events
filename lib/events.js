// Generated from:
// var SimpleEventPlugin = require('react/lib/SimpleEventPlugin')
// Object.keys(SimpleEventPlugin.eventTypes).map(function(key) { return 'on' + key[0].toUpperCase() + key.slice(1); });
var reactEvents = [
  'onAbort',
  'onAnimationEnd',
  'onAnimationIteration',
  'onAnimationStart',
  'onBlur',
  'onCanPlay',
  'onCanPlayThrough',
  'onClick',
  'onContextMenu',
  'onCopy',
  'onCut',
  'onDoubleClick',
  'onDrag',
  'onDragEnd',
  'onDragEnter',
  'onDragExit',
  'onDragLeave',
  'onDragOver',
  'onDragStart',
  'onDrop',
  'onDurationChange',
  'onEmptied',
  'onEncrypted',
  'onEnded',
  'onError',
  'onFocus',
  'onInput',
  'onInvalid',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onLoad',
  'onLoadedData',
  'onLoadedMetadata',
  'onLoadStart',
  'onMouseDown',
  'onMouseMove',
  'onMouseOut',
  'onMouseOver',
  'onMouseUp',
  'onPaste',
  'onPause',
  'onPlay',
  'onPlaying',
  'onProgress',
  'onRateChange',
  'onReset',
  'onScroll',
  'onSeeked',
  'onSeeking',
  'onStalled',
  'onSubmit',
  'onSuspend',
  'onTimeUpdate',
  'onTouchCancel',
  'onTouchEnd',
  'onTouchMove',
  'onTouchStart',
  'onTransitionEnd',
  'onVolumeChange',
  'onWaiting',
  'onWheel',
];

// Events that are specific to the window and aren't in the list above
// Added addl events from https://developer.mozilla.org/en-US/docs/Web/API/Window
var windowEvents = [
  'onAfterPrint',
  'onBeforePrint',
  'onBeforeUnload',
  'onDeviceLight',
  'onDeviceMotion',
  'onDeviceOrientation',
  'onDeviceProximity',
  'onHashChange',
  'onLanguageChange',
  'onPopState',
  'onRejectionHandled', // promises
  'onSelect', // catches select events bubbling up
  'onStorage',
  'onUnhandledRejection', // promises
  'onUnload',
  'onUserProximity',
];

// Addl document/window APIs
var extraEvents = [
  // IE/FF pointer events spec
  'onPointerCancel',
  'onPointerDown',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerMove',
  'onPointerOut',
  'onPointerOver',
  'onPointerUp',
];

module.exports = reactEvents.concat(windowEvents).concat(extraEvents);
