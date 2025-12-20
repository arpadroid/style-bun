/**
 * @jest-environment node
 */
import { existsSync, rmSync, unlinkSync } from 'fs';
import { initializeTest, commonThemeFile, outputDir } from './tests.util.mjs';

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
    });
});
