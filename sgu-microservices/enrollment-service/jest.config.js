module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.js", "!src/demo/**", "!src/server.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Configuración para evitar problemas con módulos
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  // Configuración para tests asíncronos
  testTimeout: 10000,
};
