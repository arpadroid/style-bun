# Changelog - **_`@arpadroid/style-bun`_**

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-18

### 🎉 Initial Stable Release

First production-ready release of Style Bun - a powerful stylesheet bundler for multi-theme applications.

### ✨ Features

- **Multi-Theme Bundling** - Bundle multiple themes (light/dark, mobile/desktop) simultaneously
- **CSS & SCSS Support** - Native CSS support with optional SCSS preprocessing via Sass
- **Pattern Matching** - Auto-discover theme files across components using sub-extension naming (e.g., `button.dark.css`)
- **Include Arrays** - Control compilation order with explicit file includes in theme configs
- **Single File Output** - Each theme compiles to one optimized CSS file
- **Production Minification** - Automatic minified `.min.css` generation when `minify: true`
- **Live Reload** - Watch mode with automatic recompilation on file changes
- **Lightning Fast** - Built on LightningCSS for optimal performance
- **Base Theme Inheritance** - Themes can extend other themes
- **Common Theme Support** - Share variables and mixins across all themes
- **Framework Agnostic** - Works with any web framework or vanilla JavaScript
- **Zero Config** - Sensible defaults with optional fine-tuning
- **TypeScript Support** - Full type definitions included

### 🏗️ Core Architecture

- Theme files collected from two sources:
  - Theme directory files (via `includes` array) for controlled compilation order
  - Pattern-matched component files (via `patterns` array) for modular architecture
- All files merge into single CSS output per theme (no HTTP requests for imports)
- Configurable export paths and custom output locations

### 📦 Dependencies

- `lightningcss` - Ultra-fast CSS processing and minification
- `chokidar` - Cross-platform file watching
- `glob` - File pattern matching
- `yargs` - Command line argument parsing
- `sass` (optional peer dependency) - SCSS preprocessing

### 🎯 API Stability

This 1.0.0 release marks API stability. Future changes will follow semantic versioning:
- Patch releases (1.0.x) - Bug fixes only
- Minor releases (1.x.0) - New features, backward compatible
- Major releases (x.0.0) - Breaking changes