/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import ThemeBundler from './themeBundler.mjs';

const demoDir = path.join(process.cwd(), 'demo', 'css');
const testDir = path.join(demoDir, 'test');
const themesDir = path.join(demoDir, 'themes');
const defaultThemeDir = path.join(themesDir, 'default');
const outputDir = path.join(testDir, 'output');
const filePatterns = [path.join(demoDir, 'components'), path.join(demoDir, 'pages')];
const customThemeDir = path.join(testDir, 'custom-theme');
const customConfigPath = path.join(customThemeDir, 'custom-theme.config.json');

async function initializeCustomTheme() {
    // create custom theme directory and files
    if (!fs.existsSync(customThemeDir)) {
        fs.mkdirSync(customThemeDir, { recursive: true });
    }
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
        customConfigPath,
        JSON.stringify({
            name: 'custom-theme',
            includes: ['style']
        }),
        'utf8'
    );
    const themeFilePath = path.join(customThemeDir, 'style.css');
    fs.writeFileSync(themeFilePath, 'body { background-color: yellowgreen; }', 'utf8');
    return new ThemeBundler({
        path: customThemeDir,
        exportPath: outputDir
    });
}

describe('ThemeBundler', () => {
    const defaultTheme = new ThemeBundler({
        path: defaultThemeDir,
        patterns: filePatterns,
        exportPath: outputDir
    });

    describe('Default Theme', () => {
        it('initializes the default theme', async () => {
            await defaultTheme.promise;
            expect(defaultTheme.getName()).toBe('default');
            expect(defaultTheme.getPath()).toBe(defaultThemeDir);
        });
        it('compiles the default theme and checks for the output file', async () => {
            await defaultTheme.bundle();
            const outputFile = path.join(outputDir, 'default', 'default.bundled.css');
            expect(fs.existsSync(outputFile)).toBe(true);
            expect(fs.readFileSync(outputFile, 'utf8')).toContain('--grey-100');
        });
    });
    /** @type {ThemeBundler} */
    let customTheme;
    describe('Custom Theme', () => {
        beforeAll(async () => {
            // Ensure custom theme is initialized before tests
            customTheme = await initializeCustomTheme();
            await customTheme.promise.catch(err => {
                console.error('Error initializing custom theme:', err);
            });
        });
        it('initializes the custom theme', async () => {
            expect(customTheme.getName()).toBe('custom-theme');
            expect(customTheme.getPath()).toBe(customThemeDir);
        });
        it('compiles the custom theme and checks for the output file', async () => {
            await customTheme.bundle();
            const outputFile = path.join(outputDir, 'custom-theme', 'custom-theme.bundled.css');
            expect(fs.existsSync(outputFile)).toBe(true);
            expect(fs.readFileSync(outputFile, 'utf8')).toContain('background-color: yellowgreen;');
        });
    });

    afterAll(() => {
        // Clean up test output directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        customTheme?.cleanup();
        defaultTheme?.cleanup();
    });
});
