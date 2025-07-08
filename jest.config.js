/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/core/$1',
    '@plugins/(.*)': '<rootDir>/src/plugins/$1',
    '@studio/(.*)': '<rootDir>/src/studio/$1',
  },
};