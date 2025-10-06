module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['jest'],
  rules: {
    // Reglas de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Reglas de calidad
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Reglas de patrones de diseño
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    
    // Reglas específicas para microservicios
    'no-process-exit': 'error',
    'no-sync': 'warn',
    
    // Reglas para tests
    'jest/expect-expect': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        'jest/expect-expect': 'error'
      }
    },
    {
      files: ['**/src/domain/**/*.js'],
      rules: {
        'no-console': 'error',
        'prefer-const': 'error'
      }
    },
    {
      files: ['**/src/factories/**/*.js'],
      rules: {
        'no-console': 'warn',
        'prefer-arrow-callback': 'error'
      }
    },
    {
      files: ['**/src/strategies/**/*.js'],
      rules: {
        'no-console': 'warn',
        'object-shorthand': 'error'
      }
    },
    {
      files: ['**/src/decorators/**/*.js'],
      rules: {
        'no-console': 'warn',
        'prefer-arrow-callback': 'error'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    '*.log',
    'docker-compose*.yml',
    'Dockerfile*'
  ]
};
