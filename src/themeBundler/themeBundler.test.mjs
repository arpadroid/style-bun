/**
 * @jest-environment node
 */
import fs, { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import ThemeBundler from './themeBundler.mjs';

const demoDir = path.join(process.cwd(), 'demo');
const testDir = path.join(process.cwd(), 'test');
const themesDir = path.join(demoDir, 'themes');
const defaultThemeDir = path.join(themesDir, 'default');
const scssThemeDir = path.join(themesDir, 'scss');
const outputDir = path.join(testDir, 'output');

const defaultConfig = {
    path: defaultThemeDir,
    patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
    exportPath: outputDir,
    commonThemeFile: path.join(testDir, 'common.css')
};

/**
 * Verifies that making changes to a file are reflected in the output files.
 * @param {ThemeBundler} theme - The ThemeBundler instance.
 * @param {string} outputFile - The path to the output file.
 * @param {jest.Mock | undefined} spy - The jest mock function to verify callback invocations.
 * @param {string} changeFile - The file to make changes to.
 * @param {string} changeText - The text to append to the change file.
 * @param {string} [minifiedText] - The expected text in the minified output file.
 */
export const verifyOutput = async (
    theme,
    outputFile,
    spy,
    changeFile,
    changeText,
    minifiedText = changeText
) => {
    spy?.mockClear();
    const originalContent = await readFileSync(changeFile, 'utf8');
    await appendFileSync(changeFile, changeText, 'utf8');

    // Wait for the watcher to detect the change and re-bundle
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check the change is reflected in the output file.
    const outputFileContent = await readFileSync(outputFile, 'utf8');
    expect(outputFileContent).toContain(changeText);

    // Check change is reflected in minified file
    const minFile = theme.getMinifiedTargetFile();
    const minFileContent = await readFileSync(minFile, 'utf8');
    expect(minFileContent).toContain(minifiedText);

    expect(spy).toHaveBeenCalledTimes(1);

    // Remove the test change
    await writeFileSync(changeFile, originalContent, 'utf8');
    await new Promise(resolve => setTimeout(resolve, 200));
    const outputContent = await readFileSync(outputFile, 'utf8');
    expect(outputContent).not.toContain(changeText);
    const minContent = await readFileSync(minFile, 'utf8');
    expect(minContent).not.toContain(minifiedText);
    expect(spy).toHaveBeenCalledTimes(2);
};

describe('ThemeBundler', () => {
    let commonThemeFile = '';
    /** @type {ThemeBundler} */
    let theme;
    beforeAll(async () => {
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        // create test common theme file
        commonThemeFile = path.join(testDir, 'common.css');
        fs.writeFileSync(commonThemeFile, ':root { --common-theme-var: yellowgreen; }', 'utf8');

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
        beforeAll(async () => {
            _theme = new ThemeBundler({
                ...defaultConfig  
            });
            await _theme.promise;
            await _theme.cleanup();
            await _theme.bundle(true);

            spy = jest.fn(() => {
                console.log('Watch triggered');
            });

            _theme.watch(spy, true, true);
            await new Promise(resolve => setTimeout(resolve, 10));
            outputFile = _theme.getTargetFile();
        });

        afterAll(async() => {
            await _theme.cleanup();
            _theme.clearWatchers();
            _theme.baseTheme?.clearWatchers();
        });

        const changeContent = '.dummy-change{color:componentDummyColor}';

        it('Makes a change to a component file, verifies output files for changes and callback invocation.', async () => {
            const changeFile = path.join(demoDir, 'components', 'button', 'styles', 'button.default.css');
            await verifyOutput(theme, outputFile, spy, changeFile, changeContent);
        });

        /**
         * @todo Fix this test - it intermittently fails because the watcher does not always pick up the change in time.
         * The issue is not related to the test itself, but rather having multiple verifyOutput calls in succession.
         */
        // it('Makes a change to a theme file, verifies output files for changes and callback invocation.', async () => {
        //     const changeFile = path.join(defaultThemeDir, 'main/main.css');
        //     await verifyOutput(theme, outputFile, spy, changeFile, changeContent);
        // });
    });
    // #endregion

    ////////////////////////////
    // #region Error Handling
    ////////////////////////////
    describe('Error handling', () => {
        it('Throws an error if the theme path does not exist', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});
            const _theme = new ThemeBundler({ ...defaultConfig, path: '/invalid/path/to/theme' });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid path in theme config'));
            consoleSpy.mockRestore();
            await _theme.promise;
            await _theme.cleanup();
        });

        it('Throws an error if the theme does not have a configuration file', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});
            const _theme = new ThemeBundler({ ...defaultConfig, path: demoDir });
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(" Config file not found for theme 'demo'")
            );
            consoleSpy.mockRestore();
            await _theme.promise;
            await _theme.cleanup();
        });

        it('Throws an error if the common theme file does not exist', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});
            const _theme = new ThemeBundler({
                ...defaultConfig,
                commonThemeFile: path.join(demoDir, 'nonexistent-common.css')
            });
            await _theme.promise;
            const commonThemeFile = _theme.getCommonThemeFile();
            expect(commonThemeFile).toBeUndefined();
            console.log('commonThemeFile', commonThemeFile);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('common theme file does not exist')
            );
            consoleSpy.mockRestore();
            await _theme.cleanup();
        });

        it('Throws an error if the base theme does not exist', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const _theme = new ThemeBundler({
                ...defaultConfig,
                baseTheme: path.join(demoDir, 'nonexistent-base-theme')
            });
            await _theme.promise;
            _theme.setBaseTheme(path.join(demoDir, 'nonexistent-base-theme'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Base theme does not exist'));
            consoleSpy.mockRestore();
            await _theme.cleanup();
        });

        it('Throws warning when bundling if scss is not installed', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            const _theme = new ThemeBundler({
                ...defaultConfig,
                extension: 'scss'
            });
            jest.spyOn(_theme, 'hasSassSupport').mockReturnValue(false);
            await _theme.promise;
            await _theme.bundle();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("SCSS files detected but 'sass' is not installed.")
            );
            consoleSpy.mockRestore();
            _theme.cleanup();
        });

        test('writeStyles throws a warning if there are no styles to write', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const _theme = new ThemeBundler({
                path: path.join(themesDir, 'empty'),
                patterns: [],
                exportPath: outputDir,
                verbose: true
            });
            await _theme.promise;
            await _theme.writeStyles('');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('No CSS found in theme file'),
                'empty'
            );
            consoleSpy.mockRestore();
            await _theme.cleanup();
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

//////////////////////////////
// #region Scss Theme Tests
///////////////////////////////

describe('SCSS theme', () => {
    const scssTheme = new ThemeBundler({
        path: scssThemeDir,
        extension: 'scss',
        patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
        exportPath: outputDir,
        verbose: true
    });

    // const warnSpy = jest.spyOn(console, 'warn');

    beforeAll(async () => {
        await scssTheme.cleanup();
        await scssTheme.promise;
        await scssTheme.bundle(true);
    });

    it('Verifies theme files', async () => {
        const themeFiles = scssTheme.getFiles();
        expect(themeFiles.length).toBe(5);
    });

    // it('Throws a warning if an empty CSS file is found', async () => {
    //     expect(warnSpy).toHaveBeenCalledWith(
    //         expect.stringContaining(
    //             'no CSS found in file:/var/www/arpadroid/style-bun/demo/components/button/styles/empty-button.scss.scss'
    //         )
    //     );
    //     warnSpy.mockRestore();
    // });

    it('Compiles the SCSS theme and checks for the output files (minified and non-minified)', async () => {
        const outputFile = scssTheme.getTargetFile();
        expect(fs.existsSync(outputFile)).toBe(true);
        expect(fs.readFileSync(outputFile, 'utf8')).toContain('$primary-color: #3498db;');

        const minFile = scssTheme.getMinifiedTargetFile();
        expect(fs.existsSync(minFile)).toBe(true);
        expect(fs.readFileSync(minFile, 'utf8')).toContain('--primary-color:#3498db');
    });

    afterAll(async () => {
        await scssTheme.cleanup();
        const outputFile = scssTheme.getTargetFile();
        expect(fs.existsSync(outputFile)).toBe(false);

        const minFile = scssTheme.getMinifiedTargetFile();
        expect(fs.existsSync(minFile)).toBe(false);
    });
});

////////////////////////////////
// #region Scss Base Theme
/////////////////////////////////
describe('Default Theme with scss theme as base', () => {
    /** @type {ThemeBundler} */
    let theme;
    beforeAll(async () => {
        theme = new ThemeBundler({
            path: defaultThemeDir,
            patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
            baseTheme: scssThemeDir
        });
        await theme.promise;
        // await theme.cleanup();
        await theme.bundle(true);
    });

    it('Checks the base theme is set as expected', async () => {
        /** @type {ThemeBundler | undefined} */
        const baseTheme = theme.baseTheme;
        expect(baseTheme?.getName()).toBe('scss');
        expect(baseTheme?.getPath()).toBe(scssThemeDir);
    });

    it('Verifies that variables from the scss base theme are included in the output', async () => {
        const outputFile = theme.getCSSTargetFile();
        const content = await readFileSync(outputFile, 'utf8');
        expect(content).toContain('--primary-color: #3498db;');
        expect(content).toContain('.scss_button {');

    });
    afterAll(async () => {
        await theme.cleanup();
    });
});

// #endregion

// #endregion
