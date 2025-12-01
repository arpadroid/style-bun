/**
 * @jest-environment node
 */
import ThemesBundler from './themesBundler.mjs';

describe('ThemesBundler', () => {
    const cwd = process.cwd();
    const basePath = cwd + '/demo/css/themes';
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
            const themeName = theme.getName();
            const exportPath = bundler._config?.exportPath;
            const bundledFilePath = `${exportPath}/${themeName}/${themeName}.bundled.css`;
            const fs = await import('fs');
            expect(fs.existsSync(bundledFilePath)).toBe(false);
        }
    });

    it('bundles themes', async () => {
        await bundler.promise;
        const response = await bundler.bundle();
        expect(response?.length).toBe(4);
        // Check there are .bundled.css files in the output directories.
        for (const theme of bundler.themes) {
            const themeName = theme.getName();
            const exportPath = bundler._config?.exportPath;

            const bundledFilePath = `${exportPath}/${themeName}/${themeName}.bundled.css`;
            const fs = await import('fs');
            expect(fs.existsSync(bundledFilePath)).toBe(true);
        }
    });
});
