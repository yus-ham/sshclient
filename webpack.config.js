const webpack = require('@nativescript/webpack');
const { spawnSync } = require('child_process');
const path = require('path');

module.exports = (env) => {
    webpack.init(env);

    // 1. Jalankan Bun Bundler
    const platform = env.android ? 'android' : 'ios';
    console.log(`\n[Bun-Wrapper] 🚀 Compiling Svelte 5 with Bun (MINIFY OFF)...`);
    spawnSync('bun', ['bun.build.ts'], {
        env: { ...process.env, NS_PLATFORM: platform },
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });

    webpack.chainWebpack(config => {
        config.resolve.alias.delete('svelte$');
        config.entry('bundle').clear().add('./app/bundle.js');
        
        // MATIKAN SEMUA OPTIMASI WEBPACK UNTUK DEBUGGING
        config.optimization.minimize(false);
    });

    return webpack.resolveConfig();
};