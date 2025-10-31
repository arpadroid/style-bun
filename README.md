# Arpadroid Stylesheet Bundler

A powerful and flexible CSS/SCSS/LESS bundler designed for theme-based applications. Build multiple stylesheets from modular sources across your application with automatic compilation, minification, and live reload support.

## Features

🎨 **Multi-Theme Support** - Bundle multiple themes simultaneously (light/dark, mobile/desktop, etc.)  
📦 **Multiple Preprocessors** - CSS, SCSS, and LESS support with automatic compilation  
⚡ **Lightning Fast** - Built with LightningCSS for optimal performance  
🔄 **Live Reload** - Watch mode with instant browser updates (no state loss)  
🗜️ **Automatic Minification** - Production-ready minified outputs  
📁 **Modular Architecture** - Import stylesheets from anywhere in your project  
🌍 **Cross-Platform** - Works with any build system or framework  
🔧 **Zero Configuration** - Sensible defaults with full customization options

## Installation

```bash
npm install @arpadroid/stylesheet-bundler
```

## Quick Start

### 1. Create Theme Structure

```
src/
└── themes/
    ├── default/
    │   ├── default.config.json
    │   ├── vars/
    │   │   ├── colors.css
    │   │   └── typography.css
    │   └── components/
    │       └── buttons.css
    └── dark/
        ├── dark.config.json
        └── vars/
            └── colors.css
```

### 2. Configure Theme

```json
// src/themes/default/default.config.json
{
  "includes": [
    "vars/colors",
    "vars/typography", 
    "components/buttons"
  ]
}
```

### 3. Bundle Themes

```javascript
import { ThemesBundler } from '@arpadroid/stylesheet-bundler';

const bundler = new ThemesBundler({
  themes: [
    { path: './src/themes/default' },
    { path: './src/themes/dark' }
  ],
  minify: process.env.NODE_ENV === 'production'
});

await bundler.bundle();
```

## Usage

### Basic Theme Bundling

```javascript
import { ThemesBundler } from '@arpadroid/stylesheet-bundler';

const bundler = new ThemesBundler({
  themes: [
    { path: './src/themes/default' },
    { path: './src/themes/dark' }
  ],
  patterns: ['./src/components/**/*'],
  minify: true
});

// Bundle all themes
await bundler.bundle();

// Development mode with watch
if (process.env.NODE_ENV === 'development') {
  bundler.watch();
}
```

### Advanced Configuration

```javascript
const bundler = new ThemesBundler({
  themes: [
    { 
      path: './src/themes/default',
      extension: 'scss',
      target: './dist/themes/default.css',
      minifiedTarget: './dist/themes/default.min.css'
    },
    { 
      path: './src/themes/dark',
      extension: 'scss'
    }
  ],
  patterns: [
    './src/components/**/*',
    './src/layouts/**/*'
  ],
  commonThemePath: './src/themes/common',
  minify: true,
  exportPath: './dist/themes'
});
```

### Individual Theme Bundler

```javascript
import { ThemeBundler } from '@arpadroid/stylesheet-bundler';

const theme = new ThemeBundler({
  path: './src/themes/default',
  extension: 'scss',
  includes: [
    'vars/colors',
    'components/buttons',
    'layouts/grid'
  ]
});

await theme.bundle();
```

## Configuration

### ThemesBundler Configuration

| Option | Type | Description |
|--------|------|-------------|
| `themes` | `ThemeBundlerConfig[]` | Array of theme configurations |
| `patterns` | `string[]` | Glob patterns to find additional theme files |
| `minify` | `boolean` | Enable minification (default: false) |
| `commonThemePath` | `string` | Path to shared theme files |
| `exportPath` | `string` | Output directory for bundled themes |
| `watchPaths` | `string[]` | Additional paths to watch for changes |

### Theme Configuration

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | **Required** - Absolute path to theme directory |
| `includes` | `string[]` | Stylesheet paths relative to theme directory |
| `extension` | `'css' \| 'scss' \| 'less'` | File extension (default: 'css') |
| `target` | `string` | Custom output path for development build |
| `minifiedTarget` | `string` | Custom output path for minified build |
| `baseTheme` | `string` | Base theme to extend from |
| `verbose` | `boolean` | Enable detailed logging |

### Theme Config File

Each theme directory should contain a `[theme-name].config.json` file:

```json
{
  "includes": [
    "vars/colors",
    "vars/typography",
    "vars/layout",
    "components/buttons",
    "components/forms",
    "layouts/grid"
  ],
  "extension": "scss"
}
```

## File Naming Conventions

### External Theme Files

Theme-specific files in external directories should follow this pattern:
```
[filename].[theme-name].[extension]
```

Examples:
- `button.default.scss`
- `navigation.dark.css`
- `layout.mobile.scss`

### Output Files

The bundler generates these files in each theme directory:
- `[theme-name].bundled.css` - Development version
- `[theme-name].min.css` - Minified production version

## Development Workflow

### Watch Mode for Live Development

```javascript
import { ThemesBundler } from '@arpadroid/stylesheet-bundler';

const bundler = new ThemesBundler({
  themes: [
    { path: './src/themes/default' },
    { path: './src/themes/dark' }
  ]
});

// Initial bundle
await bundler.bundle();

// Watch for changes
bundler.watch();

// Clean up when done
bundler.cleanup();
```

### Integration with Build Tools

#### Webpack Integration

```javascript
// webpack.config.js
import { ThemesBundler } from '@arpadroid/stylesheet-bundler';

export default async () => {
  const bundler = new ThemesBundler({
    themes: [
      { path: './src/themes/default' },
      { path: './src/themes/dark' }
    ],
    minify: process.env.NODE_ENV === 'production'
  });

  await bundler.bundle();

  if (process.env.NODE_ENV === 'development') {
    bundler.watch();
  }

  return {
    // your webpack config
  };
};
```

#### Vite Integration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { ThemesBundler } from '@arpadroid/stylesheet-bundler';

export default defineConfig(async () => {
  const bundler = new ThemesBundler({
    themes: [
      { path: './src/themes/default' },
      { path: './src/themes/dark' }
    ]
  });

  await bundler.bundle();

  return {
    // your vite config
  };
});
```

## Live Reload Setup

For optimal development experience with instant CSS updates:

### 1. Install LiveReload Extension
- [Chrome Extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei)
- [Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/livereload-web-extension/)

### 2. Set Up File Watcher

```javascript
import { ThemesBundler } from '@arpadroid/stylesheet-bundler';

const bundler = new ThemesBundler({
  themes: [{ path: './src/themes/default' }]
});

await bundler.bundle();

// Enable watch mode for development
if (process.env.NODE_ENV === 'development') {
  bundler.watch();
}
```

### 3. Serve Your Application
Make sure your application runs on a local server (not file://) for LiveReload to work.

## Examples

### Multi-Theme E-commerce Site

```javascript
const bundler = new ThemesBundler({
  themes: [
    { path: './src/themes/customer', extension: 'scss' },
    { path: './src/themes/admin', extension: 'scss' },
    { path: './src/themes/mobile', extension: 'scss' }
  ],
  patterns: [
    './src/components/**/*',
    './src/pages/**/*'
  ],
  commonThemePath: './src/themes/common',
  minify: process.env.NODE_ENV === 'production'
});
```

### Component Library with Themes

```javascript
const bundler = new ThemesBundler({
  themes: [
    { path: './themes/material' },
    { path: './themes/corporate' },
    { path: './themes/minimal' }
  ],
  patterns: ['./src/components/**/*'],
  exportPath: './dist/themes'
});
```

## Why Use Arpadroid Stylesheet Bundler?

### 🎯 **Solves Real Problems**
- **CSS Architecture** - Organize styles by themes instead of complex selector hierarchies
- **Performance** - Eliminate @import statements that block rendering
- **Maintainability** - Modular stylesheet organization across your entire application
- **Developer Experience** - Instant live reload without losing application state

### ⚡ **Built for Performance**
- **LightningCSS** - Ultra-fast CSS processing and minification
- **Selective Loading** - Load only the theme styles you need
- **Production Optimization** - Automatic minification and compression

### 🔧 **Framework Agnostic**
Works with any setup:
- React, Vue, Angular applications
- Static site generators
- Node.js applications
- Webpack, Vite, Rollup, or custom build systems

## Migration from Old Versions

If migrating from older versions, update your imports:

```javascript
// Old (CommonJS)
const { ThemesBundler } = require('arpadroid-themes');

// New (ES Modules)
import { ThemesBundler } from '@arpadroid/stylesheet-bundler';
```

## API Reference

### ThemesBundler Methods

- `bundle()` - Bundle all configured themes
- `watch()` - Enable file watching for development
- `cleanup()` - Clean output directories
- `getTheme(name)` - Get specific theme bundler instance

### ThemeBundler Methods

- `bundle()` - Bundle individual theme
- `watch()` - Watch individual theme for changes
- `cleanup()` - Clean theme output directory

## Dependencies

- **LightningCSS** - Fast CSS processing and minification
- **Sass** - SCSS compilation support
- **Less** - LESS compilation support
- **Glob** - File pattern matching

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting pull requests.
