const webpack = require('@nativescript/webpack');
const { spawnSync } = require('child_process');
const path = require("path");



class BunBuildPlugin {
    constructor(platform) {
        this.platform = platform;
    }

    apply(compiler) {
        compiler.hooks.beforeCompile.tap('BunBuildPlugin', () => {
            console.log(`\n[Bun-Wrapper] 🚀 Compiling Svelte 5 with Bun...`);
            spawnSync('bun', ['bun.build.ts'], {
                env: { ...process.env, NS_PLATFORM: this.platform },
                stdio: 'inherit',
                cwd: compiler.context
            });
        });

        compiler.hooks.afterCompile.tap('BunBuildPlugin', (compilation) => {
            // Menambahkan folder 'deps' agar diawasi oleh webpack
            compilation.contextDependencies.add(path.resolve(compiler.context, 'deps'));
        });
    }
}

module.exports = (env) => {
    webpack.init(env);

    // 1. Jalankan Bun Bundler
    const platform = env.android ? 'android' : 'ios';
    // console.log(`\n[Bun-Wrapper] 🚀 Compiling Svelte 5 with Bun (MINIFY OFF)...`);
    // spawnSync('bun', ['bun.build.ts'], {
    //     env: { ...process.env, NS_PLATFORM: platform },
    //     stdio: 'inherit',
    //     cwd: __dirname
    // });

    webpack.chainWebpack(config => {
        config.plugin('BunBuildPlugin').use(new BunBuildPlugin(platform));

        config.plugins.delete('ForkTsCheckerWebpackPlugin');

        config.resolve.alias.delete('svelte$');
        config.entry('bundle').clear().add('./dist/bun-bundle.js');
        config.devtool(false);
        config.output.delete('sourceMapFilename');

        // Matikan Code Splitting agar tetap satu file bundle.js utuh
        config.optimization.splitChunks(false);
        // Pastikan runtime inline atau masuk ke bundle.js
        config.optimization.runtimeChunk(false);

        // Konfigurasi Watch
        config.watchOptions({
            ignored: ['**/node_modules/**', '**/dist/**', '**/deps/svelte/**']
        });
        
        config.optimization.minimize(false);

        // Optimasi CopyWebpackPlugin: Jangan salin source code ke APK
        config.plugin('CopyWebpackPlugin').tap(args => {
            args[0].patterns.forEach(pattern => {
                if (typeof pattern.from === 'string' && pattern.from.endsWith('app')) {
                    pattern.globOptions = pattern.globOptions || {};
                    pattern.globOptions.ignore = pattern.globOptions.ignore || [];
                    pattern.globOptions.ignore.push('**/*.svelte', '**/*.ts', '**/*.js', '**/*.map');
                }
            });
            return args;
        });
    });

    return webpack.resolveConfig();
};