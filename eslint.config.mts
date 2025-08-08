import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["REFACTORING_EXAMPLES.ts", "coverage/**/*"],
  },
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { globals: globals.browser } 
  },
  ...tseslint.configs.recommended,
];
