module.exports = {
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/test'],
  coverageReporters: ['html', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['<rootDir>/src/**/*.spec.(ts|tsx|js)'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
