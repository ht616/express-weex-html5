// var webpack = require('webpack');
// var path = require('path');
//
// var publicPath = 'http://localhost:3000/';
// var hotMiddlewareScript = 'webpack-hot-middleware/client?reload=true';
//
// var devConfig = {
//     entry: {
//         page1: ['./public/js/test1.js', hotMiddlewareScript],
//         page2: ['./public/js/test2.js', hotMiddlewareScript]
//     },
//     output: {
//         filename: './[name]/bundle.js',
//         path: path.resolve('./public'),
//         publicPath: publicPath
//     },
//     devtool: 'source-map',
//     module: {
//         loaders: [{
//             test: /\.(png|jpg)$/,
//             loader: 'url?limit=8192&context=client&name=[path][name].[ext]'
//         }, {
//             test: /\.scss$/,
//             loader: 'style!css?sourceMap!resolve-url!sass?sourceMap'
//         }]
//     },
//     plugins: [
//         new webpack.optimize.OccurenceOrderPlugin(),
//         new webpack.HotModuleReplacementPlugin(),
//         new webpack.NoErrorsPlugin()
//     ]
// };
//
// module.exports = devConfig;
/*
功能：打包文件，提取公共部分，并生成带js\css引用的html页面

打包前的文件，静态资源放在public/src下，html在views下
打包后统一放在public/dist里

使用的node模块：path、glob
使用的webpack插件：commonsPlugin   ExtractTextPlugin   HtmlWebpackPlugin

网上有说开启webpack观察者模式会导致内存占用过高，可以用gulp调用webpack的方式解决
但是貌似这个项目并没有这种问题~
 */

require('weex-loader')
/**************************引入webpack***********************************/
var webpack = require('webpack');


/**************************引入node模块path、glob*******************************/
var path = require('path');
//该模块用于返回匹配指定模式的文件名或目录，
//由于本项目为多页面，因此需要多个入口文件和多个html
//需要这个模块获取文件放入数组，需要时循环
var glob = require('glob');


/****************************设置默认路径*******************************/
/*
设置默认路径distPath，在module.exports中的output的path处使用
所有打包出的文件，路径都在这个基础上继续
写在这里是因为比较突出。。直接写在output的path当然也是可以的
 */
var distPath = path.join(__dirname, '/public/dist/');


/*****************************声明getEntry函数**************************/
/*
该函数使用glob的方法，拆分文件路径
目前有两个地方使用了这个方法：
1. 循环view文件夹，生成多个html打包的conf配置；
2. 循环js入口文件
由于module.exprots中的entry项是个对象，因此这里把entry设为{}
参数url为传进来的需要获取的文件目录的路径
最后返回的entry的格式：
{
  login : './public/src/js/Entry/user/login.js',
  register : './public/src/js/Entry/user/register.js'
  *******
}
在自己的实际项目中，按实际情况可以有其他处理方式~
 */
var getEntry = function(url) {
    var entry = {};
    glob.sync(url).forEach(function(name) {
        /*
        循环所有文件，对文件名做处理，并放入entry数组中，返回entry
         */
        if (name.indexOf('views') != -1) {
            //是html页面
            var n = name.substring(8, name.lastIndexOf('.'));
        } else {
            //不是html页面  这里实际上只有js页面需要处理
            var n = name.substring((name.lastIndexOf('/') + 1), name.lastIndexOf('.'));
        }
        var name = __dirname + name.substring(1);
        if (n.indexOf('.') != 0) {
            entry[n] = name;
        }
    });
    return entry;
};


/******************************使用webpack的插件********************************/
/*
    commonsPlugin，把公共部分提取出来
 */
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin({
    // 提取出的公共模块的名称，js会打包为common.js，css为common.css
    // common.js会按照module.exports中output的路径打包，
    // common.css会按照ExtractTextPlugin插件设置的路径打包
    //如果按照网上的例子直接写为common.js,
    //会导致提取出来的公共css被打包成css/js/common.js/css
    name: 'common',
    //chunks----从哪些文件中提取
    //目前这里不需要设置，因为所有js文件都需要被提取
    //chunks: getEntry('./public/src/js/Entry/*/**.js')

});
/*
    ExtractTextPlugin，打出单独的css包
*/
var ExtractTextPlugin = require("extract-text-webpack-plugin");
/*
    HtmlWebpackPlugin，打包html
*/
var HtmlWebpackPlugin = require('html-webpack-plugin');



/***********************设置module.exports中的plugins***************************/
/*
    定义一个数组，module.exports中的plugins项可以直接使用这个数组
 */
var plugins = [];
/*
    添加打包公共文件插件的调用
 */
//plugins.push(commonsPlugin);
/*
    调用ExtractTextPlugin，把单独的css打到dist/css/下面，该路径也是从distPath开始
    [name]为引用这个css文件的js文件的入口文件打包后的名字，即入口文件output后的名字
 */
plugins.push(new ExtractTextPlugin("css/[name].css"));
/*
    加载jq，否则项目中使用jquery会报错'$ is not defined',
    用jquery('#**')这样的方式使用jquery当然也是不行滴~
 */
plugins.push(new webpack.ProvidePlugin({
    $: 'jquery'
}));



/**********************获取所有html文件，生成HtmlWebpackPlugin插件需要的conf配置**************************/
/*
调用getEntry,传递路径为打包前的html文件
 */
var pages = getEntry('./views/*/**');
/*循环pages*/
for (var chunkname in pages) {
    /*
        这里使用webpack的HtmlWebpackPlugin插件
        conf为该插件的配置项
        将每个文件的conf循环插入plugins，可以实现多页面打包
    */
    var conf = {
            filename: 'html/' + chunkname + '.html', //打包后的html存放路径，也是从distPath开始
            template: pages[chunkname], //文件模板，就是打包前的html文件
            inject: true, //可以对head和body做修改
            //设置该页面引用的文件，只有符合条件的才会被引用
            //这里是'common'和页面同名的js\css文件
            // chunks: ['jquery', 'react', 'react-dom', 'common', chunkname.substring(chunkname.indexOf('/') + 1)],
            minify: { //压缩HTML
                removeComments: true,
                collapseWhitespace: false
            },
            hash: true, //版本号，打出来的html中对css和js的引用自带版本号
        }
        //把每个conf循环插入plugins
    plugins.push(new HtmlWebpackPlugin(conf));
}


/****************************添加对js和css的压缩*************************/
//plugins.push(new webpack.optimize.UglifyJsPlugin({
//    compress: {
//        warnings: false
//    },
//    except: ['$', 'require'] //排除关键字，不然会把这些都压缩替换
//}))



/**********************module.exports的entry配置*******************************/

//获取所有入口文件
// var entryJS = getEntry('./public/src/js/Entry/*/**.js');
var entryJS = getEntry('./public/src/**');
/*
把react\react-dom-jquery单独打包，如果不写的话，会把这些都打到common.js里
可以解决common.js体积过大的问题~
*/
// entryJS['react'] = ['react'];
// entryJS['react-dom'] = ['react-dom'];
// entryJS['jquery'] = ['jquery'];



/****************************webpack的总体配置******************************/
module.exports = {
    //入口文件，这里循环所有入口文件，不需要每个都写出来
    entry: './public/src/weex/test.we',
    output: {
        //打包文件存放的绝对路径，html、css、js都会按这个路径打包
        path: distPath,
        //网站运行时的访问路径，不设置的话，打包出的html中的默认引用的路径会是相对路径
        publicPath: "/public/dist/",
        //打包后的文件名
        filename: 'js/[name].js'
    },
    resolve: {
        //require文件的时候不需要写后缀了，可以自动补全
        extensions: ['', '.js', '.jsx', '.css']
    },
    module: {
        loaders: [ //定义一系列加载器
            {
                test: /\.html$/,
                loader: "html"
            }, /*es6 to es5*/
            //{
            //    test: /\.js[x]?$/,
            //    exclude: /node_modules/,
            //    loader: "babel-loader",
            //    query: {
            //        presets: [ 'es2015', 'stage-3']
            //    }
            //
            //},
            {
                test: /\.js(\?[^?]+)?$/,
                loaders: ['weex-loader?type=script']
            },
            /*jsx to js,es5 to es6*/ {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            }, /*css to css*/ {
                test: /\.(jpg|png)$/,
                loader: "url?limit=8192"
            }, //limit=8192表示图片大小单位是k  小于这个值走内联大于这个值走外联             /*images 打包*/
            {
                test: /\.less$/,
                loader: "style!css!less"
            }, /*less to css*/
            {test: /\.ejs$/, loader: 'ejs-compiled?htmlmin'},
            {
                test: /\.we(\?[^?]+)?$/,
                loader: 'weex-loader'
            }
        ]
    },
    plugins: plugins, //使用插件
    //watch: true //开启观察者模式
};
