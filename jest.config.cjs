module.exports = {
    testEnvironment: 'node',
    verbose: true,
    coverageReporters: ['html', 'text', 'cobertura'],
    testMatch: ['**/__tests__/**/*.?(m)js?(x)', '**/?(*.)(spec|test).?(m)js?(x)'],
    moduleFileExtensions: ['js', 'mjs'],

    transform: {
        '^.+\\.m?js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }]
    },
    transformIgnorePatterns: ['node_modules/(?!(chokidar|readdirp|glob|lightningcss|yargs)/)'],
    fakeTimers: { enableGlobally: false }
};
