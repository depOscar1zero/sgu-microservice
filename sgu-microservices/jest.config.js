module.exports = {
  // Configuración base para Jest
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.test.js",
    "**/tests/**/*.spec.js",
    "**/*.test.js",
    "**/*.spec.js",
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/config/**",
    "!src/middleware/errorHandler.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  // Configuración para diferentes servicios
  projects: [
    {
      displayName: "auth-service",
      testMatch: ["<rootDir>/auth-service/tests/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    },
    {
      displayName: "courses-service",
      testMatch: ["<rootDir>/courses-service/tests/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    },
    {
      displayName: "enrollment-service",
      testMatch: ["<rootDir>/enrollment-service/tests/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    },
    {
      displayName: "payments-service",
      testMatch: ["<rootDir>/payments-service/tests/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    },
    {
      displayName: "integration-tests",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    },
  ],
};
