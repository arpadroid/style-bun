import { ThemeBundlerConfigType } from '../themeBundler/themeBundler.types.js';

/**
 * Options and configuration for the ThemesBundler.
 */
export interface ThemesBundlerConfigType {
    /**
     * @property {ThemeBundlerConfigType[]} themes - An array of ThemeBundlerConfigType configurations to define your themes.
     * Check the implementation in demo/bundle.js.
     * It is only required to define a path property for each of them.
     * E.g. themes: [{ path: '/../src/themes/default' }, { path: '/../src/themes/dark' }]
     */
    themes?: ThemeBundlerConfigType[];

    /**
     * @property {string[]} patterns - A set of absolute glob file patterns to be used when looking for theme files in other directories.
     * Note these external files need to be named as follows to be recognized as theme files:
     * [filename].[themeName].[extension]  e.g. 'my-stylesheet.default.css, my-stylesheet.dark.css'.
     * Check the implementation in demo/bundle.js.
     * Those patterns are used to find the theme files in external directories.
     * They will pick up any files in any subdirectories as well so you are free to structure your code as you please.
     */
    patterns?: string[];

    /**
     * @property {boolean} minify - Indicates whether the bundled themes should be minified. Default is false.
     */
    minify?: boolean;

    /**
     * @property {string} commonThemePath - A path to a common theme that will be used as a base for all defined themes.
     * It can be useful when you have scss mixins that are required as part of the compilation process of other themes.
     * If set the script will:
     *  1. Look for a theme config file in the specified directory
     *  2. If found, it will bundle the theme.
     *  3. When compiling every other theme, it will prepend the common theme in each theme file.
     */
    commonThemePath?: string;

    /**
     * @property {string} watchPaths - Paths to be monitored for changes in external theme files, if not specified the script will use the working directory by default.
     */
    watchPaths?: string[];
    exportPath?: string;
}

export type WriteStylesReturnType = {
    result?: any;
    styles?: string;
    targetFile?: string;
    message?: string;
};

export type StyleUpdateCallbackType = (file: string, event: string) => void;
