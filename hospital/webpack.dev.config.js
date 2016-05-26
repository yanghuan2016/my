var path = require('path');
var webpack = require('webpack');
//var WebpackStrip = require('webpack-strip');
var node_modules = path.resolve(__dirname, 'node_modules');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');

var config = {
    entry: {
        app: [
            'webpack/hot/dev-server',
            'webpack-dev-server/client?http://127.0.0.1:4000',
            path.resolve(__dirname, './app.js')
        ],
        vendors: [
            'react',
            'react-router']
    },
    output: {
        path: path.resolve(__dirname, '../static/react'),
        filename: "js/bundle.min.js",
        //publicPath: "react",
        chunkFilename: "[id].chunk.js"
    },
    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                loaders: ['react-hot', 'babel-loader?compact=false&presets[]=react&presets[]=es2015'],
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader?localIdentName=[name]__[local]___[hash:base64:8]", "css-loader?localIdentName=[name]__[local]___[hash:base64:8]!autoprefixer?{browsers:['last 2 version', '> 1%']}")
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract("style-loader", 'css-loader!less-loader?{"modifyVars":{"primary-color":"#2baf2b"}}')
            },
            {
                test: /\.scss/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader!autoprefixer?{browsers:['last 2 version', '> 1%']}")
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: 'url-loader?limit=10000&name=images/[hash:base64:8].[ext]'
            },
            {
                test: /\.(woff|woff2|otf|eot|ttf|svg)(\?.*$|$)/,
                loader: 'url-loader?name=[name].[ext]'
            }
        ]
    },
    //别名，例如　：　require('elements/logo/component')//等价于public/js/elements/logo/component
    resolve: {
        alias: {
            basic: __dirname + '/components/basic',
            elements: __dirname + '/components/elements',
            service: __dirname + '/components/service',
            dispatcher: __dirname + '/dispatcher/dispatcher.js',
            constants: __dirname + '/constants/constants.js',
            base: __dirname,
            action: __dirname + '/action',
            stores: __dirname + '/stores',
            util: __dirname + '/util',
            plugin: __dirname + '/plugin',
            sass: __dirname + '/sass'
        },
        //后缀自动补全功能
        extensions: ['', '.js', '.jsx', '.json', '.css', '.scss', '.less', '.png', '.jpg']
    },
    //单独打包 css 到 style.css 样式文件里面 (* 异步加载的模块内用到的css不会独立 *)
    plugins: [
        new ExtractTextPlugin("css/[name].css"),
        new webpack.optimize.CommonsChunkPlugin('vendors', 'js/vendors.js'),
        new webpack.HotModuleReplacementPlugin(),
        // removes a lot of debugging code in React
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('development')
            }
        }),
        // keeps hashes consistent between compilations
        new webpack.optimize.OccurenceOrderPlugin(),
        // minifies your code
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        }),
        new HtmlWebpackPlugin({
            favicon: './favicon.ico',
            title: '神木',
            filename: 'index.html',
            template: './index.html',
            inject: true,
            hash: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true
            }
        }),
        new webpack.NoErrorsPlugin()
    ]
};

module.exports = config;