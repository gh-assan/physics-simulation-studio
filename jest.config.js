/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    "three/examples/jsm/controls/OrbitControls": "<rootDir>/node_modules/three/examples/jsm/controls/OrbitControls.js",
    '@core/(.*)': '<rootDir>/src/core/$1',
    '@plugins/(.*)': '<rootDir>/src/plugins/$1',
    '@studio/(.*)': '<rootDir>/src/studio/$1',
  },
};
