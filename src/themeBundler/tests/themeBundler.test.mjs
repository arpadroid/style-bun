/**
 * @jest-environment node
 */
import fs, { existsSync, readFileSync, rmSync } from 'fs';
import path from 'path';
import ThemeBundler from '../themeBundler.mjs';
import { verifyOutput, demoDir, testDir, defaultThemeDir, themesDir } from './tests.util.mjs';
import { initializeTest, commonThemeFile, clearFileChanges } from './tests.util.mjs';
const outputDir = path.join(testDir, 'output');

const defaultConfig = {
    path: defaultThemeDir,
    patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
    exportPath: outputDir,
    commonThemeFile: path.join(testDir, 'common.css')
};

describe('ThemeBundler', () => {
    /** @type {ThemeBundler} */
    let theme;
    beforeAll(async () => {
        await initializeTest();

        // Create theme instance
        theme = new ThemeBundler({
            path: defaultThemeDir,
            patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
            exportPath: outputDir,
            commonThemeFile
        });
        await theme.promise;
    });
    ///////////////////////////////
    // #region Default Theme
    ///////////////////////////////
    describe('Default Theme', () => {
        it('Initializes theme and cleans-up any previous output', async () => {
            await theme.cleanup();
            const outputFile = theme.getTargetFile();
            expect(existsSync(outputFile)).toBe(false);
        });

        it('Loads the file config', async () => {
            expect(theme.fileConfig).toHaveProperty('includes');
        });

        it('Checks for valid properties', async () => {
            expect(theme.getName()).toBe('default');
            expect(theme.getPath()).toBe(defaultThemeDir);
            expect(theme.getConfigFile()).toBe(path.join(defaultThemeDir, 'default.config.json'));
        });

        it('Function normalizePattern returns expected results', async () => {
            let pattern = '{cwd}/demo/components';
            expect(theme.normalizePattern(pattern)).toBe(
                path.join(process.cwd(), 'demo', 'components', '**', '*.default.css')
            );
            pattern = 'demo/pages';
            expect(theme.normalizePattern(pattern)).toBe(
                path.join(theme.getPath(), 'demo', 'pages', '**', '*.default.css')
            );
        });

        test('exportDir works as expected', async () => {
            theme.exportDir(path.join(themesDir, 'empty'), path.join(testDir, 'export-output'));
            expect(existsSync(path.join(testDir, 'export-output', 'empty.config.json'))).toBe(true);

            theme.exportDir(path.join(themesDir, 'empty'), path.join(testDir, 'some', 'place'));
            expect(existsSync(path.join(testDir, 'some', 'place', 'empty.config.json'))).toBe(true);
        });

        it('Verifies theme files include components, pages, and common theme files.', async () => {
            const themeFiles = theme.getFiles();
            const filesToCheck = [
                'homePage.default.css',
                'button.default.css',
                'darkThemeButton.default.css',
                'common.css'
            ];
            themeFiles.forEach(filePath => expect(existsSync(filePath)).toBe(true));
            const baseNames = themeFiles.map(f => path.basename(f));
            filesToCheck.forEach(fileName => {
                const hasFile = baseNames.includes(fileName);
                expect(hasFile).toBe(true);
            });
        });

        it('Compiles the default theme and checks for the output files (minified and non-minified)', async () => {
            await theme.bundle(true); // true = minify

            const outputFile = theme.getTargetFile();
            expect(fs.existsSync(outputFile)).toBe(true);
            expect(fs.readFileSync(outputFile, 'utf8')).toContain('--grey-100');

            const minFile = theme.getMinifiedTargetFile();
            expect(fs.existsSync(minFile)).toBe(true);
            expect(fs.readFileSync(minFile, 'utf8')).toContain('--grey-100');
        });

        it('Includes common theme file variables in the output', async () => {
            const outputFile = theme.getTargetFile();
            const content = await readFileSync(outputFile, 'utf8');
            expect(content).toContain('--common-theme-var: yellowgreen;');
        });

        it('Checks that components and pages stylesheets were included in the bundle as defined in patterns', async () => {
            await theme.bundle(true);
            const outputFile = theme.getTargetFile();
            const content = await readFileSync(outputFile, 'utf8');
            expect(content).toContain('.button {');
            expect(content).toContain('dark-theme-button');
        });

        it('Handles debouncing during bundle calls', async () => {
            jest.spyOn(theme, 'writeStyles');
            await theme.promise;
            // Call bundle multiple times in quick succession, only the awaited ones should execute.
            theme.bundle();
            theme.bundle();
            await theme.bundle();
            expect(theme.writeStyles).toHaveBeenCalledTimes(1);
            await theme.bundle();
            await theme.bundle();
            expect(theme.writeStyles).toHaveBeenCalledTimes(3);
        });
    });

    // #endregion

    //////////////////////////////
    // #region Watch Mode
    //////////////////////////////

    describe('Watch Mode', () => {
        /** @type {jest.Mock | undefined} */
        let spy;
        /** @type {string} */
        let outputFile = '';
        /** @type {ThemeBundler} */
        let _theme;
        beforeEach(async () => {
            _theme = new ThemeBundler({
                ...defaultConfig
            });
            await _theme.promise;
            await _theme.cleanup();
            await _theme.bundle(true);

            spy = jest.fn(() => {
                console.log('Watch triggered');
            });
            outputFile = _theme.getTargetFile();
            await _theme.watch(spy, true, true);
        });

        afterEach(async () => {
            clearFileChanges();
            await _theme.cleanup();
        });

        const changeContent = '.dummy-change{color:componentDummyColor}';

        it('Makes a change to a component file, verifies output files for changes and callback invocation.', async () => {
            const changeFile = path.join(demoDir, 'components', 'button', 'styles', 'button.default.css');
            await verifyOutput(theme, outputFile, spy, changeFile, changeContent);
        });

        /**
         * @todo Fix this flaky test - it intermittently fails because the watcher does not always pick up the change in time.
         * The issue is not related to the test itself, but rather having multiple verifyOutput calls in succession.
         */
        it('Makes a change to a theme file, verifies output files for changes and callback invocation.', async () => {
            const changeFile = path.join(defaultThemeDir, 'main/main.css');
            await verifyOutput(theme, outputFile, spy, changeFile, changeContent);
        });
    });
    // #endregion

    ////////////////////////////
    // #region Edge Cases
    ////////////////////////////
    describe('Edge cases', () => {
        test('getCSS returns empty string for bundle CSS file', async () => {
            const theme = new ThemeBundler(defaultConfig);
            await theme.promise;
            await theme.bundle();
            const css = await theme.getCSS(theme.getTargetFile());
            expect(css).toBe('');
            await theme.cleanup();
        });

        test('Does not have SCSS support', () => {
            const theme = new ThemeBundler(defaultConfig);
            const hasSass = theme.hasSassSupport('nonexistent-package-for-testing');
            expect(hasSass).toBe(false);
        });

        test('watchPattern returns undefined for invalid patterns', () => {
            const theme = new ThemeBundler(defaultConfig);
            const result = theme.watchPattern('');
            expect(result).toBeUndefined();
        });

        test('bundleBaseTheme handles missing target file', async () => {
            const theme = new ThemeBundler({
                ...defaultConfig,
                baseTheme: path.join(themesDir, 'scss')
            });
            await theme.promise;

            if (!theme.baseTheme) {
                throw new Error('Base theme not set');
            }
            theme.baseTheme.bundle = jest.fn().mockResolvedValue(true);
            theme.baseTheme.getCSSTargetFile = jest.fn().mockReturnValue(null);

            const consoleSpy = jest.spyOn(console, 'error');
            const result = await theme.bundleBaseTheme();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('No target file found for base theme')
            );
            expect(result).toBe('');
            consoleSpy.mockRestore();
            await theme.cleanup();
        });

        test('watch with baseTheme calls baseTheme.watch', async () => {
            const darkThemePath = path.join(themesDir, 'dark');
            const theme = new ThemeBundler({
                ...defaultConfig,
                path: darkThemePath,
                baseTheme: defaultThemeDir
            });
            await theme.promise;
            if (!theme.baseTheme) {
                throw new Error('Base theme not set');
            }
            const baseThemeWatchSpy = jest.spyOn(theme.baseTheme, 'watch');
            const mockCallback = jest.fn();

            await theme.watch(mockCallback, true, false);

            expect(baseThemeWatchSpy).toHaveBeenCalled();

            theme.clearWatchers();
            theme.baseTheme?.clearWatchers();
            await theme.cleanup();
        });

        test('watchPatterns returns early when patterns is not an array', async () => {
            const theme = new ThemeBundler({
                ...defaultConfig,
                // @ts-ignore
                patterns: null
            });
            await theme.promise;

            // Mock getPatterns to return a non-array value
            // @ts-ignore
            jest.spyOn(theme, 'getPatterns').mockReturnValue(null);

            const watchPatternSpy = jest.spyOn(theme, 'watchPattern');
            theme.watchPatterns(true, false, jest.fn());

            expect(watchPatternSpy).not.toHaveBeenCalled();
            await theme.cleanup();
        });
    });

    // #endregion

    afterAll(async () => {
        await theme.cleanup();
        expect(theme.watchers?.length).toBe(0);

        const outputFile = theme.getTargetFile();
        expect(existsSync(outputFile)).toBe(false);

        const minFile = theme.getMinifiedTargetFile();
        expect(existsSync(minFile)).toBe(false);
        // Clean up test output directory
        if (existsSync(testDir)) {
            await rmSync(testDir, { recursive: true, force: true });
        }
    });
});
