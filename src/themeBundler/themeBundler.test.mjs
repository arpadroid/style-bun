/**
 * @jest-environment node
 */
import fs, { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import ThemeBundler from './themeBundler.mjs';

const demoDir = path.join(process.cwd(), 'demo');
const testDir = path.join(process.cwd(), 'test');
const themesDir = path.join(demoDir, 'themes');
const defaultThemeDir = path.join(themesDir, 'default');
const outputDir = path.join(testDir, 'output');

/**
 * Verifies that making changes to a file are reflected in the output files.
 * @param {ThemeBundler} theme - The ThemeBundler instance.
 * @param {string} outputFile - The path to the output file.
 * @param {jest.Mock | undefined} spy - The jest mock function to verify callback invocations.
 * @param {string} changeFile - The file to make changes to.
 * @param {string} changeText - The text to append to the change file.
 * @param {string} [minifiedText] - The expected text in the minified output file.
 */
export const verifyOutput = async (theme, outputFile, spy, changeFile, changeText, minifiedText = changeText) => {
    spy?.mockClear();
    const originalContent = await readFileSync(changeFile, 'utf8');
    await appendFileSync(changeFile, changeText, 'utf8');

    // Wait for the watcher to detect the change and re-bundle
    await new Promise(resolve => setTimeout(resolve, 100));

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
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(readFileSync(outputFile, 'utf8')).not.toContain(changeText);
    expect(readFileSync(minFile, 'utf8')).not.toContain(minifiedText);
    expect(spy).toHaveBeenCalledTimes(2);
};

describe('ThemeBundler', () => {
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    // create test common theme file
    const commonThemeFile = path.join(testDir, 'common.css');
    fs.writeFileSync(commonThemeFile, ':root { --common-theme-var: yellowgreen; }', 'utf8');

    // Create theme instance
    const theme = new ThemeBundler({
        path: defaultThemeDir,
        patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
        exportPath: outputDir,
        commonThemeFile
    });

    describe('Default Theme', () => {
        it('Initializes theme and cleans-up any previous output', async () => {
            await theme.promise;
            await theme.cleanup();
            const outputFile = theme.getTargetFile();
            expect(fs.existsSync(outputFile)).toBe(false);
        });

        it('Loads the file config', async () => {
            expect(theme._fileConfig).toHaveProperty('includes');
        });

        it('Checks for valid properties', async () => {
            expect(theme.getName()).toBe('default');
            expect(theme.getPath()).toBe(defaultThemeDir);
            expect(theme.getConfigFile()).toBe(path.join(defaultThemeDir, 'default.config.json'));
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
            const content = fs.readFileSync(outputFile, 'utf8');
            expect(content).toContain('--common-theme-var: yellowgreen;');
        });

        it('Checks that components and pages stylesheets were included in the bundle as defined in patterns', async () => {
            const outputFile = theme.getTargetFile();
            const content = fs.readFileSync(outputFile, 'utf8');
            expect(content).toContain('.button {');
            expect(content).toContain('dark-theme-button');
        });

        it('Handles debouncing during bundle calls', async () => {
            jest.spyOn(theme, 'writeStyles');
            await new Promise(resolve => setTimeout(resolve, 100));
            // Call bundle multiple times in quick succession
            theme.bundle();
            theme.bundle();
            theme.bundle();
            expect(theme.writeStyles).toHaveBeenCalledTimes(1);
            await new Promise(resolve => setTimeout(resolve, 100));
            await theme.bundle();
            await new Promise(resolve => setTimeout(resolve, 100));
            await theme.bundle();
            expect(theme.writeStyles).toHaveBeenCalledTimes(3);
        });
    });

    describe('Watch Mode', () => {
        /** @type {jest.Mock | undefined} */
        let spy;
        /** @type {string} */
        let outputFile = '';
        beforeAll(async () => {
            await theme.promise;
            await theme.cleanup();
            await theme.bundle(true);

            spy = jest.fn(() => {
                console.log('Watch triggered');
            });

            theme.watch(spy, true, true);
            await new Promise(resolve => setTimeout(resolve, 100));
            outputFile = theme.getTargetFile();
        });

        afterAll(() => {
            theme.clearWatchers();
            expect(theme.watchers?.length).toBe(0);
        });

        const changeContent = '.dummy-change{color:componentDummyColor}';

        it('Makes a change to a component file, verifies output files for changes and callback invocation.', async () => {
            const changeFile = path.join(demoDir, 'components', 'button', 'styles', 'button.default.css');
            await verifyOutput(theme, outputFile, spy, changeFile, changeContent);
        });

        it('Makes a change to a theme file, verifies output files for changes and callback invocation.', async () => {
            const changeFile = path.join(defaultThemeDir, 'main/main.css');
            await verifyOutput(theme, outputFile, spy, changeFile, changeContent);
        });
    });

    // it('Cleans up the bundled files', async () => {});

    afterAll(async () => {
        await theme.cleanup();
        expect(theme.watchers?.length).toBe(0);

        const outputFile = theme.getTargetFile();
        expect(fs.existsSync(outputFile)).toBe(false);

        const minFile = theme.getMinifiedTargetFile();
        expect(fs.existsSync(minFile)).toBe(false);
        // Clean up test output directory1
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });
});
