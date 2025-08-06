import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], 
    ignores: ["REFACTORING_EXAMPLES.ts"],
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { globals: globals.browser } 
  },
  ...tseslint.configs.recommended,
];
