/**
 * @jest-environment node
 */
import path from 'path';
import ThemesBundler from './themesBundler.mjs';

import { existsSync, readFileSync, writeFileSync } from 'fs';

describe('ThemesBundler', () => {
    const cwd = process.cwd();
    const basePath = cwd + '/demo/themes';
    /** @type {ThemesBundler} */
    const bundler = new ThemesBundler({
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

    it('creates a ThemesBundler instance', async () => {
        expect(bundler).toBeInstanceOf(ThemesBundler);
    });

    it('initializes the bundler', async () => {
        const response = await bundler.promise;
        expect(bundler.themes.length).toBe(4);
        expect(response?.length).toBe(4);
    });

    it('cleans up files', async () => {
        await bundler.promise;
        bundler.cleanup();
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
                exportPath: cwd + '/demo/css/test-output-minify',
                themes: [{ path: basePath + '/default' }],
                patterns: [cwd + '/demo/css/components/**/*'],
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
            bundler.cleanup();
        });
    });

    describe('Advanced Features', () => {
        it('includes common theme and scans multiple patterns', async () => {
            const multiConfig = {
                exportPath: cwd + '/demo/css/test-output-multi',
                themes: [{ path: basePath + '/default' }],
                patterns: [cwd + '/demo/css/components/**/*', cwd + '/demo/css/pages/**/*'],
                minify: false
            };
            const multiBundler = new ThemesBundler(multiConfig);
            await multiBundler.promise;
            await multiBundler.bundle();

            const outputFile = `${multiBundler._config?.exportPath}/default/default.bundled.css`;
            const content = readFileSync(outputFile, 'utf8');
            expect(content.length).toBeGreaterThan(0);
            multiBundler.cleanup();
        });

        it('respects custom export paths', async () => {
            const customBundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/custom-export-test',
                themes: [{ path: basePath + '/dark' }],
                patterns: [cwd + '/demo/css/components/**/*']
            });
            await customBundler.promise;
            await customBundler.bundle();

            expect(existsSync(`${customBundler._config?.exportPath}/dark/dark.bundled.css`)).toBe(true);
            customBundler.cleanup();
        });
    });

    describe('Error Handling', () => {
        it('handles empty themes and invalid patterns gracefully', async () => {
            const emptyBundler = new ThemesBundler({ themes: [], patterns: [] });
            await emptyBundler.promise;
            expect(emptyBundler.themes.length).toBe(0);

            const invalidBundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-invalid',
                themes: [{ path: basePath + '/default' }],
                patterns: ['/nonexistent/**/*']
            });
            await invalidBundler.promise;
            await invalidBundler.bundle();

            const fs = await import('fs');
            expect(fs.existsSync(`${invalidBundler._config?.exportPath}/default/default.bundled.css`)).toBe(
                true
            );
            invalidBundler.cleanup();
        });
    });

    describe('Advanced Configuration', () => {
        it('handles watch paths and verbose settings', async () => {
            const advancedBundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-advanced',
                themes: [{ path: basePath + '/default', verbose: true }],
                patterns: [cwd + '/demo/css/components/**/*'],
                watchPaths: [cwd + '/demo/css'],
                minify: false
            });
            await advancedBundler.promise;
            await advancedBundler.bundle();

            expect(advancedBundler.themes.length).toBe(1);
            expect(advancedBundler._config?.watchPaths).toContain(cwd + '/demo/css');

            const fs = await import('fs');
            expect(fs.existsSync(`${advancedBundler._config?.exportPath}/default/default.bundled.css`)).toBe(
                true
            );
            advancedBundler.cleanup();
        });

        it('bundles with different configurations per theme', async () => {
            const multiBundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-multiconfig',
                themes: [{ path: basePath + '/default' }, { path: basePath + '/dark' }],

                patterns: [cwd + '/demo/css/components/**/*']
            });
            await multiBundler.promise;
            await multiBundler.bundle();

            const fs = await import('fs');
            expect(fs.existsSync(`${multiBundler._config?.exportPath}/default/default.bundled.css`)).toBe(
                true
            );
            expect(fs.existsSync(`${multiBundler._config?.exportPath}/dark/dark.bundled.css`)).toBe(true);
            multiBundler.cleanup();
        });

        it('starts watch mode for all themes', async () => {
            const watchBundler = new ThemesBundler({
                themes: [{ path: basePath + '/default' }],
                commonThemePath: cwd + '/demo/themes/common'
            });
            await watchBundler.promise;

            watchBundler.watch();

            expect(watchBundler.commonTheme?.watchers.length).toBeGreaterThan(0);
            watchBundler.cleanup();
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
        it('bundles and starts watch mode with bundleAndWatch', async () => {
            const bundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-output',
                themes: [{ path: basePath + '/default' }],
                patterns: [cwd + '/demo/css/components/**/*']
            });

            const result = await bundler.initialize(true);

            expect(result?.length).toBe(1);
            expect(bundler.themes[0].watchers.length).toBeGreaterThan(0);

            bundler.cleanup();
        });

        it('bundles without watch when flag is false', async () => {
            const bundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-output',
                themes: [{ path: basePath + '/default' }],
                patterns: [cwd + '/demo/css/components/**/*']
            });

            const result = await bundler.initialize(false);

            expect(result?.length).toBe(1);
            // Watchers should not be started
            const hasWatchers = bundler.themes.some(theme => theme.watchers.length > 0);
            expect(hasWatchers).toBe(false);

            bundler.cleanup();
        });

        it('triggers rebundle when common theme changes', async () => {
            const bundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-output',
                themes: [{ path: basePath + '/default' }],
                patterns: [cwd + '/demo/css/components/**/*'],
                commonThemePath: basePath + '/common'
            });

            await bundler.promise;
            await bundler.bundle();

            // Spy on bundleThemes before starting watch

            bundler.watch();
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait for watchers to be set up
            // Verify watch callback exists
            expect(bundler.commonTheme?.watchers.length).toBeGreaterThan(0);
            // Trigger change by modifying a common theme file
            const commonFile = path.join(basePath, 'common', 'vars.css');

            const content = await readFileSync(commonFile, 'utf8');
            await writeFileSync(commonFile, content + '\n/* common test change */', 'utf8');

            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for rebundle to complete
            const defaultTargetFile = bundler.themes[0].getTargetFile();
            const themeContent = await readFileSync(defaultTargetFile, 'utf8');
            expect(themeContent).toContain('/* common test change */');

            await writeFileSync(commonFile, content, 'utf8'); // Revert change

            await bundler.cleanup();
        });

        it('cleans up before bundling in initialize', async () => {
            const bundler = new ThemesBundler({
                exportPath: cwd + '/demo/css/test-output',
                themes: [{ path: basePath + '/default' }],
                patterns: [cwd + '/demo/css/components/**/*']
            });

            await bundler.bundle();

            // initialize should cleanup first
            const cleanupSpy = jest.spyOn(bundler, 'cleanup');
            await bundler.initialize(false);
            expect(cleanupSpy).toHaveBeenCalledTimes(1);
            cleanupSpy.mockRestore();
            bundler.cleanup();
        });
    });
});
