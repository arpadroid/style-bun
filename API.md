<link rel="stylesheet" href="docs-styles.css">

# 📚 API Reference

> Comprehensive API documentation for Style Bun's theme bundling system.

## 🎨 ThemesBundler

The main class for bundling multiple themes.

### Constructor

```javascript
new ThemesBundler(config)
```

#### Configuration Parameters

<table class="api-table">
<thead>
<tr>
<th align="left">Property</th>
<th align="left">Type</th>
<th align="left">Default</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>themes</code></td>
<td><code>ThemeBundlerConfigType[]</code></td>
<td><code>[]</code></td>
</tr>
<tr>
<td colspan="3">Array of theme configurations. See <a href="#theme-configuration">Theme Configuration</a></td>
</tr>
<tr>
<td><code>patterns</code></td>
<td><code>string[]</code></td>
<td><code>[]</code></td>
</tr>
<tr>
<td colspan="3">Directory paths or glob patterns for finding external theme files</td>
</tr>
<tr>
<td><code>minify</code></td>
<td><code>boolean</code></td>
<td><code>false</code></td>
</tr>
<tr>
<td colspan="3">Whether to minify output for production</td>
</tr>
<tr>
<td><code>commonThemePath</code></td>
<td><code>string</code></td>
<td><code>undefined</code></td>
</tr>
<tr>
<td colspan="3">Path to common theme directory</td>
</tr>
<tr>
<td><code>watchPaths</code></td>
<td><code>string[]</code></td>
<td><code>[process.cwd()]</code></td>
</tr>
<tr>
<td colspan="3">Paths to monitor for changes</td>
</tr>
<tr>
<td><code>exportPath</code></td>
<td><code>string</code></td>
<td><code>undefined</code></td>
</tr>
<tr>
<td colspan="3">Custom export path for all themes</td>
</tr>
</tbody>
</table>

#### Example

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

<a name="theme-configuration"></a>
## ⚙️ Theme Configuration

Individual theme configuration object or JSON file.

### Configuration Options

<table class="api-table">
<thead>
<tr>
<th align="left">Property</th>
<th align="left">Type</th>
<th align="left">Default</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>path</code></td>
<td><code>string</code></td>
<td><code>undefined</code></td>
</tr>
<tr>
<td colspan="3">Absolute path to theme directory. Required when defining themes in ThemesBundler array.</td>
</tr>
<tr>
<td><code>includes</code></td>
<td><code>string[]</code></td>
<td><code>[]</code></td>
</tr>
<tr>
<td colspan="3">Stylesheet paths to include in compilation, relative to theme directory without file extensions.</td>
</tr>
<tr>
<td><code>extension</code></td>
<td><code>'css' | 'scss'</code></td>
<td><code>'css'</code></td>
</tr>
<tr>
<td colspan="3">File extension for theme stylesheets. SCSS requires <code>sass</code> package to be installed separately.</td>
</tr>
<tr>
<td><code>baseTheme</code></td>
<td><code>string</code></td>
<td><code>undefined</code></td>
</tr>
<tr>
<td colspan="3">Name of base theme to inherit from. Base theme contents are prepended to current theme output.</td>
</tr>
<tr>
<td><code>commonThemeFile</code></td>
<td><code>string</code></td>
<td><code>undefined</code></td>
</tr>
<tr>
<td colspan="3">Path to common stylesheet. Set internally by ThemesBundler when <code>commonThemePath</code> is specified.</td>
</tr>
<tr>
<td><code>configFile</code></td>
<td><code>string</code></td>
<td><code>[themePath]/[themeName].config.json</code></td>
</tr>
<tr>
<td colspan="3">Absolute path to theme config file. Auto-detected if not specified.</td>
</tr>
<tr>
<td><code>target</code></td>
<td><code>string</code></td>
<td><code>[themePath]/[themeName].bundled.css</code></td>
</tr>
<tr>
<td colspan="3">Output path for bundled CSS file (unminified, for development).</td>
</tr>
<tr>
<td><code>minifiedTarget</code></td>
<td><code>string</code></td>
<td><code>[themePath]/[themeName].min.css</code></td>
</tr>
<tr>
<td colspan="3">Output path for minified CSS file (for production).</td>
</tr>
<tr>
<td><code>patterns</code></td>
<td><code>string[]</code></td>
<td><code>[]</code></td>
</tr>
<tr>
<td colspan="3">Glob patterns passed from ThemesBundler config for finding external theme files.</td>
</tr>
<tr>
<td><code>verbose</code></td>
<td><code>boolean</code></td>
<td><code>false</code></td>
</tr>
<tr>
<td colspan="3">Enable detailed logging during compilation. Useful for debugging theme issues.</td>
</tr>
<tr>
<td><code>exportPath</code></td>
<td><code>string</code></td>
<td><code>undefined</code></td>
</tr>
<tr>
<td colspan="3">Custom export path for this theme's output files.</td>
</tr>
</tbody>
</table>

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

## 🔧 Error Handling

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

> **💡 Tip:** The sub-extension must match the theme name exactly.

## 📘 Type Definitions

Full TypeScript definitions are included in the package at `src/types.d.ts`.

```typescript
import { ThemesBundler } from '@arpadroid/style-bun';
import type { ThemeBundlerConfigType } from '@arpadroid/style-bun';
```

## 🚀 Advanced Usage

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
