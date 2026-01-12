import { plugin } from "bun";
import fs from "fs";
import path from "path";

const nsResolver = {
  name: "nativescript-resolver",
  setup(build) {
    // Filter spesifik untuk modul yang butuh di-mock atau di-redirect
    // Hindari '@nativescript-community' agar svelte-native tetap jalan
    build.onResolve({ filter: /^(@nativescript\/core|~|module|node:|css-tree)/ }, async (args) => {
      let targetPath = args.path;

      // 0. Handle Node.js built-ins
      if (targetPath === 'module' || targetPath === 'node:module') {
         return { path: path.resolve(import.meta.dirname, 'ns-web-shims.js') };
      }

      // Handle css-tree browser overrides
      if (targetPath.includes('css-tree')) {
          if (targetPath.includes('lib/version.js')) return { path: path.resolve(process.cwd(), 'node_modules/css-tree/dist/version.js') };
          if (targetPath.includes('lib/data.js')) return { path: path.resolve(process.cwd(), 'node_modules/css-tree/dist/data.js') };
          if (targetPath.includes('lib/data-patch.js')) return { path: path.resolve(process.cwd(), 'node_modules/css-tree/dist/data-patch.js') };
      }

      // 1. Handle alias ~/
      if (targetPath.startsWith('~/')) {
        return { path: path.resolve(process.cwd(), targetPath.replace('~/', '')) };
      } 
      
      // 2. Mock @nativescript/core (dan subpath-nya)
      if (targetPath.startsWith('@nativescript/core')) {
        return { path: path.resolve(import.meta.dirname, 'ns-web-shims.js') };
      } 
      
      return null;
    });

    build.onResolve({ filter: /^\.\/reconciler\.js$/ }, () => {
      return { path: path.resolve(import.meta.dirname, 'patch-svelte-client-dom-reconciler.js') }
    })
  },
};

export default nsResolver;
