/**
 * @typedef {import('../common.types.js').BundlerCommandArgsType} BundlerCommandArgsType
 * @typedef {import('./themeBundler.types.js').ThemeBundlerConfigType} ThemeBundlerConfigType
 * @typedef {import('../themesBundler/themesBundler.types.js').WriteStylesReturnType} WriteStylesReturnType
 * @typedef {import('../themesBundler/themesBundler.types.js').StyleUpdateCallbackType} StyleUpdateCallbackType
 */
import { glob } from 'glob';
import PATH from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { transform } from 'lightningcss';
import chokidar from 'chokidar';

/** @type {BundlerCommandArgsType} */
const argv = yargs(hideBin(process.argv)).argv;
const cwd = process.cwd();
const MODE = argv.mode === 'production' ? 'production' : 'development';
const VERBOSE = argv.verbose;

class ThemeBundler {
    /** @type {import('chokidar').FSWatcher[]} */
    watchers = [];
    /**
     * This class bundles and watches themes.
     * @param {ThemeBundlerConfigType} config
     */
    constructor(config) {
        this.setConfig(config);
        /** @type {Promise<boolean>} */
        this.promise = this._initialize();
    }

    /**
     * Sets the config.
     * @param {ThemeBundlerConfigType} config
     */
    setConfig(config = {}) {
        /** @type {ThemeBundlerConfigType} */
        this._config = Object.assign(this.getDefaultConfig(), config);
    }

    /**
     * Returns default config.
     * @returns {ThemeBundlerConfigType}
     */
    getDefaultConfig() {
        return {
            extension: 'css',
            patterns: [],
            includes: [],
            verbose: VERBOSE
        };
    }

    /**
     * Checks if SCSS support is available.
     * @returns {boolean}
     */
    hasSassSupport() {
        try {
            require.resolve('sass');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns the path to the config file.
     * @returns {string}
     */
    getConfigFile() {
        return PATH.normalize(`${this.path}/${this.themeName}.config.json`);
    }

    /**
     * Initializes the theme, this method should be called externally.
     * @returns {Promise<boolean>}
     */
    async _initialize() {
        const { baseTheme, path, extension } = this._config || {};
        this.setPath(path);
        /** @type {string} themeName */
        this.themeName = this.path?.split(PATH.sep).pop() ?? '';
        this._fileConfig = await this._loadFileConfig();
        Object.assign(this._config || {}, this._fileConfig || {});
        /** @type {'css' | 'scss' | undefined} extension */
        this.extension = extension;

        if (baseTheme) {
            this.setBaseTheme(baseTheme);
        }
        return true;
    }

    /**
     * Sets the base theme.
     * @param {string} baseTheme - The path to the base theme.
     */
    setBaseTheme(baseTheme) {
        const baseThemePath = PATH.resolve(baseTheme);
        if (!fs.existsSync(baseThemePath)) {
            console.log(`ThemeBundler => Base theme does not exist: ${baseThemePath}`);
        }
        this.baseTheme = new ThemeBundler({
            path: baseThemePath,
            extension: this.extension
        });
    }

    /**
     * Sets the path to the theme.
     * @param {string} path - The path to the theme.
     * @throws {Error} - If the path is not a string or the path is not a directory.
     */
    setPath(path = cwd) {
        if (typeof path !== 'string' || !fs.lstatSync(path).isDirectory()) {
            console.log(`ThemeBundler => Invalid path in theme config ${this.themeName}: "${path}"`);
        }
        /** @type {string | undefined} path */
        this.path = path;
    }

    async _loadFileConfig() {
        const configFile = this.getConfigFile();
        if (configFile && !fs.existsSync(configFile)) {
            console.log(`ThemeBundler => Config file not found for theme '${this.themeName}': ` + configFile);
            return Promise.resolve({});
        }
        // const payload = await fs.readFileSync(configFile);
        const payload = (await fs.readFileSync(configFile)).toString();
        return Promise.resolve(JSON.parse(payload));
    }

    /**
     * Returns the name of the theme.
     * @returns {string}
     */
    getName() {
        return this.themeName || '';
    }

    /**
     * Returns the path to the theme.
     * @returns {string}
     */
    getPath() {
        return this.path || '';
    }

    /**
     * Bundles the theme into a stylesheet.
     * @param {boolean} minify
     * @returns {Promise<boolean>}
     */
    async bundle(minify = false) {
        const { verbose } = this._config || {};
        if (this.timeout) {
            // DEBOUNCING
            verbose && console.log('ThemeBundler =>', 'Debouncing theme bundle: ', this.themeName);
            return false;
        }
        verbose && console.info('Compiling CSS theme:', this.themeName);
        this.debounce();
        const { styles, targetFile, result } = await this.writeStyles();
        let css = styles;
        let minifiedTargetFile = this.getMinifiedTargetFile();
        if (targetFile && this.extension === 'scss') {
            if (!this.hasSassSupport()) {
                console.warn('⚠️  SCSS files detected but \'sass\' is not installed. Run: npm install sass');
                console.warn('   Treating SCSS files as CSS for now.');
                css = styles;
            } else {
                const targetCSS = targetFile.replace('.scss', '.css');
                await this.scssToCss(targetFile, targetCSS);
                css = fs.readFileSync(targetCSS, 'utf8');
                minifiedTargetFile = minifiedTargetFile.replace('.scss', '.css');
            }
        }
        if (MODE === 'production' || minify === true) {
            const { code } = transform({
                code: Buffer.from(css || ''),
                minify: true,
                filename: this.getTargetFile()
            });
            fs.writeFileSync(minifiedTargetFile, code);
        }
        await this.exportBundle();
        return result;
    }

    /**
     * Writes the bundled styles to a file.
     * @returns {Promise<WriteStylesReturnType>}
     */
    async writeStyles() {
        const styles = await this.mergeFiles();
        if (!styles?.length) {
            const message = `- No css found in file: ${this.themeName}`;
            if (VERBOSE) {
                console.log(message, this.themeName);
            }
            return Promise.resolve({ message, styles });
        }
        const targetFile = this.getTargetFile();
        const result = await fs.writeFileSync(targetFile, styles);
        return { result, styles, targetFile };
    }

    /**
     * Exports the bundled theme.
     * Will create a directory with the theme name in the export path if it doesn't exist and save the minified bundle file and the fonts directory.
     * @returns {Promise<boolean>}
     */
    async exportBundle() {
        const exportPath = this._config?.exportPath;
        if (!exportPath) return false;
        const exportDir = PATH.normalize(`${exportPath}/${this.themeName}`);
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const targetFile = this.getTargetFile();

        fs.existsSync(targetFile) &&
            fs.copyFileSync(targetFile, PATH.normalize(`${exportDir}/${this.themeName}.bundled.css`));

        const minifiedTargetFile = this.getMinifiedTargetFile();
        if (fs.existsSync(minifiedTargetFile)) {
            fs.copyFileSync(minifiedTargetFile, PATH.normalize(`${exportDir}/${this.themeName}.min.css`));
        }
        const fontsDIR = PATH.normalize(`${this.path}/fonts`);
        const fontsExportDIR = PATH.normalize(`${exportDir}/fonts`);
        this.exportDir(fontsDIR, fontsExportDIR);

        const imagesDIR = PATH.normalize(`${this.path}/images`);
        const imagesExportDIR = PATH.normalize(`${exportDir}/images`);
        return this.exportDir(imagesDIR, imagesExportDIR);
    }

    /**
     * Exports a directory.
     * @param {string} origin
     * @param {string} destination
     * @returns {Promise<boolean>}
     */
    async exportDir(origin, destination) {
        if (fs.existsSync(origin)) {
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }
            fs.readdirSync(origin).forEach(file => {
                fs.copyFileSync(`${origin}/${file}`, `${destination}/${file}`);
            });
        }
        return true;
    }

    /**
     * Debounces the bundle method.
     */
    debounce() {
        this.timeout = setTimeout(() => {
            clearTimeout(this.timeout);
            this.timeout = null;
        }, 100);
    }

    /**
     * Merges all the theme files contents into a single string.
     * @returns {Promise<string>}
     */
    async mergeFiles() {
        this.css = '';
        this.files = this.getFiles();
        if (this.baseTheme) {
            this.css += await this.getBaseTheme();
        }
        this.files?.forEach(file => {
            const css = this.getCSS(file);
            if (typeof css === 'string') {
                this.css += css;
            }
        });
        return this.css;
    }

    /**
     * Bundles and returns the base theme contents.
     * @returns {Promise<string>}
     */
    async getBaseTheme() {
        await this.baseTheme?.bundle();
        const targetFile = this.baseTheme?.getTargetFile();
        if (!targetFile) return '';
        return await fs.readFileSync(targetFile).toString();
    }

    /**
     * Returns all the theme files.
     * @returns {string[]}
     */
    getFiles() {
        const commonThemeFile = this.getCommonThemeFile();
        const includes = this.getIncludes();
        
        const patternFiles = this.getPatternFiles();
        return [commonThemeFile, ...includes, ...patternFiles]
            .filter(file => typeof file === 'string' && fs.existsSync(file))
            .filter(item => typeof item !== 'undefined');
    }

    /**
     * Returns the common theme file path.
     * @returns {string | undefined}
     */
    getCommonThemeFile() {
        if (this.getName() === 'common') {
            return undefined;
        }
        const file = this._config?.commonThemeFile;
        if (file && fs.existsSync(file) && !fs.lstatSync(file).isFile()) {
            console.log(`ThemeBundler => common theme file does not exist ${file}.`);
            return undefined;
        }
        return file;
    }

    /**
     * Returns the stylesheet includes defined in the theme config.
     * @returns {string[]}
     */
    getIncludes() {
        return (this._fileConfig?.includes ?? []).map((/** @type {string} */ include) =>
            PATH.join(this.path || '', `${include}.${this.extension}`)
        );
    }

    /**
     * Returns the CSS content of a file.
     * @param {string} file
     * @returns {string | undefined}
     */
    getCSS(file) {
        let css = '';
        if (file !== this._config?.commonThemeFile && file.endsWith(`.bundled.${this.extension}`)) {
            return css;
        }
        const fileContent = fs.readFileSync(file, 'utf8');
        if (!fileContent || !fileContent.length) {
            if (this._config?.verbose) {
                console.log('no CSS found in file:' + file);
            }
            return;
        }
        if (MODE === 'development') {
            css += `\r\n/*\r\n File: ${file}  \r\n*/\r\n`;
        }
        css += fileContent;
        return css;
    }

    /**
     * Converts scss to css.
     * @param {string} scssFile
     * @param {string} cssFile
     * @returns {string}
     */
    scssToCss(scssFile, cssFile) {
        if (!this.hasSassSupport()) {
            throw new Error('SCSS compilation requires the sass package. Install it with: npm install sass');
        }
        const sassPath = PATH.resolve('node_modules/.bin/sass');
        const cmd = `"${sassPath}" "${scssFile}" "${cssFile}"`;
        return execSync(cmd).toString();
    }

    /**
     * Returns the target file where the un-minified styles will be saved.
     * @returns {string}
     */
    getTargetFile() {
        return (
            this._config?.target ?? PATH.normalize(`${this.path}/${this.themeName}.bundled.${this.extension}`)
        );
    }

    /**
     * Returns the target file where the minified styles will be saved.
     * @returns {string}
     */
    getMinifiedTargetFile() {
        return (
            this._config?.minifiedTarget ??
            PATH.normalize(`${this.path}/${this.themeName}.min.${this.extension}`)
        );
    }

    /**
     * Returns all the files that match the patterns defined in the theme config.
     * @returns {string[]}
     */
    getPatternFiles() {
        /** @type {string[]} */
        let files = [];
        this.getPatterns().map(
            pattern =>
                (files = files.concat(
                    glob.sync(pattern, {
                        cwd: this.path,
                        absolute: true,
                        ignore: ['**/.git/**', '**/node_modules/**']
                    })
                ))
        );
        return files;
    }

    /**
     * Returns the file patterns defined in the theme config.
     * @param {boolean} addExtension
     * @returns {string[]}
     */
    getPatterns(addExtension = true) {
        return this._config?.patterns?.map(pattern => this.applyPattern(pattern, addExtension)) ?? [];
    }

    /**
     * Appends the theme name sub-extension and file extension to a pattern.
     * @param {string} pattern
     * @param {boolean} addExtension
     * @returns {string}
     */
    applyPattern(pattern, addExtension = true) {
        if (pattern.indexOf('{cwd}/') === 0) {
            pattern = pattern.replace('{cwd}', cwd);
        }
        if (pattern.indexOf('../') === 0) {
            const path = `${this.path}/${pattern}`;
            pattern = PATH.resolve(path);
        }
        if (addExtension) {
            pattern += `.${this.themeName}.${this.extension}`;
        }
        return pattern;
    }

    /**
     * Watches the theme files for changes.
     * @param {StyleUpdateCallbackType} [callback]
     * @param {boolean} [bundle]
     */
    async watch(callback, bundle = true) {
        if (this.baseTheme) {
            this.baseTheme.watch(() => this.bundle(), false);
        }
        this.watchPatterns(bundle, callback);
        this.path && this.watchPath(this.path, bundle, callback);
    }

    /**
     * Watches the theme path for changes and re-bundles the theme.
     * @param {string} path - The path to watch.
     * @param {boolean} bundle - Whether to bundle the theme after a change.
     * @param {StyleUpdateCallbackType} [callback] - The callback to execute after a change.
     */
    watchPath(path, bundle = true, callback) {
        this.watcher = chokidar.watch(path, {
            ignored: /node_modules/,
            persistent: true
        });
        this.watchers.push(this.watcher);

        this.watcher.on('change', async filePath => {
            const bundledFile = `${this.themeName}.bundled.${this.extension}`;
            const fileName = PATH.basename(filePath);
            if (
                fileName &&
                ![bundledFile].includes(fileName) &&
                PATH.extname(filePath) === `.${this.extension}`
            ) {
                if (bundle) {
                    await this.bundle();
                }
                if (typeof callback === 'function') {
                    callback(fileName, 'change');
                }
            }
        });
    }

    /**
     * Watches the theme patterns for changes and re-bundles the theme.
     * @param {boolean} bundle - Whether to bundle the theme after a change.
     * @param {StyleUpdateCallbackType} [callback] - The callback to execute after a change.
     */
    watchPatterns(bundle = true, callback) {
        const patterns = this.getPatterns(false);
        if (!Array.isArray(patterns)) {
            return;
        }
        patterns.forEach(pattern => this.watchPattern(pattern, callback, bundle));
    }

    /**
     * Watches the given pattern path for changes and bundles the theme.
     * @param {string} pattern
     * @param {StyleUpdateCallbackType} [callback]
     * @param {boolean} [bundle]
     */
    watchPattern(pattern, callback, bundle = true) {
        const path = pattern.replace('/**/*', '').replace('/*', '');
        if (!fs.existsSync(path)) return;
        const watcher = chokidar.watch(path, {
            ignored: /node_modules/,
            persistent: true
        });
        this.watchers.push(watcher);

        watcher.on('change', async filePath => {
            const ext = PATH.extname(filePath).slice(1);
            const subExt = PATH.basename(filePath).split('.')[1];
            if (this.extension === ext && subExt === this.themeName) {
                bundle && (await this.bundle());
                typeof callback === 'function' && callback(PATH.relative(path, filePath), 'change');
            }
        });
    }

    /**
     * Cleans up the bundled and minified files.
     */
    cleanup() {
        const name = this.themeName;
        const ext = this.extension;
        const files = [`${name}.bundled.${ext}`, `${name}.min.css`];
        if (this.extension === 'scss') {
            files.push(`${this.themeName}.bundled.css`);
        }
        files.forEach(file => {
            const filePath = PATH.normalize(`${this.path}/${file}`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            const exportPath = this._config?.exportPath;
            const exportedFilePath = PATH.normalize(`${exportPath}/${name}/${file}`);
            if (exportPath && fs.existsSync(exportedFilePath)) {
                fs.unlinkSync(exportedFilePath);
            }
        });

        this.watchers.forEach(watcher => {
            watcher?.close();
        });
    }
}

export default ThemeBundler;
