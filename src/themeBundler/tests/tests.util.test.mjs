/**
 * @jest-environment node
 */
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { initializeTest, commonThemeFile, outputDir, clearFileChange } from './tests.util.mjs';

describe('tests.util', () => {
    describe('initializeTest', () => {
        afterEach(() => {
            // Clean up after each test
            if (existsSync(outputDir)) {
                rmSync(outputDir, { recursive: true, force: true });
            }
        });

        it('creates outputDir and commonThemeFile when they do not exist', async () => {
            // Ensure files don't exist before test
            if (existsSync(commonThemeFile)) {
                unlinkSync(commonThemeFile);
            }
            if (existsSync(outputDir)) {
                rmSync(outputDir, { recursive: true, force: true });
            }

            await initializeTest();

            expect(existsSync(outputDir)).toBe(true);
            expect(existsSync(commonThemeFile)).toBe(true);
        });

        it('does not recreate files when they already exist', async () => {
            // First run to create the files
            await initializeTest();
            const firstRunStat = existsSync(commonThemeFile);

            // Second run should not recreate
            await initializeTest();
            const secondRunStat = existsSync(commonThemeFile);

            expect(firstRunStat).toBe(true);
            expect(secondRunStat).toBe(true);
        });

        it('uses clearFileChange to clear a file change', async () => {
            const testFile = commonThemeFile;
            const originalContent = await readFileSync(testFile, 'utf8');
            const changeText = '\n/* Test Change */\n';

            // Apply a change
            await writeFileSync(testFile, originalContent + changeText, 'utf8');
            let modifiedContent = await readFileSync(testFile, 'utf8');
            expect(modifiedContent).toContain(changeText);

            // Clear the change

            await clearFileChange(testFile, changeText);

            // Verify the change is cleared
            modifiedContent = await readFileSync(testFile, 'utf8');
            expect(modifiedContent).not.toContain(changeText);
            expect(modifiedContent).toBe(originalContent);
        });
    });
});
