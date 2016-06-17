/*!
 * Transformers for jQuery v@VERSION
 * https://github.com/hex-ci/Transformers
 *
 * 为 jQuery 实现一套组件化开发模式与框架
 *
 * Copyright Hex and other contributors
 * Released under the MIT license
 *
 * Date: @DATE
 */

;(function(root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    }
    else if (typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['TF'] = factory();
    }
}(this, function() {

"use strict";

var TF, Transformers;

Transformers = TF = Transformers || {
    'version': '@VERSION',
    'build': '@BUILD'
};
