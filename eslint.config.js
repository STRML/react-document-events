const babelParser = require("@babel/eslint-parser");
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"]
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha
      }
    },
    rules: {
      "strict": "off",
      "quotes": "off",
      "curly": ["warn", "multi-line"],
      "camelcase": "off",
      "comma-dangle": "off",
      "dot-notation": "off",
      "no-alert": "error",
      "no-console": "error",
      "no-debugger": "error",
      "no-use-before-define": ["warn", "nofunc"],
      "no-underscore-dangle": "off",
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^((prev|next)(State|Props)|e|_.*)$",
        "vars": "local",
        "varsIgnorePattern": "(debug|^_)"
      }],
      "new-cap": "off",
      "semi": ["warn", "always"]
    }
  }
];
