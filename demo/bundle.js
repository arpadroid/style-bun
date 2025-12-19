/**
 * Sample usage of ThemesBundler.
 * The script will act based upon the --mode passed, which can be either `development` or `production`.
 * You can have a script in your package.json that runs this file with the `--mode` flag.
 * E.g. `node ./scripts/bundle.js --mode=production`.
 * @typedef {import('../../src/ThemeBundlerConfigType').ThemeBundlerConfigType} ThemeBundlerConfigType
 */
import ThemesBundler from '../src/themesBundler/themesBundler.mjs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv;
const mode = argv.mode === 'production' ? 'production' : 'development';
const cwd = process.cwd();
const basePath = cwd + '/demo/themes';
// We instantiate the themes bundler.
const bundler = new ThemesBundler({
    themes: [
        { path: basePath + '/default' },
        { path: basePath + '/mobile' },
        { path: basePath + '/desktop' },
        { path: basePath + '/dark' }
    ],
    patterns: [cwd + '/demo/components/**/*', cwd + '/demo/pages/**/*'],
    minify: mode === 'production',
    commonThemePath: basePath + '/common'
});

// We wait until the bundler is ready.
bundler.promise.then(() => {
    // We clean up the output directory of each theme before compiling.
    bundler.cleanup();
    // We bundle of all themes.
    bundler.bundle().then(() => {
        if (mode === 'development') {
            // We watch all files for changes and re-bundle the themes correspondingly.
            bundler.watch();
        }
    });
});
