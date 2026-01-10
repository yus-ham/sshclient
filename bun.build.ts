import { build as bunBuild, type BunPlugin } from "bun";
import { SveltePlugin } from "bun-plugin-svelte";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const nativeClassTransformer = require("@nativescript/webpack/dist/transformers/NativeClass").default;

const platform = process.env.NS_PLATFORM || "android";
const isProd = process.env.NODE_ENV === "production";
const outDir = `./dist`;

console.log(`🚀 NativeScript-Bun-Hybrid Engine (${platform})`);

const nsBunPlugin: BunPlugin = {
  name: "ns-bun-plugin",
  setup(builder) {
    // 1. SVELTE: Force Client Version (Strong Alias)
    builder.onResolve({ filter: /^svelte(\/.*)?$/ }, (args) => {
        const svelteDir = path.resolve(process.cwd(), 'deps/svelte/src');
        if (args.path === 'svelte') return { path: path.join(svelteDir, 'index-client.js') };
        if (args.path === 'svelte/internal') return { path: path.join(svelteDir, 'internal/client/index.js') };
        
        // Handle deep sub-module imports (e.g., svelte/motion)
        const subPath = args.path.replace(/^svelte\//, '');
        const candidate = path.join(svelteDir, subPath + '.js');
        if (fs.existsSync(candidate)) return { path: candidate };
        
        return null;
    });

    // Jalankan juga untuk path yang sudah terlanjur di-resolve ke node_modules oleh Bun
    builder.onResolve({ filter: /node_modules\/svelte/ }, (args) => {
        const subPath = args.path.split('node_modules/svelte/')[1];
        if (!subPath) return null;
        return { path: path.resolve(process.cwd(), 'deps/svelte', subPath) };
    });

    // 2. MOCKS: Redirect problematic data & Node.js modules
    builder.onResolve({ filter: /^(module|node:module|mdn-data.*|.*patch\.json|.*css-tree.*data.*)$/ }, () => {
        return { path: path.resolve(process.cwd(), "deps/mock-module.js") };
    });

    // 3. NATIVESCRIPT RESOLVER
    builder.onResolve({ filter: /.*/ }, (args) => {
      let target = args.path;
      const baseDir = args.importer ? path.dirname(args.importer) : process.cwd();

      if (target.startsWith("~/")) {
        const relative = target.slice(2);
        const appPath = path.resolve(process.cwd(), "app", relative);
        target = fs.existsSync(appPath) || fs.existsSync(appPath + '.ts') || fs.existsSync(appPath + '.js') ? appPath : path.resolve(process.cwd(), relative);
      }

      let absoluteBase = "";
      if (target.startsWith(".") || path.isAbsolute(target)) {
        absoluteBase = path.resolve(baseDir, target);
      } else if (target === "@nativescript-community/svelte-native") {
        absoluteBase = path.resolve(process.cwd(), "deps/svelte-native");
      } else if (target.startsWith("@nativescript-community/svelte-native/")) {
        const subPath = target.replace("@nativescript-community/svelte-native/", "");
        absoluteBase = path.resolve(process.cwd(), "deps/svelte-native", subPath);
      } else if (target.startsWith("@nativescript")) {
        absoluteBase = path.resolve(process.cwd(), "node_modules", target);
      } else {
        return null; 
      }

      const ext = path.extname(absoluteBase);
      const isKnownExt = [".ts", ".js", ".svelte", ".json", ".css"].includes(ext);
      const basePath = isKnownExt ? absoluteBase.slice(0, -ext.length) : absoluteBase;
      const targetExt = isKnownExt ? ext : ".js";

      const candidates = [
        basePath + `.${platform}${targetExt}`,
        basePath + `.${platform}.js`,
        basePath + targetExt,
        basePath + ".js",
        path.join(absoluteBase, `index.${platform}.js`),
        path.join(absoluteBase, `index.js`),
        absoluteBase
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) return { path: candidate };
      }
      return null;
    });

    // 4. TRANSFORMER
    builder.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
        const isCore = args.path.includes("@nativescript/core");
        // Exclude node_modules AND deps/svelte from transformation
        if ((args.path.includes("node_modules") || args.path.includes("deps/svelte")) && !isCore) return null;

        const source = await fs.promises.readFile(args.path, "utf8");
        if (!isCore && !source.includes("@NativeClass") && !source.includes("extend(") && !args.path.endsWith(".ts")) {
            return null;
        }

        const result = ts.transpileModule(source, {
            compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, experimentalDecorators: true, emitDecoratorMetadata: true },
            transformers: { before: [nativeClassTransformer] }
        });

        return { contents: result.outputText, loader: args.path.endsWith(".ts") ? "ts" : "js" };
    });
  },
};

const result = await bunBuild({
  entrypoints: ["./app/app.ts"],
  outdir: outDir,
  naming: "bun-bundle.[ext]",
  plugins: [
    nsBunPlugin, 
    SveltePlugin({
        compilerOptions: {
            // DONT DELETE: IN UPGRADE PROGRES TO SVELTE 5
            // 'foreign' not supported in s5...
            namespace: 'html',
            discloseVersion: false
        }
    })
  ],
  target: "browser",
  minify: false,
  splitting: false,
  sourcemap: false,
  define: {
    "global.__ANDROID__": platform === "android" ? "true" : "false",
    "global.__IOS__": platform === "ios" ? "true" : "false",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
});

if (result.success) console.log("✅ Bun Hybrid build successful!");
else {
    result.logs.forEach(l => console.error(l));
    process.exit(1);
}