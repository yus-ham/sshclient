import { type BunPlugin } from "bun";
import fs from "node:fs";
import path from "node:path";

// NativeScript Webpack Transformer for @NativeClass support
const nativeClassTransformer = require("@nativescript/webpack/dist/transformers/NativeClass").default;


export const nsNativePlugin = (platform: string): BunPlugin => ({
  name: "ns-native-plugin",
  setup(builder) {
    // 2. NATIVESCRIPT RESOLVER: Handle platform specific extensions (.android.ts, .ios.ts) & Aliases
    builder.onResolve({ filter: /.*/ }, (args) => {
      let target = args.path;
      const baseDir = args.importer ? path.dirname(args.importer) : process.cwd();

      // Handle ~/ alias
      if (target.startsWith("~/")) {
        const relative = target.slice(2);
        const appPath = path.resolve(process.cwd(), "app", relative);
        // Check if mapped path exists directly or with extensions
        target = fs.existsSync(appPath) || fs.existsSync(appPath + '.ts') || fs.existsSync(appPath + '.js') ? appPath : path.resolve(process.cwd(), relative);
      }

      // Resolve absolute base path
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
        return null; // Let Bun handle other modules
      }

      const ext = path.extname(absoluteBase);
      const isKnownExt = [".ts", ".js", ".svelte", ".json", ".css"].includes(ext);
      const basePath = isKnownExt ? absoluteBase.slice(0, -ext.length) : absoluteBase;
      const targetExt = isKnownExt ? ext : ".js";

      // Priority list for file resolution
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

    builder.onResolve({ filter: /^module$/ }, () => {
      return { path: 'module', namespace: 'mock' };
    });

    builder.onLoad({ filter: /^module$/, namespace: 'mock' }, () => {
      return {
        loader: 'js',
        contents: `
          export function createRequire() {
            const empty = { syntax: "@empty { }", descriptors: {} }
            return (id) => ({
              properties: empty,
              syntaxes: empty,
              atrules: empty,
              types: empty,
              units: empty,
            })
          }
        `
      }
    })

    /*
    // 3. TRANSFORMER: Apply @NativeClass transformation
    builder.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
        const isCore = args.path.includes("@nativescript/core");
        // Exclude node_modules from transformation unless it's @nativescript/core
        if (args.path.includes("node_modules") && !isCore) return null;

        const source = await fs.promises.readFile(args.path, "utf8");
        // Skip files without NativeClass or extend
        if (!isCore && !source.includes("@NativeClass") && !source.includes("extend(") && !args.path.endsWith(".ts")) {
            return null;
        }

        const result = ts.transpileModule(source, {
            compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, experimentalDecorators: true, emitDecoratorMetadata: true },
            transformers: { before: [nativeClassTransformer] }
        });

        return { contents: result.outputText, loader: args.path.endsWith(".ts") ? "ts" : "js" };
    });
    */
  },
});
