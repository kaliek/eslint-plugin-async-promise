module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  modulePathIgnorePatterns: ['file.ts'],
  testMatch: [
    "<rootDir>/src/__tests__/**/*.ts",
  ],
};
