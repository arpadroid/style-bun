//////////////////////////////
// #region Scss Theme Tests
///////////////////////////////

import { existsSync, readFileSync } from 'node:fs';
import ThemeBundler from '../themeBundler.mjs';
import path from 'node:path';

const demoDir = path.join(process.cwd(), 'demo');
const testDir = path.join(process.cwd(), 'test');
const themesDir = path.join(demoDir, 'themes');
const defaultThemeDir = path.join(themesDir, 'default');
const outputDir = path.join(testDir, 'output');
const scssThemeDir = path.join(themesDir, 'scss');
describe('SCSS theme', () => {
    /** @type {ThemeBundler} */
    let scssTheme;
    const warnSpy = jest.spyOn(console, 'warn');
    beforeAll(async () => {
        scssTheme = new ThemeBundler({
            path: scssThemeDir,
            extension: 'scss',
            patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
            exportPath: outputDir,
            verbose: true
        });
        await scssTheme.cleanup();
        await scssTheme.promise;
        await scssTheme.bundle(true);
    });

    it('Verifies theme files', async () => {
        const themeFiles = scssTheme.getFiles();
        expect(themeFiles.length).toBe(5);
    });

    it('Throws a warning if an empty CSS file is found', async () => {
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('No CSS found in file:'),
            expect.stringContaining('empty-button.scss.scss')
        );
        warnSpy.mockRestore();
    });

    it('Compiles the SCSS theme and checks for the output files (minified and non-minified)', async () => {
        const outputFile = scssTheme.getTargetFile();
        expect(existsSync(outputFile)).toBe(true);
        expect(readFileSync(outputFile, 'utf8')).toContain('$primary-color: #3498db;');

        const minFile = scssTheme.getMinifiedTargetFile();
        expect(existsSync(minFile)).toBe(true);
        expect(readFileSync(minFile, 'utf8')).toContain('--primary-color:#3498db');
    });

    it('Triggers an error when trying to compile invalid SCSS', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const invalidScssTheme = new ThemeBundler({
            path: path.join(themesDir, 'scss'),
            extension: 'scss',
            verbose: true
        });
        await invalidScssTheme.promise;
        await invalidScssTheme.scssToCss(
            'invalid file',
            '$color: #f.test { color: $color; } .invalid { color: ; }'
        );

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to compile SCSS:'));
    });

    afterAll(async () => {
        await scssTheme.cleanup();
        const outputFile = scssTheme.getTargetFile();
        expect(existsSync(outputFile)).toBe(false);

        const minFile = scssTheme.getMinifiedTargetFile();
        expect(existsSync(minFile)).toBe(false);
    });
});

// #endregion

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
