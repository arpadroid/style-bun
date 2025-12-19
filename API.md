# API Reference

## ThemesBundler

The main class for bundling multiple themes.

### Constructor

```javascript
new ThemesBundler(config)
```

**Parameters:**

- `config` (Object) - Configuration object with the following properties:
  - `themes` (Array) - Array of theme configurations. See [Theme Configuration](#theme-configuration)
  - `patterns` (Array) - Optional. Directory paths or glob patterns for finding external theme files
  - `minify` (Boolean) - Optional. Whether to minify output. Default: `false`
  - `commonThemePath` (String) - Optional. Path to common theme directory
  - `watchPaths` (Array) - Optional. Paths to monitor for changes. Default: `[process.cwd()]`
  - `exportPath` (String) - Optional. Custom export path for all themes

**Returns:** ThemesBundler instance

**Example:**

```javascript
import { ThemesBundler } from '@arpadroid/style-bun';

const bundler = new ThemesBundler({
    themes: [
        { path: './themes/default' },
        { path: './themes/dark' }
    ],
    patterns: ['./components', './pages'],
    minify: process.env.NODE_ENV === 'production'
});
```

### Properties

#### `promise`

A Promise that resolves when the bundler is initialized and ready to use.

**Type:** `Promise<void>`

**Example:**

```javascript
await bundler.promise;
console.log('Bundler ready!');
```

### Methods

#### `bundle()`

Bundles all configured themes into their respective output files.

**Returns:** `Promise<void>`

**Example:**

```javascript
await bundler.bundle();
// All themes are now bundled
```

#### `cleanup()`

Removes all generated output files from theme directories.

**Returns:** `void`

**Example:**

```javascript
bundler.cleanup();
// All .bundled.css and .min.css files removed
```

#### `watch()`

Starts watching files for changes and automatically rebuilds affected themes.

**Returns:** `void`

**Example:**

```javascript
bundler.watch();
// Now watching for file changes...
```

---

## Theme Configuration

Individual theme configuration object or JSON file.

### Properties

| Property          | Type                  | Default                               | Description                                                                                      |
| ----------------- | --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `path`            | `string`              | Required                              | Absolute path to theme directory                                                                 |
| `includes`        | `string[]`            | `[]`                                  | Stylesheet paths to include, relative to theme directory without extensions                      |
| `extension`       | `'css' \| 'scss'`     | `'css'`                               | File extension for theme stylesheets                                                             |
| `baseTheme`       | `string`              | `undefined`                           | Name of base theme to inherit from                                                               |
| `commonThemeFile` | `string`              | `undefined`                           | Path to common stylesheet (set internally)                                                       |
| `configFile`      | `string`              | `[themePath]/[themeName].config.json` | Path to theme config file                                                                        |
| `target`          | `string`              | `[themePath]/[themeName].bundled.css` | Output path for bundled CSS                                                                      |
| `minifiedTarget`  | `string`              | `[themePath]/[themeName].min.css`     | Output path for minified CSS                                                                     |
| `patterns`        | `string[]`            | `[]`                                  | Glob patterns for finding external theme files                                                   |
| `verbose`         | `boolean`             | `false`                               | Enable detailed logging                                                                          |
| `exportPath`      | `string`              | `undefined`                           | Custom export path for this theme                                                                |

### Example Configuration File

**themes/dark/dark.config.json:**

```json
{
  "includes": [
    "vars/colors",
    "vars/typography",
    "components/buttons"
  ],
  "extension": "css",
  "baseTheme": "default",
  "verbose": false
}
```

---

## Error Handling

### Common Errors

#### SCSS Compilation Errors

If you encounter SCSS compilation errors, ensure the `sass` package is installed:

```bash
npm install sass
```

#### File Not Found

If theme files are not found, enable verbose logging:

```javascript
const bundler = new ThemesBundler({
    themes: [
        { 
            path: './themes/dark',
            verbose: true  // Enable detailed logging
        }
    ]
});
```

#### Pattern Matching Issues

Ensure pattern-matched files follow the naming convention:

```
✅ button.dark.css       # Correct
❌ button-dark.css       # Wrong
❌ dark.button.css       # Wrong
```

The sub-extension must match the theme name exactly.

---

## Type Definitions

Full TypeScript definitions are included in the package at `src/types.d.ts`.

```typescript
import { ThemesBundler } from '@arpadroid/style-bun';
import type { ThemeBundlerConfigType } from '@arpadroid/style-bun';
```

---

## Advanced Usage

### Programmatic Theme Loading

```javascript
// Load theme based on user preference
const theme = localStorage.getItem('theme') || 'default';
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = `/themes/${theme}/${theme}.min.css`;
document.head.appendChild(link);
```

### Dynamic Theme Switching

```javascript
function switchTheme(themeName) {
    const links = document.querySelectorAll('link[data-theme]');
    links.forEach(link => {
        link.disabled = link.dataset.theme !== themeName;
    });
}
```

### Conditional Build

```javascript
const bundler = new ThemesBundler({
    themes: process.env.THEMES 
        ? process.env.THEMES.split(',').map(name => ({ path: `./themes/${name}` }))
        : [{ path: './themes/default' }],
    minify: process.env.NODE_ENV === 'production'
});
```

### Build Script Integration

```javascript
// build.js
import { ThemesBundler } from '@arpadroid/style-bun';

async function build() {
    const bundler = new ThemesBundler({
        themes: [
            { path: './themes/default' },
            { path: './themes/dark' }
        ],
        patterns: ['./src/components'],
        minify: true
    });

    await bundler.promise;
    
    console.log('Cleaning old builds...');
    bundler.cleanup();
    
    console.log('Building themes...');
    await bundler.bundle();
    
    console.log('Build complete!');
}

build().catch(console.error);
```
