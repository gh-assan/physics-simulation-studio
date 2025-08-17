import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "REFACTORING_EXAMPLES.ts",
      "coverage/**/*",
      "scripts/**/*.js",
      "build/**/*",
      "temp-build/**/*",
      "debug-*.js",
      "debug/**/*.js"
    ],
  },
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { globals: globals.browser } 
  },
  ...tseslint.configs.recommended,
];
