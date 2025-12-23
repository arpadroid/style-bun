# 📚 API Reference - **_`@arpadroid/style-bun`_**

> Comprehensive API documentation for Style Bun's theme bundling system.

**_Links:_** [🗜️ ThemesBundler Class](#themesbundler-class) | [🎨 ThemeBundler Class](#theme-bundler-class) 

<div id="themesbundler-class"></div>

## 🗜️ ThemesBundler Class

The `ThemesBundler` class is in charge of orchestrating the bundling of multiple themes.

```typescript
import { ThemesBundler, ThemesBundlerConfigType } from '@arpadroid/style-bun';

const MODE = process.env.NODE_ENV || 'development';

/**
 * You can integrate a similar script into your build process.
 */
export function bundleThemes() {
    // Define bundler configuration
    const config: ThemesBundlerConfigType = {
        themes: [{ path: './themes/default' }, { path: './themes/dark' }],
        patterns: ['{cwd}/components', '{cwd}/pages'],
        minify: process.env.NODE_ENV === 'production'
    };

    const bundler = new ThemesBundler(config);
    // wait for initialization
    await bundler.promise;
    // clean previous builds
    await bundler.cleanup();
    // bundle themes
    await bundler.bundle();
    // optionally watch for changes
    if (MODE === 'development') {
        bundler.watch();
    }
}
```

### ⚙️ Configuration

`type`: `ThemesBundlerConfigType`

- `themes`: `ThemeBundlerConfigType[]`  
   Array of theme configurations. See [Theme Configuration](#theme-configuration)

- `patterns`: `string[]`  
   Directory paths or glob patterns for finding external theme files

- `minify`: `boolean`  
   Whether to minify output for production

- `commonThemePath`: `string`  
   Path to common theme directory

- `watchPaths`: `string[]`  
   Paths to monitor for changes

- `exportPath`: `string`  
   Custom export path for all themes

### 🏷️ Properties

- `promise`: `Promise<void>`  
   A Promise that resolves when the bundler is initialized and ready to use.

    ```javascript
    await bundler.promise;
    console.log('Bundler ready!');
    ```

<br/>

### 🛠️ Methods

- `bundle()`: `Promise<void>`  
   Bundles all configured themes into their respective output files.

    ```javascript
    await bundler.bundle();
    // All themes are now bundled
    ```

- `cleanup()`: `void`  
   Removes all generated output files from theme directories.

    ```javascript
    bundler.cleanup();
    // All .bundled.css and .min.css files removed
    ```

- `watch()`: `void`  
   Starts watching files for changes and automatically rebuilds affected themes.

    ```javascript
    bundler.watch();
    // Now watching for file changes...
    ```

<br/>

<div id="theme-bundler-class"></div>

## 🎨 Theme Bundler Class

> The `ThemeBundler` class handles the bundling of a single theme.

```typescript
import { ThemeBundler, ThemeBundlerConfigType } from '@arpadroid/style-bun';

const themeConfig: ThemeBundlerConfigType = {
    path: './themes/dark',
    includes: ['vars/colors', 'vars/typography', 'components/buttons'],
    extension: 'css',
    baseTheme: 'default'
};

const themeBundler = new ThemeBundler(themeConfig);
themeBundler.bundle().then(() => {
    console.log('Theme bundled successfully!');
});
```

<div id="theme-configuration"></div>

### ⚙️ Configuration

`type`: `ThemeBundlerConfigType`

> Individual theme configuration object or JSON file.

- `path`: `string`  
   Absolute path to theme directory. Required when defining themes in ThemesBundler array.

- `includes`: `string[]`  
   Stylesheet paths to include in compilation, relative to theme directory without file extensions.

- `extension`: `'css' | 'scss'`  
   File extension for theme stylesheets. SCSS requires `sass` package to be installed separately.

- `baseTheme`: `string`  
   Name of base theme to inherit from. Base theme contents are prepended to current theme output.

- `commonThemeFile`: `string`  
   Path to common stylesheet. Set internally by ThemesBundler when `commonThemePath` is specified.

- `configFile`: `string`  
   Absolute path to theme config file. Auto-detected if not specified.

- `target`: `string`  
   Output path for bundled CSS file (unminified, for development).

- `minifiedTarget`: `string`  
   Output path for minified CSS file (for production).

- `patterns`: `string[]`  
   Glob patterns passed from ThemesBundler config for finding external theme files.

- `verbose`: `boolean`  
   Enable detailed logging during compilation. Useful for debugging theme issues.

- `exportPath`: `string`  
   Custom export path for this theme's output files.

### 🏷️ Properties

- `promise`: `Promise<boolean>`  
   Resolves when the theme bundler is initialized and ready.
- `themeName`: `string`  
   The name of the theme being bundled.
- `path`: `string`  
   The absolute path to the theme directory.
- `extension`: `'css' | 'scss'`  
   The file extension for theme stylesheets.
- `baseTheme`: `ThemeBundler | undefined`  
   The base theme instance, if set.
- `fileConfig`: `object`  
   The configuration loaded from the theme's config file.

### 🛠️ Methods

- `constructor(config: ThemeBundlerConfigType)`  
   Creates a new ThemeBundler instance with the given configuration.
- `bundle(minify?: boolean): Promise<boolean>`  
   Bundles the theme into a stylesheet. If `minify` is true, also creates a minified output.
- `cleanup(): void`  
   Removes generated bundled and minified files for the theme.
- `watch(callback?, bundle = true, minify = false): Promise<void>`  
   Watches theme files for changes and re-bundles automatically.
- `getFiles(): string[]`  
   Returns all files included in the theme bundle (includes, patterns, and common theme file).
- `getIncludes(): string[]`  
   Returns the stylesheet includes defined in the theme config.
- `getPatternFiles(): string[]`  
   Returns all files matching the patterns defined in the theme config.
- `getTargetFile(): string`  
   Returns the path to the unminified output file.
- `getMinifiedTargetFile(): string`  
   Returns the path to the minified output file.
- `setBaseTheme(baseTheme: string): void`  
   Sets the base theme for inheritance.

### Example Configuration File

**themes/dark/dark.config.json:**

```json
{
    "includes": ["vars/colors", "vars/typography", "components/buttons"],
    "extension": "css",
    "baseTheme": "default",
    "verbose": false
}
```
