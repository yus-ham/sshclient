# Svelte Native + Bun Experiment 🚀

This project is an experimental proof-of-concept demonstrating how to use **Bun** as the primary bundler and runtime for **Svelte Native** (Svelte 5) applications, significantly speeding up the development feedback loop.

## 🎯 The Goal

To replace the heavy lifting of Webpack for JavaScript/TypeScript/Svelte compilation with Bun, while keeping the necessary NativeScript infrastructure intact.

## 🛠️ Architecture: "The Hybrid Approach"

NativeScript relies heavily on Webpack for platform-specific build steps (AndroidManifest, asset copying, native bindings). Instead of rewriting the entire toolchain, we use a hybrid approach:

1.  **Bun (The Engine):**
    *   Compiles `app/**/*.ts` and `app/**/*.svelte` (Svelte 5) into a single optimized `dist/bun-bundle.js`.
    *   Handles Svelte 5 compilation (custom DOM adapter for NativeScript).
    *   Provides a blazing fast HMR (Hot Module Replacement) server for web preview.
    *   Resolves dependencies with a custom plugin to prioritize local patched versions of `svelte` and `svelte-native`.

2.  **Webpack (The Glue):**
    *   Wraps the pre-bundled `dist/bun-bundle.js` into the final NativeScript package.
    *   Handles native platform tasks (Android/iOS builds).
    *   Running in "dumb mode" (minification disabled, sourcemaps off) to act purely as a carrier for the Bun output.

## ⚡ Key Features & Fixes

*   **Svelte 5 Support:** Patched `svelte-native` DOM adapter to work with Svelte 5's new reactivity system and event delegation mechanism.
*   **Custom DOM Shim:** Implements a lightweight DOM shim to satisfy Svelte's runtime requirements in the NativeScript environment (e.g., `parentNode`, `addEventListener` mapping).
*   **Web Preview:** Run the app directly in a browser (via Bun) for rapid UI iteration, mocking NativeScript modules like `ApplicationSettings` and `Utils`.
*   **Fast Build:** Leverages Bun's speed for the transpilation phase.

## 🚀 How to Run

### Prerequisites
*   [Bun](https://bun.sh)
*   NativeScript environment setup (Android SDK / Xcode)

### Development

**1. Android (Device/Emulator)**
```bash
bun run android
```
This runs the custom `compile.config.js` pipeline which triggers Bun build + NativeScript run.

**2. Web Preview (Browser)**
```bash
bun run dev
```
Opens a web server at `http://localhost:3000` to preview the UI logic without an emulator.

## 📂 Project Structure

*   `bun.build.ts`: The Bun build configuration.
*   `webpack.config.js`: The "thin" Webpack wrapper that consumes Bun's output.
*   `deps/`: Patched versions of `svelte`, `svelte-native`, and mocks.
*   `app/`: Source code (Svelte 5 + TS).

---
*Built with ❤️ using Bun + Svelte Native*
