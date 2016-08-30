'use strict';
require("babel-core/register");
var domain = require('domain');
var path = require('path');
var express = require('express');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var connect = require('connect');
var bodyParser = require('body-parser');
var cloud = require('./cloud');
var AV = require('leanengine');
var multiparty = require('multiparty');
var busboy = require('connect-busboy');
var hook = require('./cloud/common/hook');
var routeCustom = require('./routes/custom');

var app = express();

// App 全局配置
app.set('views', path.join(__dirname, "views")); // 设置模板目录
//var ejs = require('ejs');
//app.engine('.html', ejs.__express);
app.set('view engine', 'ejs'); // 设置 template 引擎
app.use(AV.express());
app.use(cloud);


app.use(express.static('public')); // 设置静态文件目录

app.use(busboy());

// parse application/json
app.use(bodyParser.json({}));
app.use(cookieParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '100mb'
}));
// 启用 cookieParser
//app.use(express.cookieParser('Your Cookie Secure'));
app.use(AV.Cloud.CookieSession({
    secret: 'my secret',
    maxAge: 3600000,
    fetchUser: true
}));

// 使用 cookieSession 记录自定义信息到 cookie
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}))

// app.use(hook);

//web路由
app.use('/', routeCustom);

//app 本地处理函数
app.locals.Format = function(date, fmt) {
    var fmt = fmt || "yyyy-MM-dd hh:mm:ss";
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() +
        "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (
            RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(
            ("" + o[k]).length)));
    return fmt;
}

// 如果任何路由都没匹配到，则认为 404
// 生成一个异常让后面的 err handler 捕获
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) { // jshint ignore:line
    var statusCode = err.status || 500;
    if (statusCode === 500) {
        console.error(err.stack || err);
    }
    if (req.timedout) {
        console.error(
            '请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。',
            req.originalUrl, err.timeout);
    }
    console.error("errorCode:" + statusCode + " requestUrl:" + req.originalUrl);
    // 默认不输出异常详情
    var error = {}
    if (app.get('env') === 'development') {
        // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
        error = err;
    }
    res.send(err)
});

module.exports = app;
app.listen();
