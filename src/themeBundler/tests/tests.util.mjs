/**
 * @typedef {import('../themeBundler.mjs').default} ThemeBundler
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { expect } from '@jest/globals';
import { join } from 'path';

export const demoDir = join(process.cwd(), 'demo');
export const testDir = join(process.cwd(), 'test');
export const themesDir = join(demoDir, 'themes');
export const defaultThemeDir = join(themesDir, 'default');
export const outputDir = join(testDir, 'output');
export const commonThemeFile = join(testDir, 'common.css');

export const defaultConfig = {
    path: defaultThemeDir,
    patterns: ['{cwd}/demo/components', '{cwd}/demo/pages'],
    exportPath: outputDir,
    commonThemeFile
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

export async function initializeTest() {
    if (!existsSync(outputDir)) {
        await mkdirSync(outputDir, { recursive: true });
    }
    // create test common theme file
    if (!existsSync(commonThemeFile)) {
        await writeFileSync(commonThemeFile, ':root { --common-theme-var: yellowgreen; }', 'utf8');
    }
}
