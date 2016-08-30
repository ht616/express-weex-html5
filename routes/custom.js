const router = require('express').Router();

var index = require('../cloud/web/custom/index');



// 网站首页
router.get('/', index.getIndex);
router.get('/index', index.getIndex);

//测试滑动检测
router.get('/scroll', index.getScrollIndex);

//weextest
router.get('/weex',index.getWeexIndex);

module.exports = router;
