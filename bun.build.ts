import { build as bunBuild, type BunPlugin } from "bun";
import sveltePlugin from "bun-plugin-svelte";
import fs from "node:fs";
import path from "node:path";

const platform = process.env.NS_PLATFORM || "android";
const isProd = process.env.NODE_ENV === "production";
const outDir = `./app`;

console.log(`🚀 Bun Bundler for NativeScript (${platform})`);

const nsResolver: BunPlugin = {
  name: "ns-resolver",
  setup(builder) {
    // FORCE SVELTE TO BROWSER VERSION
    builder.onResolve({ filter: /^svelte(\/.*)?$/ }, (args) => {
        if (args.path === 'svelte') {
            return { path: path.resolve(process.cwd(), 'node_modules/svelte/src/index-client.js') };
        }
        if (args.path === 'svelte/internal') {
            return { path: path.resolve(process.cwd(), 'node_modules/svelte/src/internal/client/index.js') };
        }
        return null;
    });

    // Handle css-tree browser overrides
    builder.onResolve({ filter: /css-tree/ }, (args) => {
        if (args.path.includes('lib/version.js')) return { path: path.resolve(process.cwd(), 'node_modules/css-tree/dist/version.js') };
        if (args.path.includes('lib/data.js')) return { path: path.resolve(process.cwd(), 'node_modules/css-tree/dist/data.js') };
        if (args.path.includes('lib/data-patch.js')) return { path: path.resolve(process.cwd(), 'node_modules/css-tree/dist/data-patch.js') };
        return null;
    });

    builder.onResolve({ filter: /.*/ }, (args) => {
      let target = args.path;

      if (target === "module" || target === "node:module") {
        return { path: path.resolve(process.cwd(), "deps/mock-module.js") };
      }

      if (target.startsWith("~/")) {
        const relative = target.slice(2);
        const appPath = path.resolve(process.cwd(), "app", relative);
        target = fs.existsSync(appPath) || fs.existsSync(appPath + '.ts') || fs.existsSync(appPath + '.js') 
                 ? appPath 
                 : path.resolve(process.cwd(), relative);
      }

      let baseDir = args.importer ? path.dirname(args.importer) : process.cwd();
      let absoluteBase = "";

      if (target.startsWith(".") || path.isAbsolute(target)) {
        absoluteBase = path.resolve(baseDir, target);
      } else {
        if (target.startsWith("@nativescript/core")) {
            absoluteBase = path.resolve(process.cwd(), "node_modules", target);
        } else {
            try {
                absoluteBase = Bun.resolveSync(target, baseDir);
            } catch(e) {
                return null;
            }
        }
      }

      const ext = path.extname(absoluteBase);
      const isStandardExt = [".ts", ".js", ".svelte", ".json"].includes(ext);
      const basePath = isStandardExt ? absoluteBase.slice(0, -ext.length) : absoluteBase;

      const candidates = [
        basePath + `.${platform}${ext || '.ts'}`,
        basePath + `.${platform}${ext || '.js'}`,
        basePath + `.${platform}.js`,
        basePath + (ext || '.ts'),
        basePath + (ext || '.js'),
        basePath + '.js',
        basePath + '.ts',
        basePath + '.svelte',
        basePath + '.json',
        path.join(absoluteBase, `index.${platform}.ts`),
        path.join(absoluteBase, `index.${platform}.js`),
        path.join(absoluteBase, `index.ts`),
        path.join(absoluteBase, `index.js`),
        absoluteBase
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
          return { path: candidate };
        }
      }

      return null;
    });
  },
};

const result = await bunBuild({
  entrypoints: ["./app/app.ts"],
  outdir: outDir,
  naming: "bundle.[ext]",
  plugins: [nsResolver, sveltePlugin],
  target: "browser",
  minify: false, 
  define: {
    "global.__ANDROID__": platform === "android" ? "true" : "false",
    "global.__IOS__": platform === "ios" ? "true" : "false",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
});

if (result.success) {
  console.log("✅ Bun build successful!");
} else {
  console.error("❌ Bun build failed:");
  result.logs.forEach(log => console.error(log));
  process.exit(1);
}