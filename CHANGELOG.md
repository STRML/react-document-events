## 1.5.0 (Feb 19, 2020)

- Fixed an issue where changing the callback on `props` would not result in that new callback being called.
  - Rather than set the callback directly, we now set a function of the form `(event) => this.props[eventHandlerName](event)`.
  - This fixes compatibility with hooks.
  - Thanks @davidswinegar
- Fixed an issue where adding a new event handler would not cause a rebind. Thanks again, @davidswinegar
- Removed React 16.4 deprecated lifecycles.
- Upgraded to babel 7.

## 1.4.0 (Jan 22, 2018)

- Dynamically get `target` prop, if not specified, by introspecting the parent of the render target.
  - This fixes use inside new windows or iframes.

## 1.3.2 (Apr 7, 2017)

- Move to babel's es2015 preset (fixes e.g. committed let/const, arrow funcs)

## 1.3.1

- Add npmignore

## 1.3.0

- React 15.5 support

## 1.2.1

- Remove committed arrow fn as I tried to avoid Babel

## 1.2.0

- Don't process `EventKeys` in production (smaller bundle, faster invocation)
- Add `capture` and `passive` options.

## 1.1.0

- Warn when attaching events like `onResize` to a document and not a window.

## 1.0.2

- Grab new event list from React v15 and add some extras from MDN docs

## 1.0.1

- Add `onResize`

## 1.0.0

- Initial Release
