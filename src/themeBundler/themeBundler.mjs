/**
 * @typedef {import('../common.types.js').BundlerCommandArgsType} BundlerCommandArgsType
 * @typedef {import('./themeBundler.types.js').ThemeBundlerConfigType} ThemeBundlerConfigType
 * @typedef {import('../themesBundler/themesBundler.types.js').WriteStylesReturnType} WriteStylesReturnType
 * @typedef {import('../themesBundler/themesBundler.types.js').StyleUpdateCallbackType} StyleUpdateCallbackType
 */
import { glob } from 'glob';
import PATH from 'path';
import { execSync } from 'child_process';
import fs, { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
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

    ///////////////////////////
    // #region Initialization
    //////////////////////////

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
     * Initializes the theme, this method should be called externally.
     * @returns {Promise<boolean>}
     */
    async _initialize() {
        const { baseTheme, path } = this._config || {};
        this.setPath(path);
        /** @type {string} themeName */
        this.themeName = this.path?.split(PATH.sep).pop() ?? '';
        await this._initializeConfig();
        baseTheme && this.setBaseTheme(baseTheme);
        return true;
    }

    async _initializeConfig() {
        this.fileConfig = await this.loadFileConfig();
        this._config = Object.assign(this._config || {}, this.fileConfig || {}) || {};
        /** @type {'css' | 'scss' | undefined} extension */
        this.extension = this.getExtension();
        this._config && (this._config.extension = this.extension);
    }

    async loadFileConfig() {
        const configFile = this.getConfigFile();
        if (configFile && !fs.existsSync(configFile)) {
            console.error(`🚫 Config file not found for theme '${this.themeName}': ` + configFile);
            return Promise.resolve({});
        }
        const payload = (await fs.readFileSync(configFile)).toString();
        return Promise.resolve(JSON.parse(payload));
    }

    // #endregion Initialization

    ////////////////
    // #region Get
    ///////////////

    getExtension() {
        return this._config?.extension || 'css';
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
     * Returns the path to the config file.
     * @returns {string}
     */
    getConfigFile() {
        return PATH.normalize(`${this.path}/${this.themeName}.config.json`);
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
     * Returns the stylesheet includes defined in the theme config.
     * @returns {string[]}
     */
    getIncludes() {
        return (this.fileConfig?.includes ?? []).map((/** @type {string} */ include) =>
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
            console.warn('⚠️  No CSS found in file:', file);
            return;
        }
        if (MODE === 'development') {
            css += `\r\n/*\r\n File: ${file}  \r\n*/\r\n`;
        }
        css += fileContent;
        return css;
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
        if (file && !existsSync(file)) {
            console.error(`🚫 common theme file does not exist: ${file}.`);
            return undefined;
        }
        return file;
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

    getCSSTargetFile() {
        return this.getTargetFile().replace(`.${this.extension}`, '.css');
    }

    /**
     * Returns the target file where the minified styles will be saved.
     * @returns {string}
     */
    getMinifiedTargetFile() {
        return this._config?.minifiedTarget ?? PATH.normalize(`${this.path}/${this.themeName}.min.css`);
    }

    /**
     * Returns all the files that match the patterns defined in the theme config.
     * @returns {string[]}
     */
    getPatternFiles() {
        /** @type {string[]} */
        let files = [];
        this.getPatterns().forEach(pattern => {
            files = files.concat(
                glob.sync(pattern, {
                    cwd: this.path,
                    absolute: true,
                    ignore: ['**/.git/**', '**/node_modules/**']
                })
            );
        });

        return files;
    }

    /**
     * Returns the file patterns defined in the theme config.
     * @param {boolean} addExtension
     * @returns {string[]}
     */
    getPatterns(addExtension = true) {
        return this._config?.patterns?.map(pattern => this.normalizePattern(pattern, addExtension)) ?? [];
    }

    /**
     * Checks if SCSS support is available.
     * @returns {boolean}
     */
    hasSassSupport(packageName = 'sass') {
        try {
            require.resolve(packageName);
            return true;
        } catch {
            return false;
        }
    }

    // #endregion Get

    //////////////////
    // #region Set
    //////////////////

    /**
     * Sets the base theme.
     * @param {string} baseTheme - The path to the base theme.
     */
    setBaseTheme(baseTheme) {
        const baseThemePath = baseTheme;
        if (!existsSync(baseThemePath)) {
            console.error(`🚫 Base theme does not exist: ${baseThemePath}`);
        }
        this.baseTheme = new ThemeBundler({
            path: baseThemePath,
            extension: this.extension
        });
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
     * Sets the path to the theme.
     * @param {string} path - The path to the theme.
     * @throws {Error} - If the path is not a string or the path is not a directory.
     */
    setPath(path = cwd) {
        if (typeof path !== 'string' || !fs.existsSync(path) || !fs.lstatSync(path).isDirectory()) {
            console.error(`🚫 Invalid path in theme config ${this.getName()}: "${path}"`);
        }

        /** @type {string | undefined} path */
        this.path = path;
    }

    // #endregion Set

    //////////////////////
    // #region Helpers
    /////////////////////

    /**
     * Appends the theme name sub-extension and file extension to a pattern.
     * @param {string} pattern
     * @param {boolean} addExtension
     * @returns {string}
     */
    normalizePattern(pattern, addExtension = true) {
        if (pattern.indexOf('{cwd}') !== -1) {
            pattern = pattern.replace('{cwd}', cwd);
        }

        if (pattern[0] !== '/' && !PATH.isAbsolute(pattern)) {
            pattern = PATH.normalize(`${this.path}/${pattern}`);
        }
        if (!pattern.endsWith('*') && pattern.indexOf('**') === -1) {
            pattern += '/**/*';
        }
        if (addExtension) {
            pattern += `.${this.themeName}.${this.extension}`;
        }
        return pattern;
    }

    // #endregion Helpers

    /////////////////////
    // #region Bundling
    ////////////////////

    async bundle(minify = false) {
        if (this.bundlePromise) {
            return this.bundlePromise;
        } else {
            this.bundlePromise = this._bundle(minify);
        }
        return this.bundlePromise.then(response => {
            this.bundlePromise = null;
            return Promise.resolve(response);
        });
    }

    /**
     * Bundles the theme into a stylesheet.
     * @param {boolean} minify
     * @returns {Promise<boolean>}
     */
    async _bundle(minify = false) {
        await this.promise;
        const { verbose } = this._config || {};

        verbose && console.info('Compiling CSS theme:', this.themeName);
        const { styles, targetFile, result } = await this.writeStyles();
        let css = styles;

        let minifiedTargetFile = this.getMinifiedTargetFile();
        let targetCSS = this.getTargetFile();
        if (targetFile && this.extension === 'scss') {
            if (!this.hasSassSupport()) {
                console.warn("⚠️  SCSS files detected but 'sass' is not installed. Run: npm install sass");
                css = styles;
            } else {
                targetCSS = targetFile.replace('.scss', '.css');
                await this.scssToCss(targetFile, targetCSS);
                css = fs.readFileSync(targetCSS, 'utf8');
                minifiedTargetFile = minifiedTargetFile.replace('.scss', '.css');
            }
        }
        if (MODE === 'production' || minify === true) {
            const { code } = transform({
                code: Buffer.from(css || ''),
                minify: true,
                filename: targetCSS
            });
            fs.writeFileSync(minifiedTargetFile, code);
        }

        await this.exportBundle();
        return result;
    }

    /**
     * Writes the bundled styles to a file.
     * @param {string} [styles]
     * @returns {Promise<WriteStylesReturnType>}
     */
    async writeStyles(styles = undefined) {
        const { verbose } = this._config || {};
        styles = styles ?? (await this.mergeFiles());
        if (!styles?.trim().length) {
            const message = '⚠️  No CSS found in theme file';
            verbose && console.warn(message, this.themeName);
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
        if (!existsSync(exportDir)) {
            mkdirSync(exportDir, { recursive: true });
        }

        const targetFile = this.getTargetFile();

        if (existsSync(targetFile)) {
            copyFileSync(targetFile, PATH.normalize(`${exportDir}/${this.themeName}.bundled.css`));
        }

        const minifiedTargetFile = this.getMinifiedTargetFile();
        if (existsSync(minifiedTargetFile)) {
            copyFileSync(minifiedTargetFile, PATH.normalize(`${exportDir}/${this.themeName}.min.css`));
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
        if (existsSync(origin)) {
            if (!existsSync(destination)) {
                mkdirSync(destination, { recursive: true });
            }
            readdirSync(origin).forEach(file => {
                copyFileSync(`${origin}/${file}`, `${destination}/${file}`);
            });
        }
        return true;
    }

    /**
     * Merges all the theme files contents into a single string.
     * @returns {Promise<string>}
     */
    async mergeFiles() {
        this.css = '';
        this.files = this.getFiles();
        if (this.baseTheme) {
            this.css += await this.bundleBaseTheme();
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
    async bundleBaseTheme() {
        await this.baseTheme?.bundle();
        const targetFile = this.baseTheme?.getCSSTargetFile();
        if (!targetFile) {
            console.error('NO TARGET FILE!!!');
            return '';
        }
        return await fs.readFileSync(targetFile).toString();
    }

    /**
     * Converts scss to css.
     * @param {string} scssFile
     * @param {string} cssFile
     * @returns {string}
     */
    scssToCss(scssFile, cssFile) {
        const sassPath = PATH.resolve('node_modules/.bin/sass');
        const cmd = `"${sassPath}" "${scssFile}" "${cssFile}"`;
        return execSync(cmd).toString();
    }

    /**
     * Cleans up the bundled and minified files.
     */
    cleanup() {
        const name = this.themeName;
        const ext = this.extension;
        const files = [`${name}.bundled.${ext}`, `${name}.min.css`, `${name}.bundled.css.map`];
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

        this.clearWatchers();
        if (this.baseTheme) {
            this.baseTheme.cleanup();
        }
    }

    clearWatchers() {
        this.watchers.forEach(watcher => {
            watcher?.close();
        });
        this.watchers = [];
    }

    // #endregion Bundling

    /////////////////////
    // #region Watch
    ////////////////////

    /**
     * Watches the theme files for changes.
     * @param {StyleUpdateCallbackType} [callback]
     * @param {boolean} [bundle]
     * @param {boolean} [minify]
     */
    async watch(callback, bundle = true, minify = false) {
        await this.promise;
        if (this.baseTheme) {
            await this.baseTheme.promise;
            this.baseTheme.watch(() => this.bundle(minify), false);
        }
        this.watchPatterns(bundle, minify, callback);
        this.path && this.watchPath(this.path, bundle, minify, callback);
    }

    /**
     * Watches the theme path for changes and re-bundles the theme.
     * @param {string} path - The path to watch.
     * @param {boolean} bundle - Whether to bundle the theme after a change.
     * @param {boolean} [minify] - Whether to minify the theme after a change.
     * @param {StyleUpdateCallbackType} [callback] - The callback to execute after a change.
     */
    watchPath(path, bundle = true, minify = false, callback) {
        this.watcher = chokidar.watch(path, {
            ignored: /node_modules/,
            persistent: true
        });
        this.watchers.push(this.watcher);

        this.watcher.on('change', async filePath => {
            const bundledFile = `${this.themeName}.bundled.${this.extension}`;
            const fileName = PATH.basename(filePath);
            if (
                !filePath.endsWith('.min.css') &&
                fileName &&
                ![bundledFile].includes(fileName) &&
                PATH.extname(filePath) === `.${this.extension}`
            ) {
                if (bundle) {
                    await this.bundle(minify);
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
     * @param {boolean} [minify] - Whether to minify the theme after a change.
     * @param {StyleUpdateCallbackType} [callback] - The callback to execute after a change.
     */
    watchPatterns(bundle = true, minify = false, callback) {
        const patterns = this.getPatterns(false);
        if (!Array.isArray(patterns)) {
            return;
        }
        patterns.forEach(pattern => this.watchPattern(pattern, callback, bundle, minify));
    }

    /**
     * Watches the given pattern path for changes and bundles the theme.
     * @param {string} pattern
     * @param {StyleUpdateCallbackType} [callback]
     * @param {boolean} [bundle]
     * @param {boolean} [minify]
     */
    watchPattern(pattern, callback, bundle = true, minify = false) {
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
                bundle && (await this.bundle(minify));
                typeof callback === 'function' && callback(PATH.relative(path, filePath), 'change');
            }
        });
    }

    // #endregion Watch
}

export default ThemeBundler;
