import {defineConfig} from 'vite';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
      '@studio': path.resolve(__dirname, './src/studio'),
    },
  },
});
