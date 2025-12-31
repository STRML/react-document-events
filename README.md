# react-document-events

Declarative method for binding handlers to document and window - and cleaning them up.

### Usage

Given an imaginary component that listens to the 'esc' key, but only if its
parent tells it to:

```js
import React from 'react';
import DocumentEvents from 'react-document-events';

class SideEffectingComponent extends React.Component {

  onKeyUp = (e) => {
    if (e.keyCode === 27 /* esc */) this.toggleSomethingOnEsc(e);
  };

  render() {
    var target = process.browser ? document : null;
    return (
      <div>
        <div>Component Innards</div>
        <DocumentEvents enabled={this.props.listenToKeys} onKeyUp={this.onKeyUp} passive={false} capture={false} />
      </div>
    );
  }
}
```

#### Props

* **capture** (`boolean=false`): If true, will add listeners in the `capture` phase.
* **enabled** (`boolean=true`): If true, will attach handlers, if false, will remove them. Safe to add/remove at will.
* **passive** (`boolean=false`): If true, will add listeners with the
  [passive option](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners).
* **target** (`(HTMLElement | () => HTMLElement | () => void | void)=document`): The element to attach listeners to.
  May also be a function returning said element. If void, or returning void, this element will noop.
  * To be safe when server rendering, the default is `document`, but only if `process.browser` returns true.
* **on[eventName]** (`EventHandler`): Any valid [event handler name](https://facebook.github.io/react/docs/events.html).
  Note these events are attached directly, so you will receive browser events, not React's `SyntheticEvent`, although the semantics are mostly the same.
