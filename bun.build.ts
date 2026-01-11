import { build as bunBuild } from "bun";
import { SveltePlugin } from "bun-plugin-svelte";
import { nsNativePlugin } from "./deps/bun-plugin-ns-native";

const platform = process.env.NS_PLATFORM || "android";
const isProd = process.env.NODE_ENV === "production";
const outDir = `./dist`;

console.log(`🚀 NativeScript-Bun-Hybrid Engine (${platform})`);

const result = await bunBuild({
  entrypoints: ["./app/app.ts"],
  outdir: outDir,
  naming: "bun-bundle.[ext]",
  plugins: [
    nsNativePlugin(platform),
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