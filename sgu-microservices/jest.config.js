module.exports = {
  // Configuración base
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Configuración de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Configuración de archivos
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Configuración de transformación
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Configuración de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Configuración de timeouts
  testTimeout: 30000,
  
  // Configuración de verbose
  verbose: true,
  
  // Configuración de patrones de diseño
  projects: [
    {
      displayName: 'auth-service',
      testMatch: ['<rootDir>/sgu-microservices/auth-service/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/sgu-microservices/auth-service/tests/setup.js']
    },
    {
      displayName: 'courses-service',
      testMatch: ['<rootDir>/sgu-microservices/courses-service/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/sgu-microservices/courses-service/tests/setup.js']
    },
    {
      displayName: 'enrollment-service',
      testMatch: ['<rootDir>/sgu-microservices/enrollment-service/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/sgu-microservices/enrollment-service/tests/setup.js']
    },
    {
      displayName: 'notifications-service',
      testMatch: ['<rootDir>/sgu-microservices/notifications-service/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/sgu-microservices/notifications-service/tests/setup.js']
    },
    {
      displayName: 'payments-service',
      testMatch: ['<rootDir>/sgu-microservices/payments-service/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/sgu-microservices/payments-service/tests/setup.js']
    },
    {
      displayName: 'api-gateway',
      testMatch: ['<rootDir>/sgu-microservices/api-gateway/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/sgu-microservices/api-gateway/tests/setup.js']
    },
    {
      displayName: 'design-patterns',
      testMatch: [
        '<rootDir>/sgu-microservices/**/tests/domain/**/*.test.js',
        '<rootDir>/sgu-microservices/**/tests/factories/**/*.test.js',
        '<rootDir>/sgu-microservices/**/tests/strategies/**/*.test.js',
        '<rootDir>/sgu-microservices/**/tests/decorators/**/*.test.js'
      ]
    }
  ],
  
  // Configuración de reportes
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      suiteName: 'SGU Microservices Tests'
    }]
  ],
  
  // Configuración de globals
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};