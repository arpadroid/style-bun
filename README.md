# @arpadroid/style-bun

Style Bun is a powerful and flexible stylesheet bundler. Designed with scalability and developer experience in mind, it supports theme-based applications with automatic compilation, minification, and live reload.

## ✨ Key Features

- 🎨 **Multi-Theme Support** - Bundle multiple themes simultaneously (light/dark, mobile/desktop) with easy toggling for optimal performance.
- 🔧 **Amazing Developer Experience** - Reduces complexity and cognitive load when working with large, theme-based applications. Enhances DX with live reload and no loss of state.
- 📁 **Modular Architecture** - Import stylesheets from anywhere in your project with loose coupling and separation of concerns.
- ⚡ **Lightning Fast Performance** - Built with LightningCSS for optimal speed and reduced browser load.
- 🪶 **Ultra-Lightweight & Zero Config** - Minimal dependencies and works out-of-the-box with sensible defaults.
- 📦 **CSS & SCSS Support** - CSS works out-of-the-box. Optional SCSS support with automatic compilation and minification for production-ready outputs.
- 🌍 **Framework Agnostic** - Works seamlessly with any web application without framework dependencies.

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0

### Installation

```bash
npm install @arpadroid/style-bun
```

#### Optional SCSS Support

If you plan to use SCSS files, install the sass preprocessor:

```bash
npm install sass
```

### Basic Usage

Within your build script (e.g., `build.js`), set up the Themes Bundler as follows:

```javascript
// Import dependencies.
import { ThemesBundler } from '@arpadroid/style-bun';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Parse command line arguments.
const argv = yargs(hideBin(process.argv)).argv;
const cwd = process.cwd();

const mode = argv.mode || 'development';
const basePath = cwd + '/themes';

// Instantiate bundler.
const bundler = new ThemesBundler({
    themes: [
        {
            path: `${basePath}/default`
            // You can also specify other configuration overrides here,
            // as defined in the Individual Theme Configuration section below.
        },
        { path: `${basePath}/mobile` },
        { path: `${basePath}/desktop` },
        { path: `${basePath}/dark` }
    ],
    // Patterns are file patterns or directories to scan for theme stylesheets.
    // These stylesheets must have a sub-extension matching the theme name.
    // e.g. "button.dark.css"
    patterns: [cwd + '/components', cwd + '/pages'],
    minify: mode === 'production',
    commonThemePath: basePath + '/common'
});

// Wait until the bundler is ready.
bundler.promise.then(async () => {
    // Clean-up the output directory before compiling.
    bundler.cleanup();
    // Bundle all themes.
    await bundler.bundle();
    // Watch all files for changes.
    mode === 'development' && bundler.watch();
});
```

## Configuration Options

### ThemesBundler Configuration

Configuration options for the main `ThemesBundler` instance:

| Property          | Type                       | Default           | Description                                                                                                                                      |
| ----------------- | -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `themes`          | `ThemeBundlerConfigType[]` | `[]`              | Array of theme configurations. Each theme only requires a `path` property pointing to the theme directory.                                       |
| `patterns`        | `string[]`                 | `[]`              | Directory paths or glob patterns for finding theme files in external directories. Files must follow `[filename].[themeName].[extension]` naming. |
| `minify`          | `boolean`                  | `false`           | Whether bundled themes should be minified. Set to `true` for production builds.                                                                  |
| `commonThemePath` | `string`                   | `undefined`       | Path to a common theme used as base for all themes. Useful for SCSS mixins required during compilation.                                     |
| `watchPaths`      | `string[]`                 | `[process.cwd()]` | Paths to monitor for changes in external theme files. Defaults to current working directory if not specified.                                    |
| `exportPath`      | `string`                   | `undefined`       | Custom export path for bundled themes.                                                                                                           |

### Individual Theme Configuration

Configuration options for individual theme config files (e.g., `default.config.json`).
These options can be overridden when defining themes in the `ThemesBundler` array.

| Property          | Type                        | Default                               | Description                                                                                      |
| ----------------- | --------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `path`            | `string`                    | `undefined`                           | Absolute path to theme directory. Required when defining themes in ThemesBundler array.          |
| `includes`        | `string[]`                  | `[]`                                  | Stylesheet paths to include in compilation, relative to theme directory without file extensions. |
| `extension`       | `'css' \| 'scss'` | `'css'`                               | File extension for theme stylesheets. SCSS requires `sass` package to be installed separately. |
| `baseTheme`       | `string`                    | `undefined`                           | Name of base theme to inherit from. Base theme contents are prepended to current theme output.   |
| `commonThemeFile` | `string`                    | `undefined`                           | Path to common stylesheet. Set internally by ThemesBundler when `commonThemePath` is specified.  |
| `configFile`      | `string`                    | `[themePath]/[themeName].config.json` | Absolute path to theme config file. Auto-detected if not specified.                              |
| `target`          | `string`                    | `[themePath]/[themeName].bundled.css` | Output path for bundled CSS file (unminified, for development).                                  |
| `minifiedTarget`  | `string`                    | `[themePath]/[themeName].min.css`     | Output path for minified CSS file (for production).                                              |
| `patterns`        | `string[]`                  | `[]`                                  | Glob patterns passed from ThemesBundler config for finding external theme files.                 |
| `verbose`         | `boolean`                   | `false`                               | Enable detailed logging during compilation. Useful for debugging theme issues.                   |
| `exportPath`      | `string`                    | `undefined`                           | Custom export path for this theme's output files.                                                |

## 🎨 Theme Toggling

### 🔘 Interactive Theme Switching

Toggle between light and dark themes by enabling/disabling stylesheets with JavaScript:

```html
<link id="dark-theme" disabled rel="stylesheet" href="themes/dark/dark.bundled.css" />
```

Simply toggle the `disabled` attribute to switch themes:

```javascript
// Toggle dark theme
const darkTheme = document.getElementById('dark-theme');
darkTheme.disabled = !darkTheme.disabled;
```

### 📱 Responsive Theme Loading

Use CSS media queries to automatically load different themes based on screen size:

```html
<link
    id="mobile-theme"
    rel="stylesheet"
    media="screen and (max-width: 700px)"
    href="themes/mobile/mobile.bundled.css"
/>

<link
    id="desktop-theme"
    rel="stylesheet"
    media="screen and (min-width: 701px)"
    href="themes/desktop/desktop.bundled.css"
/>
```

Resize your browser window to see the difference!

## 🛠️ Development Setup

If you've cloned this project from GitHub:

```bash
git clone https://github.com/arpadroid/style-bun.git
cd style-bun
npm install

# Run demo with live reload
npm run demo

# Or run individual commands:
npm run bundle:dev  # Bundle CSS in development mode
npm start           # Start the demo server
```

## 📦 Dependencies

### Core Dependencies

- **[LightningCSS](https://lightningcss.dev/)** - Ultra-fast CSS processing and minification
- **[Chokidar](https://github.com/paulmillr/chokidar)** - Cross-platform file watching for live reload
- **[Glob](https://github.com/isaacs/node-glob)** - File pattern matching
- **[Yargs](https://yargs.js.org/)** - Command line argument parsing

### Optional Dependencies

- **[SASS](https://sass-lang.com/)** - SCSS preprocessing and compilation (install separately if needed)

### Development Dependencies

- **[Browser Sync](https://browsersync.io/)** - Live reload development server
- **[Jest](https://jestjs.io/)** - Testing framework
- **[Babel Jest](https://babeljs.io/docs/babel-jest)** - ES6+ transpilation for tests
- **[ESLint](https://eslint.org/)** - Code linting and formatting

## License

MIT License - see LICENSE file for details.
