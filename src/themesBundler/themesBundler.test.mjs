/**
 * @jest-environment node
 */
import path from 'path';
import ThemesBundler from './themesBundler.mjs';

import { existsSync, readFileSync, writeFileSync } from 'fs';

const testDir = path.join(process.cwd(), 'test');
const outputDir = path.join(testDir, 'output');

describe('ThemesBundler', () => {
    /** @type {ThemesBundler} */
    let bundler;
    const cwd = process.cwd();
    const basePath = cwd + '/demo/themes';
    beforeAll(() => {
        /** @type {ThemesBundler} */
        bundler = new ThemesBundler({
            exportPath: cwd + '/demo/css/test-output',
            themes: [
                { path: basePath + '/default' },
                { path: basePath + '/mobile' },
                { path: basePath + '/desktop' },
                { path: basePath + '/dark' }
            ],
            patterns: [cwd + '/demo/css/components/**/*', cwd + '/demo/css/pages/**/*'],
            minify: false,
            commonThemePath: basePath + '/common'
        });
    });

    it('creates a ThemesBundler instance', async () => {
        expect(bundler).toBeInstanceOf(ThemesBundler);
    });

    it('initializes the bundler', async () => {
        const response = await bundler.promise;
        expect(bundler.themes.length).toBe(4);
        expect(response?.themes).toBe(bundler.themes);
    });

    it('cleans up files', async () => {
        await bundler.promise;
        await bundler.cleanup();
        // Check there are no .bundled.css files in the output directories.
        for (const theme of bundler.themes) {
            expect(existsSync(theme.getTargetFile())).toBe(false);
        }
    });

    it('bundles themes', async () => {
        await bundler.promise;
        const response = await bundler.bundle();
        expect(response?.length).toBe(4);
        // Check there are .bundled.css files in the output directories.
        for (const theme of bundler.themes) {
            expect(existsSync(theme.getTargetFile())).toBe(true);
        }
    });

    describe('Minification', () => {
        it('creates minified files when minify is true', async () => {
            const bundler = new ThemesBundler({
                exportPath: outputDir + '/test-output-minify',
                themes: [{ path: basePath + '/default' }],
                patterns: ['{cwd}/demo/css/components'],
                minify: true
            });
            await bundler.promise;
            await bundler.bundle();
            bundler.themes.forEach(theme => {
                const targetFile = theme.getTargetFile();
                expect(existsSync(targetFile)).toBe(true);
                const minFile = theme.getMinifiedTargetFile();
                expect(existsSync(minFile)).toBe(true);
            });
            await bundler.cleanup();
        });
    });

    describe('Advanced Features', () => {
        it('includes common theme and scans multiple patterns', async () => {
            const multiConfig = {
                exportPath: cwd + '/demo/css/test-output-multi',
                themes: [{ path: basePath + '/default' }],
                patterns: ['{cwd}/demo/css/components', '{cwd}/demo/css/pages'],
                minify: false
            };
            const multiBundler = new ThemesBundler(multiConfig);
            await multiBundler.promise;
            await multiBundler.bundle();

            const outputFile = `${multiBundler._config?.exportPath}/default/default.bundled.css`;
            const content = readFileSync(outputFile, 'utf8');
            expect(content.length).toBeGreaterThan(0);
            await multiBundler.cleanup();
        });

        it('respects custom export paths', async () => {
            const customBundler = new ThemesBundler({
                exportPath: outputDir + '/custom-export-test',
                themes: [{ path: basePath + '/dark' }],
                patterns: ['{cwd}/demo/css/components']
            });
            await customBundler.promise;
            await customBundler.bundle();

            expect(existsSync(`${customBundler._config?.exportPath}/dark/dark.bundled.css`)).toBe(true);
            await customBundler.cleanup();
        });
    });

    describe('Error Handling', () => {
        it('handles empty themes and invalid patterns gracefully', async () => {
            const emptyBundler = new ThemesBundler({ themes: [], patterns: [] });
            await emptyBundler.promise;
            expect(emptyBundler.themes.length).toBe(0);

            const invalidBundler = new ThemesBundler({
                exportPath: outputDir + '/test-invalid',
                themes: [{ path: basePath + '/default' }],
                patterns: ['/nonexistent/**/*']
            });
            await invalidBundler.promise;
            await invalidBundler.bundle();

            expect(existsSync(invalidBundler.themes[0].getTargetFile())).toBe(true);
            await invalidBundler.cleanup();
        });
    });

    describe('Advanced Configuration', () => {
        it('handles watch paths and verbose settings', async () => {
            const advancedBundler = new ThemesBundler({
                exportPath: outputDir + '/test-advanced',
                themes: [{ path: basePath + '/default', verbose: true }],
                patterns: ['/{cwd}/demo/css/components'],
                watchPaths: [cwd + '/demo/css'],
                minify: false
            });
            await advancedBundler.promise;
            await advancedBundler.bundle();

            expect(advancedBundler.themes.length).toBe(1);
            expect(advancedBundler._config?.watchPaths).toContain(cwd + '/demo/css');

            expect(existsSync(advancedBundler.getTheme('default')?.getTargetFile() || '')).toBe(true);
            await advancedBundler.cleanup();
        });

        it('bundles with different configurations per theme', async () => {
            const multiBundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-multiconfig',
                themes: [{ path: basePath + '/default' }, { path: basePath + '/dark' }],

                patterns: [cwd + '/demo/css/components/**/*']
            });
            await multiBundler.promise;
            await multiBundler.bundle();

            expect(existsSync(`${multiBundler.getTheme('default')?.getTargetFile()}`)).toBe(true);
            expect(existsSync(`${multiBundler.getTheme('dark')?.getTargetFile()}`)).toBe(true);
            await multiBundler.cleanup();
        });

        it('starts watch mode for all themes', async () => {
            const watchBundler = new ThemesBundler({
                themes: [{ path: basePath + '/default' }],
                commonThemePath: cwd + '/demo/themes/common'
            });
            await watchBundler.promise;

            await watchBundler.watch();

            expect(watchBundler.commonTheme?.watchers.length).toBeGreaterThan(0);
            await watchBundler.cleanup();
        });

        it('skips invalid theme paths during initialization', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const invalidBundler = new ThemesBundler({
                themes: [{ path: basePath + '/default' }, { path: '/non/existent/theme/path' }]
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Theme path /non/existent/theme/path does not exist')
            );
            expect(invalidBundler.themes.length).toBe(1);

            consoleSpy.mockRestore();
        });
    });

    describe('Bundle and Watch Integration', () => {
        /** @type {ThemesBundler} */
        let bundler;

        beforeEach(async () => {
            bundler = new ThemesBundler({
                exportPath: outputDir + '/test-output',
                themes: [{ path: basePath + '/default' }],
                patterns: ['{cwd}/demo/css/components'],
                commonThemePath: basePath + '/common'
            });
            await bundler.promise;
        });

        afterEach(async () => {
            await bundler.cleanup();
        });

        it('bundles and starts watch mode with bundleAndWatch', async () => {
            const result = await bundler.initialize(true);
            expect(result?.length).toBe(1);
            expect(bundler.getTheme('default')?.watchers.length).toBeGreaterThan(0);
        });

        it('bundles without watch when flag is false', async () => {
            const result = await bundler.initialize(false);
            expect(result?.length).toBe(1);
            // Watchers should not be started
            const hasWatchers = bundler.themes.some(theme => theme.watchers.length > 0);
            expect(hasWatchers).toBe(false);
        });

        it('triggers rebundle when common theme changes', async () => {
            await bundler.bundle();
            bundler.watch();

            // Wait for watchers to be set up
            await new Promise(resolve => setTimeout(resolve, 200));
            // Verify watch callback exists
            expect(bundler.commonTheme?.watchers.length).toBeGreaterThan(0);

            // Trigger change by modifying a common theme file
            const commonFile = path.join(basePath, 'common', 'vars.css');
            const content = await readFileSync(commonFile, 'utf8');
            await writeFileSync(commonFile, content + '\n.common-test-change{color:blue}\n', 'utf8');

            // Poll for the bundled file to contain the change (wait for watcher to trigger)
            const defaultTargetFile = bundler.themes[0].getTargetFile();
            let themeContent = '';
            const maxWaitTime = 500;
            const pollInterval = 100;
            const startTime = Date.now();

            while (!themeContent.includes('.common-test-change{') && Date.now() - startTime < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                themeContent = await readFileSync(defaultTargetFile, 'utf8');
            }

            // Revert change
            await writeFileSync(commonFile, content, 'utf8');

            // Assert the change was detected and rebundled
            expect(themeContent).toContain('.common-test-change{');
        });
    });

    afterEach(async () => {
        // Final cleanup after all tests
        await bundler.themes.forEach(async theme => {
            await theme.clearWatchers();
        });
    });
});
