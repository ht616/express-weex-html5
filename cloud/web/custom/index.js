'use strict';
var constant = require('../../const');
var models = require('../../models');
var AV = require('leanengine');

//主页
function getIndex(req, res, next) {
    console.log(1)
    res.render('index');
}

//scroll
function getScrollIndex(req,res,next){
    res.render('scroll');
}

//weex
function getWeexIndex(req,res,next){
    res.render('weex/weexTest');
}

var index = {};

index.getIndex = getIndex;
index.getScrollIndex = getScrollIndex;
index.getWeexIndex = getWeexIndex;

module.exports = index;
