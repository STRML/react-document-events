# react-document-events

A declarative React component for binding event handlers to `document` and `window`, with automatic cleanup on unmount.

## Commands

```bash
# Install dependencies (uses yarn)
yarn

# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run linting
yarn lint

# Build (transpile src/ to build/)
yarn build
```

## Architecture

- **src/ReactDocumentEvents.js** - Main component. Binds/unbinds event handlers to document or window targets. Uses `addEventListener`/`removeEventListener` with support for passive events.
- **src/events.js** - Lists of valid React and window event names used for prop validation in development.
- **build/** - Babel-transpiled output (generated, not committed).
- **index.js** - Entry point, exports the built component.

## Key Details

- Uses Babel for transpilation (`@babel/preset-env`, `@babel/preset-react`)
- Tests use Mocha + Chai + jsdom
- Pre-commit hooks run: test, lint, build
- Peer dependencies: React >0.14, ReactDOM >0.14
