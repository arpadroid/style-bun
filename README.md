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
npm install @arpadroid/style-bun
```

## Development Setup

Clone and set up the project for development:

```bash
git clone https://github.com/arpadroid/style-bun.git
cd style-bun
npm install

# Run demo with live reload
npm run demo

# Bundle CSS in development mode
npm run bundle:dev

# Bundle CSS for production
npm run bundle:prod

# Run tests
npm test
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
import { ThemesBundler } from '@arpadroid/style-bun';

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
import { ThemesBundler } from '@arpadroid/style-bun';

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
    { path: './src/themes/default' },
    { path: './src/themes/dark' }
  ],
  patterns: [
    './src/components/**/*',
    './src/layouts/**/*'
  ],
  commonThemePath: './src/themes/common',
  minify: true
});
```

### Individual Theme Bundler

```javascript
import { ThemeBundler } from '@arpadroid/style-bun';

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
| `themes` | `ThemeConfig[]` | **Required** - Array of theme configurations |
| `patterns` | `string[]` | Glob patterns to find additional theme files |
| `minify` | `boolean` | Enable minification (default: false) |
| `commonThemePath` | `string` | Path to shared theme files |

### Theme Configuration

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | **Required** - Absolute path to theme directory |

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
- `[theme-name].bundled.css` - Bundled CSS (minified when `minify: true` option is used)

## Development Workflow

### Watch Mode for Live Development

```javascript
import { ThemesBundler } from '@arpadroid/style-bun';

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
import { ThemesBundler } from '@arpadroid/style-bun';

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
import { ThemesBundler } from '@arpadroid/style-bun';

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

## Live Development with Browser Sync

The project includes integrated browser sync for optimal development experience:

### Demo Development Server

```bash
# Start demo server with live reload
npm run demo
```

This will:
- Bundle your CSS automatically (`bundle:dev`)
- Start browser-sync server on port 8080
- Watch for changes in `demo/css/themes/**/*`
- Auto-refresh browser when CSS files change
- Open demo page at http://localhost:8080/demo.html

### Manual Setup for Your Project

```javascript
import { ThemesBundler } from '@arpadroid/style-bun';

const bundler = new ThemesBundler({
  themes: [{ path: './src/themes/default' }]
});

await bundler.bundle();

// Enable watch mode for development
if (process.env.NODE_ENV === 'development') {
  bundler.watch();
}
```

### Integration with Browser Sync

```bash
# Install browser-sync in your project
npm install --save-dev browser-sync

# Add to your package.json scripts
"start:demo": "browser-sync start --server [your-demo-dir] --files '[css-pattern]' --port 8080 --no-notify"
```

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

### 🔧 **Framework Agnostic & Modern**
Works with any setup:
- React, Vue, Angular applications
- Static site generators
- Node.js applications  
- ES Modules support (type: "module")
- Webpack, Vite, Rollup, or custom build systems
- Cross-platform file watching with Chokidar
- Integrated browser sync for development

## Available Scripts

The project includes several npm scripts for development and building:

```bash
# Development
npm run bundle:dev          # Bundle CSS for development
npm run demo                # Start demo with browser sync
npm run start:demo          # Start browser sync server only

# Production  
npm run bundle:prod         # Bundle and minify CSS for production

# Testing
npm test                    # Run Jest tests

# Maintenance
npm run clean               # Clean dist, node_modules, package-lock
npm run clean:build         # Clean and reinstall everything
```

## Migration from Old Versions

If migrating from older versions, update your imports:

```javascript
// Old (CommonJS)
const { ThemesBundler } = require('arpadroid-themes');

// New (ES Modules)
import { ThemesBundler } from '@arpadroid/style-bun';
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

### Core Dependencies
- **LightningCSS** - Ultra-fast CSS processing and minification
- **Chokidar** - Cross-platform file watching for live reload
- **Glob** - File pattern matching
- **Yargs** - Command line argument parsing

### Development Dependencies  
- **Browser Sync** - Live reload development server
- **Jest** - Testing framework
- **Babel Jest** - ES6+ transpilation for tests
- **jsdom** - DOM implementation for testing

Note: SCSS and LESS support is available but packages are dynamically imported only when needed to keep the bundle lightweight.

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting pull requests.
