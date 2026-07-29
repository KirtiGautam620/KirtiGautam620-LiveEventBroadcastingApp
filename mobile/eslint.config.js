// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  // Must stay last: disables ESLint stylistic rules that conflict with Prettier,
  // so formatting is owned by Prettier alone instead of two tools fighting over it.
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
]);
