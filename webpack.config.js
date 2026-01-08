const webpack = require('@nativescript/webpack');
const { spawnSync } = require('child_process');
const path = require('path');

module.exports = (env) => {
    webpack.init(env);

    // 1. Jalankan Bun Bundler untuk memproses Svelte 5 & App Logic
    const platform = env.android ? 'android' : 'ios';
    console.log(`
[Bun-Wrapper] 🚀 Compiling Svelte 5 with Bun...`);
    spawnSync('bun', ['bun.build.ts'], {
        env: { ...process.env, NS_PLATFORM: platform },
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });

    webpack.chainWebpack(config => {
        // Hapus alias svelte$ bawaan yang bermasalah (Svelte 4 style)
        config.resolve.alias.delete('svelte$');

        // GANTI Entry 'bundle' dengan hasil build dari Bun
        // Ini memastikan logic Svelte 5 yang sudah dibundel Bun masuk ke NS
        config.entry('bundle').clear().add('./app/bundle.js');
        
        // Tetap biarkan Webpack menangani 'runtime' dan 'vendor' 
        // agar jembatan NativeScript Android (JavaProxy) tidak rusak.
    });

    return webpack.resolveConfig();
};
