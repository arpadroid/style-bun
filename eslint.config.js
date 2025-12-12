import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2022
            }
        },
        rules: {
            // Possible Errors
            'no-console': 'off', // Allow console for development/debugging
            'no-debugger': 'warn',
            'no-unused-vars': ['error', { 
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_'
            }],
            
            // Best Practices
            'eqeqeq': ['error', 'always'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            
            // Style
            'indent': ['error', 4, { SwitchCase: 1 }],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            
            // ES6+
            'arrow-spacing': 'error',
            'template-curly-spacing': 'error',
            'object-shorthand': 'error'
        }
    },
    {
        // Configuration for browser/frontend files
        files: ['demo/**/*.js', 'demo/**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2022
            }
        }
    },
    {
        // Configuration for test files
        files: ['**/*.test.js', '**/*.test.mjs', '**/*.spec.js', '**/*.spec.mjs'],
        languageOptions: {
            globals: {
                ...globals.jest,
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                jest: 'readonly'
            }
        },
        rules: {
            'no-console': 'off' // Allow console in tests
        }
    },
    {
        // Ignore patterns
        ignores: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            'demo/css/test-output/**',
            'demo/css/themes/**/*.bundled.css',
            'demo/css/themes/**/*.min.css'
        ]
    }
];