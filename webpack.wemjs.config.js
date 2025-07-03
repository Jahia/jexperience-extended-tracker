'use strict';
const packageJson = require('./package.json');
let versionSplitted = packageJson.version.split('.');
const path = require('path');
let pkgVersion = versionSplitted.join('_');

const {CycloneDxWebpackPlugin} = require('@cyclonedx/webpack-plugin');
const webpack = require('webpack');

/** @type {import('@cyclonedx/webpack-plugin').CycloneDxWebpackPluginOptions} */
const cycloneDxWebpackPluginOptions = {
    specVersion: '1.4',
    rootComponentType: 'library',
    outputLocation: './bom-wemjs'
};

module.exports = (env, argv) => {
    let config = {

        entry: {wemjs: path.resolve(__dirname, './src/main/resources/javascript/jexperience/live-mode/wem.js')},
        output: {
            // Absolute output directory
            path: path.resolve(__dirname, './src/main/resources/javascript/jexperience/dist/' + pkgVersion),
            filename: 'wem.min.js',
            chunkFilename: 'wem.min.[name].js'
        },
        resolve: {
            fallback: {
                buffer: require.resolve('buffer/')
            }
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            // Reference: https://github.com/babel/babel-loader
                            // Transpile .js files using babel-loader
                            // Compiles ES6 and ES7 into ES5 code
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', {
                                        modules: false,
                                        targets: {chrome: '60', edge: '44', firefox: '54', safari: '12'}
                                    }]
                                ],
                                plugins: [
                                    '@babel/plugin-syntax-dynamic-import',
                                    '@babel/plugin-transform-for-of'
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new CycloneDxWebpackPlugin(cycloneDxWebpackPluginOptions),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer']
            })
        ],
        mode: 'development'
    };

    if (argv.mode !== 'production') {
        config.devtool = 'eval-source-map';
    }

    return config;
};
