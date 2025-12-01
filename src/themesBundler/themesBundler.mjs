/**
 * @typedef {import('./themesBundler.types.js').ThemesBundlerConfigType} ThemesBundlerConfigType
 * @typedef {import('../themeBundler/themeBundler.types.js').ThemeBundlerConfigType} ThemeBundlerConfigType
 * @typedef {import('../common.types.js').BundlerCommandArgsType} BundlerCommandArgsType
 */

import PATH from 'path';
import fs from 'fs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import ThemeBundler from '../themeBundler/themeBundler.mjs';

/** @type {BundlerCommandArgsType} */
const argv = yargs(hideBin(process.argv)).argv;
const WATCH = argv?.watch;
class ThemesBundler {
    /** @type {ThemeBundler[]} themes */
    themes = [];

    /** @type {Record<string, ThemeBundler>} themesByName */
    themesByName = {};

    /**
     * This class bundles and watches CSS/LESS/SCSS themes.
     * @param {ThemesBundlerConfigType} config
     */
    constructor(config) {
        this.setConfig(config);
        this._initializeThemes();
    }

    /**
     * Sets the config for ThemeBundler.
     * @param {ThemesBundlerConfigType} config
     */
    setConfig(config = {}) {
        /** @type {ThemesBundlerConfigType} */
        this._config = Object.assign(this.getDefaultConfig(), config);
    }

    /**
     * Returns the default config for ThemeBundler.
     * @returns {ThemesBundlerConfigType}
     */
    getDefaultConfig() {
        return {
            themes: [],
            minify: false,
            patterns: [],
            exportPath: ''
        };
    }

    /**
     * Instantiates ThemeBundler for each theme defined in the config.
     */
    _initializeThemes() {
        /** @type {Promise<boolean>[]} */
        this.promises = [];
        this._initializeCommonTheme();
        const themes = this._config?.themes;
        if (Array.isArray(themes)) {
            themes.forEach(themeConfig => {
                if (themeConfig?.path && fs.existsSync(themeConfig?.path)) {
                    this._initializeThemeConfig(themeConfig);
                    const theme = new ThemeBundler(themeConfig);
                    this.promises?.push(theme.promise);
                    this.themesByName[theme.getName()] = theme;
                    this.themes.push(theme);
                } else {
                    console.log(`Theme path ${themeConfig.path} does not exist.`);
                }
            });
        }
        /** @type {Promise<boolean[]>} */
        this.promise = Promise.all(this.promises);
    }

    /**
     * Instantiates ThemeBundler for the common theme defined through commonThemeFile in the config.
     */
    _initializeCommonTheme() {
        const { patterns, commonThemePath } = this._config || {};
        if (commonThemePath && fs.existsSync(commonThemePath)) {
            this.commonTheme = new ThemeBundler({
                path: commonThemePath,
                patterns
            });
        }
    }

    /**
     * Initializes the configuration of each ThemeBundler defined in the config.
     * @param {ThemeBundlerConfigType} config
     */
    _initializeThemeConfig(config = {}) {
        config.patterns = this._config?.patterns ?? config.patterns;
        config.exportPath = this._config?.exportPath ?? config.exportPath;
        if (this.commonTheme) {
            const themeName = this.commonTheme.getName();
            const path = this.commonTheme.getPath();
            config.commonThemeFile = PATH.normalize(`${path}/${themeName}.bundled.css`);
        }
    }

    /**
     * Initializes the Themes Bundler.
     * @param {boolean | undefined} watch
     * @returns {Promise<boolean[]>}
     */
    async initialize(watch = WATCH) {
        await this.promise;
        this.cleanup();
        const rv = await this.bundle();
        watch && this.watch();
        return rv;
    }

    /**
     * Bundles all configured themes.
     * @returns {Promise<boolean[]>}
     */
    async bundle() {
        this.promises = [];
        if (this.commonTheme) {
            await this.commonTheme.bundle(this._config?.minify);
        }
        return this.bundleThemes();
    }

    /**
     * Bundles all themes except the common theme.
     * @returns {Promise<boolean[]>}
     */
    bundleThemes() {
        return Promise.all(this.themes.map(theme => theme.bundle(this._config?.minify)));
    }

    /**
     * Watches all configured themes for changes.
     */
    watch() {
        if (this.commonTheme) {
            this.commonTheme.watch(() => this.bundleThemes());
        }
        this.themes.forEach(theme => theme.watch());
    }

    /**
     * Cleans up all bundled theme files.
     */
    cleanup() {
        if (this.commonTheme) {
            this.commonTheme.cleanup();
        }
        this.themes.forEach(theme => theme.cleanup());
    }
}

export default ThemesBundler;
