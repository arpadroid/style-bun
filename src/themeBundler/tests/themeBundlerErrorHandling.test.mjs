import { join } from 'path';
import ThemeBundler from '../themeBundler.mjs';
import { defaultConfig, demoDir, initializeTest, outputDir, themesDir } from './tests.util.mjs';

describe('Error handling', () => {
    beforeAll(async () => {
        await initializeTest();
    });
    it('Throws an error if the theme path does not exist', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const theme = new ThemeBundler({ ...defaultConfig, path: '/invalid/path/to/theme' });
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid path in theme config'));
        consoleSpy.mockRestore();
        await theme.promise;
        await theme.cleanup();
    });

    it('Throws an error if the theme does not have a configuration file', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const theme = new ThemeBundler({ ...defaultConfig, path: demoDir });
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining(" Config file not found for theme 'demo'")
        );
        consoleSpy.mockRestore();
        await theme.promise;
        await theme.cleanup();
    });

    it('Throws an error if the theme configuration file is invalid', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const theme = new ThemeBundler({
            ...defaultConfig,
            path: join(themesDir, 'invalid-config')
        });

        await theme.promise;
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Failed to load config file for theme'),
            expect.anything()
        );
        consoleSpy.mockRestore();
        await theme.cleanup();
    });

    it('Throws an error if the common theme file does not exist', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const theme = new ThemeBundler({
            ...defaultConfig,
            commonThemeFile: join(demoDir, 'nonexistent-common.css')
        });
        await theme.promise;
        const commonThemeFile = theme.getCommonThemeFile();
        expect(commonThemeFile).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('common theme file does not exist'));
        consoleSpy.mockRestore();
        await theme.cleanup();
    });

    it('Throws an error if the base theme does not exist', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const theme = new ThemeBundler({
            ...defaultConfig,
            baseTheme: join(demoDir, 'nonexistent-base-theme')
        });
        await theme.promise;
        theme.setBaseTheme(join(demoDir, 'nonexistent-base-theme'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Base theme does not exist'));
        consoleSpy.mockRestore();
        await theme.cleanup();
    });

    it('Throws warning when bundling if scss is not installed', async () => {
        const consoleSpy = jest.spyOn(console, 'warn');

        const theme = new ThemeBundler({
            ...defaultConfig,
            extension: 'scss'
        });
        jest.spyOn(theme, 'hasSassSupport').mockReturnValueOnce(false);
        await theme.promise;
        await theme.bundle();
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("SCSS files detected but 'sass' is not installed.")
        );
        consoleSpy.mockRestore();
        await theme.cleanup();
    });

    test('writeStyles throws a warning if there are no styles to write', async () => {
        const consoleSpy = jest.spyOn(console, 'warn');
        const theme = new ThemeBundler({
            path: join(themesDir, 'empty'),
            patterns: [],
            exportPath: outputDir,
            verbose: true
        });
        await theme.promise;
        await theme.writeStyles('');
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('No CSS found in theme file'),
            'empty'
        );
        consoleSpy.mockRestore();
        await theme.cleanup();
    });
});
