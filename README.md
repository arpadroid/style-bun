# README - **_`@arpadroid/style-bun`_**

![version](https://img.shields.io/badge/version-1.0.0-lightblue)
![node version](https://img.shields.io/badge/node-%3E%3D16.0.0-blue)
![npm version](https://img.shields.io/badge/npm-%3E%3D8.0.0-red)

> `@arpadroid/style-bun` is a powerful and flexible CSS/SCSS stylesheet bundler, designed for scalability, maintainability and developer experience. <br/> It supports big and small applications with CSS compilation, minification, and live reload.

**_Resources:_** &nbsp; [📝 Changelog](docs/CHANGELOG.md) | [📖 API](docs/API.md) | [🤝 Contributing](#contributing)

**_Quick Links:_** &nbsp; [🚀 Quick Start](#quick-start) | [📐 How It Works](#how-it-works) | [🎨 Theme Toggling](#theme-toggling) | [�️ Development Setup](#development-setup)

## ✨ Features

- 🎨 **Multi-Theme Support** - Bundle multiple themes simultaneously (light/dark, mobile/desktop) with easy toggling for optimal performance.
- 🔧 **Great DX** - Enhances developer experience, reduces cognitive load, improves maintainability and streamlines development,
- 📁 **Modular Architecture** - Import stylesheets from anywhere in your project with loose coupling and separation of concerns.
- ⚡ **Lightning Fast Performance** - Built with LightningCSS for optimal speed and reduced browser load.
- 🪶 **Ultra-Lightweight & Zero Config** - Minimal dependencies and works out-of-the-box with sensible defaults.
- 📦 **CSS & SCSS Support** - CSS works out-of-the-box. Optional SCSS support with automatic compilation and minification for production-ready outputs.
- 🌍 **Framework Agnostic** - Works seamlessly with any web application without framework dependencies.

<div id="quick-start"></div>

## 🚀 Quick Start

### Installation

```bash
npm install @arpadroid/style-bun --save-dev
# Optional for SCSS Support
npm install sass --save-dev
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
        { path: `${basePath}/default` },
        { path: `${basePath}/mobile` },
        { path: `${basePath}/desktop` },
        { path: `${basePath}/dark` }
    ],
    patterns: [cwd + '/components', cwd + '/pages'],
    minify: mode === 'production',
    commonThemePath: basePath + '/common'
});

// Wait until the bundler is ready.
bundler.promise.then(async () => {
    // Clean-up the output directory before compiling.
    await bundler.cleanup();
    // Bundle all themes.
    await bundler.bundle();
    // Watch all files for changes.
    mode === 'development' && bundler.watch();
});
```

### Configuration

See the [API Reference](docs/API.md) for full details on configuration options available in `ThemesBundler` and individual theme configs.

<div id="how-it-works"></div>

## 📐 How it Works

**💡 Key Concept:** Each theme produces a **single optimized CSS file** by merging stylesheets from two sources.

### 🎯 The Two-Source Approach

Style Bun collects and merges stylesheets from two locations to create one unified CSS file per theme:

- **1. Theme Directory Files (via `includes` array)**

    Define explicit files in your theme's config to control **compilation order** and create the foundation:

    **Example: `themes/dark/dark.config.json`**

    ```json
    {
        "includes": [
            "vars/colors", // ← Compiled FIRST
            "vars/typography", // ← Then this
            "components/buttons" // ← Then this
        ]
    }
    ```

    **Result:** Variables load before components that use them. No CSS import HTTP requests! 🚀

- **2. Pattern-Matched Files (via `patterns` array)**
  Automatically discover component-specific theme files across your project:

    **File Structure:**

    ```
    components/
    ├── 🧩 button/
    │   ├── button.js
    │   ├── button.default.css  ← Found by pattern matching!
    │   └── button.dark.css     ← Found by pattern matching!
    └── 🧩 card/
        ├── card.js
        ├── card.default.css    ← Found by pattern matching!
        └── card.dark.css       ← Found by pattern matching!
    ```

    **Bundler Config:**

    ```javascript
    const bundler = new ThemesBundler({
        themes: [{ path: './themes/default' }, { path: './themes/dark' }],
        patterns: ['./components'] // ← Scans for *.default.css and *.dark.css
    });
    ```

### 🔄 The Merge Process

```
┌─────────────────────────────────────────┐
│  DARK THEME BUNDLING                    │
├─────────────────────────────────────────┤
│                                         │
│  📁 Theme Directory (includes):         │
│    ✓ vars/colors.css                    │
│    ✓ vars/typography.css                │
│    ✓ components/buttons.css             │
│                                         │
│  ➕ MERGED WITH                         │
│                                         │
│  🔍 Pattern-Matched Files:              │
│    ✓ components/button/button.dark.css  │
│    ✓ components/card/card.dark.css      │
│    ✓ pages/home/home.dark.css           │
│                                         │
│  ⬇                                      │
│                                         │
│  📦 Single Output File:                 │
│    → themes/dark/dark.bundled.css       │
│                                         │
└─────────────────────────────────────────┘
```

### ✨ Why This Matters

- **⚡ Zero HTTP Requests** - No `@import` statements means faster page loads
- **🎯 Controlled Order** - Use `includes` to ensure variables/mixins load first
- **🧩 Component Isolation** - Styles live next to components, not in theme folders
- **📦 Single File Output** - Each theme = one CSS file = optimal performance

### 🏭 Production vs Development Output

Style Bun creates different output files depending on your build mode:

#### Development Mode (`minify: false`)

```javascript
const bundler = new ThemesBundler({
    themes: [{ path: './themes/dark' }],
    minify: false // or omit (defaults to false)
});
```

**Output:**

```
✅ themes/dark/dark.bundled.css  ← Unminified, readable, with source formatting
```

#### Production Mode (`minify: true`)

```javascript
const bundler = new ThemesBundler({
    themes: [{ path: './themes/dark' }],
    minify: true // Enable minification
});
```

**Output:**

```
✅ themes/dark/dark.bundled.css  ← Unminified (for debugging)
✅ themes/dark/dark.min.css      ← Minified (use this in production!)
```

> **📦 Production Tip:** Always use the `.min.css` file in production for optimal performance and smaller bundle sizes.

**HTML Example:**

```html
<!-- Development -->
<link rel="stylesheet" href="themes/dark/dark.bundled.css" />

<!-- Production -->
<link rel="stylesheet" href="themes/dark/dark.min.css" />
```

<div id="theme-toggling"></div>

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

<div id="development-setup"></div>
## �️ Development Setup

If you've cloned this project from GitHub:

```bash
git clone https://github.com/arpadroid/style-bun.git
cd style-bun
npm install

# Run the demo server with live reload:
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

## Contributing

This project has specific architectural goals. If you'd like to contribute:

1. **[Open an issue](https://github.com/arpadroid/style-bun/issues/new)** describing your proposal
2. Wait for maintainer feedback before coding
3. PRs without prior discussion may be closed

**[Bug reports](https://github.com/arpadroid/style-bun/issues/new)** are always welcome!

## License

MIT License - see LICENSE file for details.
