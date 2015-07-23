/*!
 * Transformers for jQuery v1.3.1
 * https://github.com/CodeIgniter/Transformers
 *
 * 为 jQuery 实现一套组件化开发模式与框架
 *
 * Copyright Hex and other contributors
 * Released under the MIT license
 *
 * Date: 2015-07-23
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
    'version': '1.3.1',
    'build': '20150312'
};


var proxy = $.proxy;
var extend = $.extend;

// ===================================

// 定义一些辅助函数

/**
 * 将源对象的属性并入到目标对象
 * @method mix
 * @static
 * @param {Object} des 目标对象
 * @param {Object} src 源对象
 * @param {boolean} override (Optional) 是否覆盖已有属性。如果为function则初为混合器，为src的每一个key执行 des[key] = override(des[key], src[key], key);
 * @returns {Object} des
 */
var mix = function(des, src, override) {
    var i;

    if (typeof override == 'function') {
        for (i in src) {
            des[i] = override(des[i], src[i], i);
        }
    }
    else {
        for (i in src) {
            //这里要加一个des[i]，是因为要照顾一些不可枚举的属性
            if (override || !(des[i] || (i in des))) {
                des[i] = src[i];
            }
        }
    }

    return des;
};

/**
 * 获得一个命名空间
 * @method namespace
 * @static
 * @param { String } sSpace 命名空间符符串。如果命名空间不存在，则自动创建。
 * @param { Object } root (Optional) 命名空间的起点。当没传root时：默认为window。
 * @return {any} 返回命名空间对应的对象
 */
var namespace = function(sSpace, root) {
    var arr = sSpace.split('.'),
        i = 0,
        nameI;
    root = root || window;
    for (; nameI = arr[i++];) {
        if (!root[nameI]) {
            root[nameI] = {};
        }
        root = root[nameI];
    }
    return root;
};

/**
 * eval某字符串，这个字符串是一个js表达式，并返回表达式运行的结果
 * @method evalExp
 * @static
 * @param {String} s 字符串
 * @param {any} opts eval时需要的参数。
 * @return {any} 根据字符结果进行返回。
 */
var evalExp = function(s, opts) {
    /*jslint evil: true */
    return new Function("opts", "return (" + s + ");")(opts);
};

/**
 * 将字符串首字母大写
 */
var capitalize = function(s){
    return s.slice(0,1).toUpperCase() + s.slice(1);
};

/**
 * 反驼峰化字符串。将“abCd”转化为“ab-cd”。
 * @method decamelize
 * @static
 * @param {String} s 字符串
 * @return {String} 返回转化后的字符串
 */
var decamelize = function(s) {
    return s.replace(/[A-Z]/g, function(a) {
        return "-" + a.toLowerCase();
    });
};

/**
 * unserialize
 *
 * Takes a string in format "param1=value1&param2=value2" and returns an object { param1: 'value1', param2: 'value2' }. If the "param1" ends with "[]" the param is treated as an array.
 *
 * Example:
 *
 * Input:  param1=value1&param2=value2
 * Return: { param1 : value1, param2: value2 }
 *
 * Input:  param1[]=value1&param1[]=value2
 * Return: { param1: [ value1, value2 ] }
 *
 * @todo Support params like "param1[name]=value1" (should return { param1: { name: value1 } })
 * Usage example: console.log($.unserialize("one="+escape("& = ?")+"&two="+escape("value1")+"&two="+escape("value2")+"&three[]="+escape("value1")+"&three[]="+escape("value2")));
 */
var unserialize = function(serializedString) {
    if (!serializedString) {
        return {};
    }

    var str = decodeURI(serializedString);
    var pairs = str.replace(/\+/g, ' ').split('&');
    var obj = {}, p, idx;

    for (var i = 0, n = pairs.length; i < n; i++) {
        p = pairs[i].split('=');
        idx = p[0];
        if (obj[idx] === undefined) {
            obj[idx] = unescape(p[1]);
        }
        else {
            if (typeof obj[idx] == "string") {
                obj[idx] = [obj[idx]];
            }
            obj[idx].push(unescape(p[1]));
        }
    }

    return obj;
};

// 添加自定义事件
var addEvent = function(obj, eventName, callback) {
    if (!obj.__TFListeners) {
        obj.__TFListeners = {};
    }

    if (!obj.__TFListeners[eventName]) {
        obj.__TFListeners[eventName] = $.Callbacks();
    }

    obj.__TFListeners[eventName].add(callback);
};

// 删除自定义事件
var removeEvent = function(obj, eventName, callback) {
    if (!obj.__TFListeners || !obj.__TFListeners[eventName]) {
        return;
    }

    if (callback) {
        obj.__TFListeners[eventName].remove(callback);
    }
    else {
        obj.__TFListeners[eventName].empty();
    }
};

// 触发自定义事件
var triggerEvent = function(eventName, param, obj) {
    if (!obj.__TFListeners) {
        return;
    }

    if (obj.__TFListeners[eventName]) {
        obj.__TFListeners[eventName].fireWith(obj, $.makeArray(param));
    }
};


// ======================================


// 创建名字空间
namespace('Core', TF);
namespace('Mentor', TF);
namespace('Component', TF);
namespace('Config', TF);
namespace('Library', TF);
namespace('Helper', TF);


var defaultConfig = {
    baseUrl: '/',
    resourceVersion: 'ver',
    templateUriPattern: '{$name.join("-")}-view.html',
    jsUriPattern: 'resource/js/{$name.join("-")}.js?v={$ver}',
    dataUriPattern: 'data-{$name.join("-")}-{$uri}.js',
    defaultDataUri: 'model',
    debug: false,

    // 提供一些和页面展现相关的方法给框架，类似实现一些框架所需要的接口
    mentor: {}
};

// 需要由外部程序提供方法才能实现相应功能
var mentor = {};

// 页面状态提示相关方法
mentor.Status = (function(){
    var funcations = [
        'unsetStatusMsg',
        'setSuccMsg',
        'setFailMsg',
        'setWarningMsg',
        'setLoadingMsg',
        'unsetLoadingMsg'
    ];

    var func = function(name) {
        return function(appName) {
            if (!TF.Config[appName]) {
                appName = defaultApplicationName;
            }

            var mt = TF.Config[appName].mentor;

            if (mt.Status && $.isFunction(mt.Status[name])){
                mt.Status[name].apply(mt.Status, [].slice.call(arguments, 1));
            }
        };
    };

    var exports = {};

    $.each(funcations, function(){
        exports[this] = func(this);
    });

    return exports;
})();


// 模板渲染相关的方法
mentor.Template = (function(){
    var exports = {
        getRenderedText: function(appName, template, data, name) {
            var mt = TF.Config[appName].mentor;
            if (mt.Template && $.isFunction(mt.Template.getRenderedText)) {
                return mt.Template.getRenderedText.apply(mt.Template, [].slice.call(arguments, 1));
            }
            else {
                return TF.Helper.Utility.template(template.html(), data);
            }
        },
        render: function(appName, template, target, data, name) {
            var mt = TF.Config[appName].mentor;
            if (mt.Template && $.isFunction(mt.Template.render)) {
                return mt.Template.render.apply(mt.Template, [].slice.call(arguments, 1));
            }
            else {
                return target.html(TF.Helper.Utility.template(template.html(), data));
            }
        }
    };

    return exports;
})();


// Ajax 相关的一些方法，目前主要是接口调用是否成功的验证
mentor.Ajax = (function(){
    var isfun = $.isFunction;

    var exports = {

        validation: function(appName, jsonObject){
            var mt = TF.Config[appName].mentor;
            if (mt.Ajax && isfun(mt.Ajax.validation)){
                return mt.Ajax.validation.apply(mt.Ajax, [].slice.call(arguments, 1));
            }
            else {
                return true;
            }
        }

    };

    return exports;
})();


mentor.Form = (function() {
    var isfun = $.isFunction;

    var exports = {

        validation: function(appName, elementForm){
            var mt = TF.Config[appName].mentor;
            if (mt.Form && isfun(mt.Form.validation)){
                return mt.Form.validation.apply(mt.Form, [].slice.call(arguments, 1));
            }
            else {
                return true;
            }
        }

    };

    return exports;
})();


// 扩展 TF 框架的功能
TF.Mentor = {
    _templateRenderBefore: [],
    _templateRenderAfter: [],
    _routeBefore: [],
    _routeAfter: [],
    _routeFilteringBefore: [],
    _routeFilteringAfter: [],
    _sendBefore: [],
    _sendAfter: [],

    extendComponent: function(options) {
        var me = this;

        if (!$.isPlainObject(options)) {
            return;
        }

        var func = {
            TemplateRenderBefore: '_templateRenderBefore',
            TemplateRenderAfter: '_templateRenderAfter',
            RouteBefore: '_routeBefore',
            RouteAfter: '_routeAfter',
            RouteFilteringBefore: '_routeFilteringBefore',
            RouteFilteringAfter: '_routeFilteringAfter',
            SendBefore: '_sendBefore',
            SendAfter: '_sendAfter'
        };

        $.each(func, function(key, value){
            if ($.isFunction(options[key])) {
                me[value].push(options[key]);
                delete options[key];
            }
        });

        // 直接注入到组件的 sys 名字空间中
        mix(componentSys, options);
    }
};


// Browser JS 的运行环境，浏览器以及版本信息。（Browser 仅基于 userAgent 进行嗅探，存在不严谨的缺陷。）
// 移动的 useragent 信息参考自 http://mo.wed.ivershuo.com/。
TF.Helper.Browser = (function() {
    var na = window.navigator,
        ua = na.userAgent.toLowerCase(),
        browserTester = /(msie|webkit|gecko|presto|opera|safari|firefox|chrome|maxthon|android|ipad|iphone|webos|hpwos)[ \/os]*([\d_.]+)/ig,
        Browser = {
            platform: na.platform
        };
    ua.replace(browserTester, function(a, b, c) {
        var bLower = b.toLowerCase();
        if (!Browser[bLower]) {
            Browser[bLower] = c;
        }
    });
    if (Browser.opera) { //Opera9.8后版本号位置变化
        ua.replace(/opera.*version\/([\d.]+)/, function(a, b) {
            Browser.opera = b;
        });
    }
    if (Browser.msie) {
        Browser.ie = Browser.msie;
        var v = parseInt(Browser.msie, 10);
        Browser['ie' + v] = true;

        try {
            document.execCommand("BackgroundImageCache", false, true);
        } catch (e) {}
    }

    return Browser;
}());
// 实用工具静态类，包括一些常用例程
TF.Helper.Utility = {
    baseUrl: function(appName) {
        appName = appName || defaultApplicationName;
        return TF.Config[appName].baseUrl;
    },

    siteUrl: function(appName, uri){
        appName = appName || defaultApplicationName;

        if (uri.indexOf('http://') === 0) { return uri; }
        else { return TF.Config[appName].baseUrl + uri; }
    },

    // 根据组件名取得 Application Name
    getApplicationName: function(name) {
        var appName;

        // 分析组件名中是否有 Application Name
        if (name.indexOf(':') > 0) {
            appName = name.split(':')[0];
        }
        else {
            appName = defaultApplicationName;
        }

        return capitalize(appName);
    },

    getComponentUrl: function(appName, uri, name) {
        var cfg = TF.Config[appName];

        // 通过 Application Name 得到相应的配置信息
        var pattern = cfg.dataUriPattern;
        var names = TF.Helper.Utility.splitComponentName(name);

        var str = this.template(pattern, {
            name: names,
            uri: uri
        });

        return cfg.baseUrl + str;
    },

    getComponentViewUrl: function(appName, name) {
        var cfg = TF.Config[appName];

        // 通过 Application Name 得到相应的配置信息
        var pattern = cfg.templateUriPattern;
        var names = TF.Helper.Utility.splitComponentName(name);
        var str = this.template(pattern, {
            name: names
        });

        return cfg.baseUrl + str;
    },

    getComponentJsUrl: function(appName, name) {
        var cfg = TF.Config[appName];

        // 通过 Application Name 得到相应的配置信息
        var pattern = cfg.jsUriPattern;
        var names = TF.Helper.Utility.splitComponentName(name);

        var str = this.template(pattern, {
            name: names,
            ver: cfg.resourceVersion
        });

        return cfg.baseUrl + str;
    },

    getDefaultDataUri: function(appName) {
        return TF.Config[appName].defaultDataUri;
    },

    // 生成随机数字字符串
    random: function() {
        return ((new Date()).getTime() + Math.floor(Math.random()*9999));
    },

    // 转成大小写形式的组件名
    // hulk:abc-def 转换成 Hulk:AbcDef
    toComponentName: function(uriName) {
        var appName;
        var name;
        var tmp;

        // 分析组件名中是否有 Application Name
        if (uriName.indexOf(':') > 0) {
            tmp = uriName.split(':');

            appName = tmp[0];
            name = tmp[1];

            return capitalize(appName) + ':' + capitalize($.camelCase(name));
        }
        else {
            return capitalize($.camelCase(uriName));
        }
    },

    // 转成小写分隔符形式的组件名
    // Hulk:AbcDef 转换成 hulk:abc-def
    toComponentUriName: function(name, sep) {
        var appName;
        var tmp;
        var result = '';

        sep = sep || '-';

        // 分析组件名中是否有 Application Name
        if (name.indexOf(':') > 0) {
            tmp = name.split(':');

            appName = tmp[0];
            name = tmp[1];

            result = appName.toLowerCase() + ':';
        }

        result += name.replace(/[A-Z]/g, function(a) {
            return sep + a.toLowerCase();
        }).slice(1);

        return result;
    },

    splitComponentName: function(name) {
        var result = [];
        name.replace(/([A-Z][a-z]*)/g, function(a) {
            result.push(a.toLowerCase());
        });
        return result;
    },

    // 从组件全名取得组件详细名称
    getComponentName: function(name) {
        // 分析组件名中是否有 Application Name
        if (name.indexOf(':') > 0) {
            name = name.split(':')[1];
        }

        return name;
    },

    getFullComponentName: function(name) {
        return TF.Helper.Utility.getApplicationName(name) + ':' + TF.Helper.Utility.getComponentName(name);
    },

    /**
     * 字符串模板
     * @method template
     * @static
     * @param {String} sTmpl 字符串模板，其中变量以{$aaa}表示。模板语法：
     分隔符为{xxx}，"}"之前没有空格字符。
     js表达式/js语句里的'}', 需使用' }'，即前面有空格字符
     模板里的字符{用##7b表示
     模板里的实体}用##7d表示
     模板里的实体#可以用##23表示。例如（模板真的需要输出"##7d"，则需要这么写“##23#7d”）
     {strip}...{/strip}里的所有\r\n打头的空白都会被清除掉
     {}里只能使用表达式，不能使用语句，除非使用以下标签
     {js ...}       －－任意js语句, 里面如果需要输出到模板，用print("aaa");
     {if(...)}      －－if语句，写法为{if($a>1)},需要自带括号
     {elseif(...)}  －－elseif语句，写法为{elseif($a>1)},需要自带括号
     {else}         －－else语句，写法为{else}
     {/if}          －－endif语句，写法为{/if}
     {for(...)}     －－for语句，写法为{for(var i=0;i<1;i++)}，需要自带括号
     {/for}         －－endfor语句，写法为{/for}
     {while(...)}   －－while语句,写法为{while(i-->0)},需要自带括号
     {/while}       －－endwhile语句, 写法为{/while}
     * @param {Object} opts (Optional) 模板参数
     * @return {String|Function}  如果调用时传了opts参数，则返回字符串；如果没传，则返回一个function（相当于把sTmpl转化成一个函数）

     * @example alert(template("{$a} love {$b}.",{a:"I",b:"you"}));
     * @example alert(template("{js print('I')} love {$b}.",{b:"you"}));
     */
    template: (function() {
        /*
        sArrName 拼接字符串的变量名。
        */
        var sArrName = "sArrCMX",
            sLeft = sArrName + '.push("';
        /*
            tag:模板标签,各属性含义：
            tagG: tag系列
            isBgn: 是开始类型的标签
            isEnd: 是结束类型的标签
            cond: 标签条件
            rlt: 标签结果
            sBgn: 开始字符串
            sEnd: 结束字符串
        */
        var tags = {
            'js': {
                tagG: 'js',
                isBgn: 1,
                isEnd: 1,
                sBgn: '");',
                sEnd: ';' + sLeft
            },
            //任意js语句, 里面如果需要输出到模板，用print("aaa");
            'if': {
                tagG: 'if',
                isBgn: 1,
                rlt: 1,
                sBgn: '");if',
                sEnd: '{' + sLeft
            },
            //if语句，写法为{if($a>1)},需要自带括号
            'elseif': {
                tagG: 'if',
                cond: 1,
                rlt: 1,
                sBgn: '");} else if',
                sEnd: '{' + sLeft
            },
            //if语句，写法为{elseif($a>1)},需要自带括号
            'else': {
                tagG: 'if',
                cond: 1,
                rlt: 2,
                sEnd: '");}else{' + sLeft
            },
            //else语句，写法为{else}
            '/if': {
                tagG: 'if',
                isEnd: 1,
                sEnd: '");}' + sLeft
            },
            //endif语句，写法为{/if}
            'for': {
                tagG: 'for',
                isBgn: 1,
                rlt: 1,
                sBgn: '");for',
                sEnd: '{' + sLeft
            },
            //for语句，写法为{for(var i=0;i<1;i++)},需要自带括号
            '/for': {
                tagG: 'for',
                isEnd: 1,
                sEnd: '");}' + sLeft
            },
            //endfor语句，写法为{/for}
            'while': {
                tagG: 'while',
                isBgn: 1,
                rlt: 1,
                sBgn: '");while',
                sEnd: '{' + sLeft
            },
            //while语句,写法为{while(i-->0)},需要自带括号
            '/while': {
                tagG: 'while',
                isEnd: 1,
                sEnd: '");}' + sLeft
            } //endwhile语句, 写法为{/while}
        };

        return function(sTmpl, opts) {
            var N = -1,
                NStat = []; //语句堆栈;
            var ss = [
                [/\{strip\}([\s\S]*?)\{\/strip\}/g, function(a, b) {
                    return b.replace(/[\r\n]\s*\}/g, " }").replace(/[\r\n]\s*/g, "");
                }],
                [/\\/g, '\\\\'],
                [/"/g, '\\"'],
                [/\r/g, '\\r'],
                [/\n/g, '\\n'], //为js作转码.
                [
                    /\{[\s\S]*?\S\}/g, //js里使用}时，前面要加空格。
                    function(a) {
                        var stat;
                        a = a.substr(1, a.length - 2);
                        for (var i = 0; i < ss2.length; i++) {a = a.replace(ss2[i][0], ss2[i][1]); }
                        var tagName = a;
                        if (/^(.\w+)\W/.test(tagName)) {tagName = RegExp.$1; }
                        var tag = tags[tagName];
                        if (tag) {
                            if (tag.isBgn) {
                                stat = NStat[++N] = {
                                    tagG: tag.tagG,
                                    rlt: tag.rlt
                                };
                            }
                            if (tag.isEnd) {
                                if (N < 0) {throw new Error("Unexpected Tag: " + a); }
                                stat = NStat[N--];
                                if (stat.tagG != tag.tagG) {throw new Error("Unmatch Tags: " + stat.tagG + "--" + tagName); }
                            } else if (!tag.isBgn) {
                                if (N < 0) {throw new Error("Unexpected Tag:" + a); }
                                stat = NStat[N];
                                if (stat.tagG != tag.tagG) {throw new Error("Unmatch Tags: " + stat.tagG + "--" + tagName); }
                                if (tag.cond && !(tag.cond & stat.rlt)) {throw new Error("Unexpected Tag: " + tagName); }
                                stat.rlt = tag.rlt;
                            }
                            return (tag.sBgn || '') + a.substr(tagName.length) + (tag.sEnd || '');
                        } else {
                            return '",(' + a + '),"';
                        }
                    }
                ]
            ];
            var ss2 = [
                [/\\n/g, '\n'],
                [/\\r/g, '\r'],
                [/\\"/g, '"'],
                [/\\\\/g, '\\'],
                [/\$(\w+)/g, 'opts["$1"]'],
                [/print\(/g, sArrName + '.push(']
            ];
            for (var i = 0; i < ss.length; i++) {
                sTmpl = sTmpl.replace(ss[i][0], ss[i][1]);
            }
            if (N >= 0) {throw new Error("Lose end Tag: " + NStat[N].tagG); }

            sTmpl = sTmpl.replace(/##7b/g,'{').replace(/##7d/g,'}').replace(/##23/g,'#'); //替换特殊符号{}#
            sTmpl = 'var ' + sArrName + '=[];' + sLeft + sTmpl + '");return ' + sArrName + '.join("");';

            //alert('转化结果\n'+sTmpl);
            /*jslint evil: true */
            var fun = new Function('opts', sTmpl);
            if (arguments.length > 1) {return fun(opts); }
            return fun;
        };
    }())

};
// Hash 类库
TF.Library.Hash = function(object) {
    this.data = object || {};
    return this;
};
mix(TF.Library.Hash.prototype, {
    has: function(key) {
        return this.data[key] != undefined;
    },

    keyOf: function(value){
        for (var key in this.data){
            if (this.data.hasOwnProperty(key) && this.data[key] === value) {
                return key;
            }
        }
        return null;
    },

    hasValue: function(value){
        return (this.keyOf(value) !== null);
    },

    each: function(fn){
        $.each(this.data, fn);

        return this;
    },

    combine: function(properties, override){
        mix(this.data, properties || {}, override);

        return this;
    },

    erase: function(key){
        if (this.data.hasOwnProperty(key)) {
            delete this.data[key];
        }

        return this;
    },

    get: function(key){
        return ((this.data.hasOwnProperty(key)) ? this.data[key] : null);
    },

    set: function(key, value){
        if (!this.data[key] || this.data.hasOwnProperty(key)) {
            this.data[key] = value;
        }

        return this;
    },

    empty: function(){
        var me = this;

        $.each(this.data, function(key, value){
            delete me.data[key];
        });

        return this;
    },

    include: function(key, value){
        if (this.data[key] != undefined) {
            this.data[key] = value;
        }

        return this;
    },

    getKeys: function(){
        var keys = [];

        $.each(this.data, function(key){
            keys.push(key);
        });

        return keys;
    },

    getValues: function(){
        var values = [];

        $.each(this.data, function(key, value){
            values.push(value);
        });

        return values;
    },

    toQueryString: function(){
        var s = [];

        for ( var p in this.data ) {
            if (this.data[p]==null) {
                continue;
            }
            if (this.data[p] instanceof Array) {
                for (var i=0; i<this.data[p].length; i++) {
                    s.push( encodeURIComponent(p) + '[]=' + encodeURIComponent(this.data[p][i]));
                }
            }
            else {
                s.push( encodeURIComponent(p) + '=' + encodeURIComponent(this.data[p]));
            }
        }

        return s.join('&');
    }
});
// URI hash 管理，主要就是实现 hashchange 事件
TF.Library.LocationHash = function(options) {
    this.options = {
        /*jshint scripturl:true*/
        blank_page: 'javascript:0',
        start: false
    };
    this.prefix = '#';
    this.iframe = null;
    this.handle = false;
    this.useIframe = (TF.Helper.Browser.ie && (typeof(document.documentMode)=='undefined' || document.documentMode < 8));
    this.state = null;
    this.supports = (('onhashchange' in window) && (typeof(document.documentMode) == 'undefined' || document.documentMode > 7));
    this.noFireOnce = false;

    mix(this.options, options, true);

    //CustEvent.createEvents(this, ['hashChanged']);

    this.initialize();

    return this;
};
mix(TF.Library.LocationHash.prototype, {
    initialize: function(){
        var self = this;

        // Disable Opera's fast back/forward navigation mode
        if (TF.Helper.Browser.opera && window.history.navigationMode) {
            window.history.navigationMode = 'compatible';
        }

        // IE8 in IE7 mode defines window.onhashchange, but never fires it...
        if (this.supports) {
            // The HTML5 way of handling DHTML history...
            $(window).on('hashchange', function() {
                if (self.noFireOnce) {
                    self.noFireOnce = false;
                    return;
                }
                triggerEvent('hashChanged', {hash: self.getHash()}, self);
            });
        }
        else {
            if (this.useIframe) {
                this.initializeHistoryIframe();
            }
        }

        if (this.options.start) {
            this.start();
        }
    },

    initializeHistoryIframe: function() {
        var hash = this.getHash(), doc;
        this.iframe = this.getIframe();

        this.istate = null;

        doc = (this.iframe.contentDocument) ? this.iframe.contentDocument  : this.iframe.contentWindow.document;
        doc.open();
        doc.write('<html><head><title>' + document.title + '</title></head><body id="state">' + hash + '</body></html>');
        doc.close();
        this.istateOld = false;
    },

    checkHash: function(){
        var state = this.getState();

        if (this.state == state) {
            return;
        }
        if (TF.Helper.Browser.ie && (this.state !== null)) {
            this.setState(state, true);
        }
        else {
            this.state = state;
        }

        triggerEvent('hashChanged', {hash: state}, this);
    },

    getHash: function() {
        var href = decodeURI(top.location.href);
        var pos = href.indexOf(this.prefix) + 1;
        return (pos) ? href.substr(pos) : '';
    },

    // 不带#号
    setHash: function(hash, noFire) {
        if (this.getHash() == hash) {
            // 如果hash没有变化 则不引发任何事件
            return;
        }

        hash = encodeURI(hash);

        if (this.supports) {
            if (noFire) {
                this.noFireOnce = true;
            }
            top.location.hash = this.prefix + hash || this.prefix;
            return;
        }

        this.setState(hash);

        if (noFire) {
            return;
        }

        triggerEvent('hashChanged', {hash: hash}, this);
    },

    pick: function() {
        for (var i = 0, l = arguments.length; i < l; i++) {
            if (arguments[i] != undefined) {
                return arguments[i];
            }
        }
        return null;
    },

    getState: function() {
        var state = this.getHash();
        if (this.iframe) {
            var doc = this.iframe.contentWindow.document;
            if (doc && doc.body.id == 'state') {
                var istate = decodeURI(doc.body.innerText);
                if (this.state == state) {
                    return istate;
                }
                this.istateOld = true;
            }
            else {
                return this.istate;
            }
        }

        return state;
    },

    setState: function(state, fix) {
        state = this.pick(state, '');
        top.location.hash = this.prefix + state || this.prefix;

        if (TF.Helper.Browser.ie && (!fix || this.istateOld)) {
            if (!this.iframe) {
                this.iframe = this.getIframe();

                this.istate = this.state;
            }

            var doc = (this.iframe.contentDocument) ? this.iframe.contentDocumnet  : this.iframe.contentWindow.document;
            doc.open();
            doc.write('<html><head><title>' + document.title + '</title></head><body id="state">' + state + '</body></html>');
            doc.close();
            this.istateOld = false;
        }

        this.state = state;
    },

    clear: function(timer) {
        clearTimeout(timer);
        clearInterval(timer);
        return null;
    },

    start: function() {
        if (this.supports) {
            triggerEvent('hashChanged', {hash: this.getHash()}, this);
            return;
        }

        this.handle = setInterval(proxy(this.checkHash, this), 200);
        this.started = true;

        return this;
    },

    stop: function() {
        this.clear(this.handle);
    },

    getIframe: function() {
        return $('<iframe src="' + this.options.blank_page + '"></iframe>').css({
            'position'  : 'absolute',
            'top'       : 0,
            'left'      : 0,
            'width'     : '1px',
            'height'    : '1px',
            'visibility': 'hidden'
        }).appendTo(document.body)[0];
    }
});

// 组件加载器类
TF.Library.ComponentLoader = function(options, componentMgrInstance) {
    this.options = {
        name: 'Default',
        url: '',
        hide: false,             // 是否以隐藏的方式渲染组件
        lazyInit: false,         // 延迟初始化
        lazyRender: false,       // 延迟渲染
        appendRender: false,     // 是否添加到容器节点
        replaceRender: false,    // 是否替换容器节点
        renderTo: '#component',  // 组件的容器
        applyTo: '',             // 直接把某个 DOM 节点变成组件
        contentEl: '',           // 从某个 DOM 节点取得组件的内容
        data: ''                 // URL 参数
    };
    mix(this.options, options, true);

    // 判断是加载到全局组件管理器，还是私有组件管理器中
    this.componentMgrInstance = componentMgrInstance ? componentMgrInstance : TF.Core.ComponentMgr;

    this.initialize();

    return this;
};
mix(TF.Library.ComponentLoader.prototype, {
    initialize: function() {
        //if ($(this.options.renderTo).length == 0 && $(this.options.applyTo).length == 0) return;

        this._instance = null;
        this._instanced = false;
        this.fullName = this.options.name;
        this.appName = TF.Helper.Utility.getApplicationName(this.options.name);
        this.name = TF.Helper.Utility.getComponentName(this.options.name);

        // 注册到组件管理器
        //this.componentMgrInstance.register(this.fullName);
    },

    on: function(eventName, callback) {
        return addEvent(this, eventName, callback);
    },

    load: function() {
        this._preload();
    },

    _preload: function() {
        var me = this;

        // Application Name 不存在则创建
        TF.Component[this.appName] = TF.Component[this.appName] || {};

        var isLoad = (typeof TF.Component[this.appName][this.name] !== 'undefined');
        if (isLoad) {
            this._createInstance();
        }
        else {
            $.ajax({
                type: "GET",
                url: TF.Helper.Utility.getComponentJsUrl(this.appName, this.name),
                dataType: "script",
                cache: true
            })
            .done(function(){
                if (typeof TF.Component[me.appName][me.name] !== 'undefined') {
                    // 加载成功
                    me._createInstance();
                }
                else {
                    // 加载失败
                    // 应该返回错误，或者记录日志
                    me._failure();
                }
            })
            .fail(function( jqxhr, settings, exception ){
                typeof console === 'object' && console.error(exception.message);
                // 加载失败
                // 应该返回错误，或者记录日志
                me._failure();
            });
        }
    },

    // 创建当前内容的名字空间实例
    _createInstance: function() {
        try {
            this._instance = new TF.Component[this.appName][this.name](this.options);
        }
        catch(e) {
        }

        if (!this._instance) {
            this._failure();
        }

        this._funcs = [];
        this._loadMentor(proxy(this._initInstance, this));
    },

    // 组件依赖分析，根据依赖加载相应组件
    // 返回组件实例
    _loadMentor: function(callback, fullName, parentClass) {
        var mentor;
        var me = this;
        var appName;
        var name;

        if (fullName) {
            appName = TF.Helper.Utility.getApplicationName(fullName);
            name = TF.Helper.Utility.getComponentName(fullName);

            var isLoad = (typeof TF.Component[appName][name] !== 'undefined');

            if (isLoad) {
                // 组件类已加载
                mentor = TF.Component[appName][name].prototype.Mentor;
                if (mentor && mentor.name) {
                    me._loadMentor(function(){
                        me._initMentor(fullName, parentClass, TF.Component[appName][name]);
                        callback();
                    }, mentor.name, TF.Component[appName][name]);
                }
                else {
                    me._initMentor(fullName, parentClass, TF.Component[appName][name]);
                    callback();
                }
            }
            else {
                // 组件类未加载
                $.ajax({
                    type: "GET",
                    url: TF.Helper.Utility.getComponentJsUrl(appName, name),
                    dataType: "script",
                    cache: true
                })
                .done(function(){
                    if (typeof TF.Component[appName][name] !== 'undefined') {
                        // 加载成功
                        mentor = TF.Component[appName][name].prototype.Mentor;
                        if (mentor && mentor.name) {
                            me._loadMentor(function(){
                                me._initMentor(fullName, parentClass, TF.Component[appName][name]);
                                callback();
                            }, mentor.name, TF.Component[appName][name]);
                        }
                        else {
                            me._initMentor(name, parentClass, TF.Component[appName][name]);
                            callback();
                        }
                    }
                    else {
                        // TODO: 要抛一个异常，表示依赖加载失败，或者是触发一个加载失败的事件
                    }
                })
                .fail(function( jqxhr, settings, exception ){
                    typeof console === 'object' && console.error(exception.message);
                    // 加载失败
                    // 应该返回错误，或者记录日志
                });
            }

        }
        else {
            if (this._instance.Mentor) {
                this._loadMentor(callback, this._instance.Mentor.name);
            }
            else {
                callback();
            }
        }
    },

    // 初始化继承的组件
    _initMentor: function(fullName, componentClass, mentorClass) {
        var dest;
        var sourPrototype;
        var metroPrototype = mentorClass.prototype;

        componentClass = componentClass || this._instance;

        if ($.isFunction(componentClass)) {
            dest = componentClass.prototype;
            sourPrototype = componentClass.prototype;
        }
        else {
            dest = this._instance;
            sourPrototype = TF.Component[this.appName][this.name].prototype;
        }

        // 把父类方法放入子类或当前实例
        mix(dest, metroPrototype, function(des, src, key){
            if (key == 'Mentor' || sourPrototype.hasOwnProperty(key)) {
                // 如果子类重载了父类的方法，则增加一个 _super 方法到当前实例中
                // _super 方法参考了 http://ejohn.org/blog/simple-javascript-inheritance
                if ($.isFunction(src) && $.isFunction(des) && /\b_super\b/.test(des)) {
                    return (function(name, fn){
                        return function() {
                            var tmp = this._super;

                            // Add a new ._super() method that is the same method
                            // but on the super-class
                            this._super = metroPrototype[name];

                            // The method only need to be bound temporarily, so we
                            // remove it when we're done executing
                            var ret = fn.apply(this, arguments);
                            this._super = tmp;

                            return ret;
                        };
                    })(key, des);
                }
                else {
                    return des;
                }
            }
            else {
                return src;
            }
        });

        if ($.isFunction(componentClass)) {
            // 设置是否使用借用组件的视图
            if (dest.Mentor.useMentorView) {
                dest.Mentor.useMentorView = false;
                dest.Mentor.useView = fullName;
            }
            else if (dest.Mentor.useView) {
                dest.Mentor.useView = metroPrototype.Mentor.useView;
            }

            if (metroPrototype.Mentor) {
                mix(dest.Mentor.viewData, metroPrototype.Mentor.viewData, true);

                if (metroPrototype.Mentor.__path) {
                    dest.Mentor.__path = metroPrototype.Mentor.__path;
                }
                else {
                    dest.Mentor.__path = [];
                }
            }
            else {
                dest.Mentor.__path = [];
            }

            dest.Mentor.__path.push(fullName);
        }
        else {

            // 设置是否使用借用组件的视图
            if (this._instance.Mentor.useMentorView) {
                if (metroPrototype.Mentor && metroPrototype.Mentor.useView) {
                    this._instance.sys.viewName = metroPrototype.Mentor.useView;
                }
                else {
                    this._instance.sys.viewName = fullName;
                }
            }
            else if (this._instance.Mentor.useView) {
                this._instance.sys.viewName = this._instance.Mentor.useView;
            }

            if (metroPrototype.Mentor && metroPrototype.Mentor.__path) {
                this._instance.Mentor.__path = metroPrototype.Mentor.__path;
                this._instance.Mentor.__path.push(fullName);
            }
            else {
                this._instance.Mentor.__path = [fullName];
            }

            this._instance.sys.options.data = this._instance.sys.options.data || {};
            mix(this._instance.sys.options.data, this._instance.Mentor.viewData, true);
        }

    },

    // 初始化组件实例
    _initInstance: function(mentorClass) {
        // 组件实例化正确才加载内容
        this._instanced = true;

        // 把加载器的配置传递到组件实例的sys空间里
        mix(this._instance.sys.options, this.options, function(des, src, key){
            if (key == 'data') {
                if ($.isPlainObject(src)) {
                    if (!des) {
                        des = {};
                    }
                    return mix(des, src, true);
                }
                else if ($.type(src) == 'string') {
                    if (!des) {
                        des = {};
                    }
                    return mix(des, unserialize(src), true);
                }
                else {
                    return des;
                }
            }
            else {
                return src;
            }
        });

        this._instance.sys.hidden = this.options.hide;
        this._instance.sys.fullName = this.fullName;
        this._instance.sys.appName = this.appName;
        this._instance.sys.name = this.name;
        this._instance.sys.index = this.options.__index || 0;
        this._instance.sys.contentElement = this.options.__element;
        // 只保存一份 fragment 就可以了
        delete this._instance.options.__element;
        delete this._instance.sys.options.__element;
        // 组件需要知道自己的父级组件管理器是谁
        this._instance.sys.parentComponentMgr = this.componentMgrInstance;

        // 实例准备就绪
        this._instance.InstanceReady(this);

        //this.componentMgrInstance.loaded(this.fullName, this._instance);

        var obj = {instance: this._instance, fullName: this.fullName, name: this.name, appName: this.appName};

        triggerEvent('instanced', obj, this);

        // 看是否是延迟渲染
        if (!this.options.lazyRender) {
            this._instance.sys.render();
        }

        triggerEvent('complete', obj, this);
    },

    _failure: function() {
        triggerEvent('failure', {instance: null, fullName: this.fullName, name: this.name, appName: this.appName}, this);
    },

    getInstance: function() {
        return this._instance;
    },

    cancel: function() {
        if (this._instance) {
            this._instance.sys.cancelRender();
        }
    }

});


// 组件已加载的资源
var loadedResource = {};

// 组件系统内部方法
var componentSys = {
    // 组件消息处理中心
    postMessage: function(msg, args) {
        var returnValue;

        // 如果组件还未渲染，则等待组件完成渲染，再传递最后一个消息
        if (!this.rendered) {
            // 系统事件预处理
            switch (msg) {
                case 'component-show':
                    this.hidden = false;
                    break;

                case 'component-only-show':
                    this.hidden = false;
                    break;

                case 'component-hide':
                    this.hidden = true;
                    break;
            }

            if (msg == 'component-route') {
                this.lastRouterMessage = {msg: msg, args: args};
            }
            else {
                this.lastMessage = {msg: msg, args: args};
            }
            if (!this.rendering) {
                this.render();
            }

            return;
        }
        //if (!$defined(args)) args = {};

        // before 用于处理消息返回值，表示是否继续传递消息
        var is_continue = true;
        var funcName = $.camelCase(msg);

        // 传递处理过的参数给 Action
        var filteredArgs = args;
        switch (msg) {
            case 'component-route':
                filteredArgs = this._filterRouterArgs(args);
                break;
        }

        if (this.instance && $.isFunction(this.instance[funcName + 'ActionBefore'])) {
            is_continue = this.instance[funcName + 'ActionBefore'].call(this.instance, filteredArgs, args);
        }

        if (is_continue === false) {
            return;
        }

        // 系统事件处理
        switch (msg) {
            case 'component-route':
                this.route(args);
                break;

            case 'component-render':
                this.render(args);
                break;

            case 'component-refresh':
                this.refresh(args);
                break;

            case 'component-destroy':
                this.destroy(args);
                break;

            case 'component-show':
                this.show(args);
                break;

            case 'component-only-show':
                this.onlyShow(args);
                break;

            case 'component-hide':
                this.hide(args);
                break;
        }

        // 把消息派发到组件实例中
        if (this.instance && $.isFunction(this.instance[funcName + 'Action'])) {
            returnValue = this.instance[funcName + 'Action'].call(this.instance, filteredArgs, args);
        }

        this.parentComponentMgr.publish(this.name + '[' + this.index + ']', msg, args);

        return returnValue;
    },

    // 系统路由处理函数
    route: function(args) {
        var me = this;

        // 如果现在路由到其他组件了，则不显示组件
        if (TF.Helper.Utility.getFullComponentName(TF.Core.Router.parseUri().name) == TF.Helper.Utility.getFullComponentName(this.fullName)) {
            this.postMessage('component-only-show');
        }

        $.each(TF.Mentor._routeBefore, function(){
            args = this.call(me, args);
        });

        $.each(TF.Mentor._routeAfter, function(){
            args = this.call(me, args);
        });
    },

    _filterRouterArgs: function(args) {
        var me = this;

        $.each(TF.Mentor._routeFilteringBefore, function(){
            args = this.call(me, args);
        });

        $.each(TF.Mentor._routeFilteringAfter, function(){
            args = this.call(me, args);
        });

        return args;
    },

    // 渲染组件
    render: function() {
        var me = this;

        if (this.rendering) {
            return;
        }

        this.rendering = true;

        if (!this.instance || this.rendered) {
            return;
        }

        this._loadResource(function(){
            if (me.options.applyTo) {
                //直接渲染
                me._loadComplete($(me.options.applyTo));
            }
            else if (me.options.contentEl) {
                //直接渲染
                me._loadComplete($(me.options.contentEl).clone());
            }
            else {
                me._loadContent();
            }
        });
    },

    // 刷新组件内容
    refresh: function(data) {
        if (!this.rendered) {
            return;
        }

        if ($.isPlainObject(data)) {
            this.options.data = data;
            this.loader.data = data;
        }

        this.refreshing = true;
        this._loadContent();
    },

    // 装载资源文件
    _loadResource: function(callback) {
        var me = this;
        var resource = this.instance.RequireResource;
        var sources;
        var counter, loaded, url;

        if (!resource) {
            callback();
            return;
        }

        if (resource.js) {
            sources = $.makeArray(resource.js);

            counter = 0;
            loaded = 0;

            $.each(sources, function(i, source) {
                url = this;

                if (url.indexOf("http://") !== 0) {
                    url = TF.Helper.Utility.baseUrl(me.appName) + url;
                }

                if (!loadedResource[url]) {
                    $.ajax({
                        type: "GET",
                        url: url,
                        dataType: "script",
                        cache: true
                    }).always(function(){
                        counter++;
                        if ((counter + loaded) == sources.length) {
                            callback();
                        }
                    });

                    loadedResource[url] = true;
                }
                else {
                    loaded++;
                }
            });

            // 如果所有的都已经装载过，也要发出完成事件！！
            if (loaded == sources.length && counter != sources.length) {
                callback();
            }
        }
    },

    // 装载组件模板
    _loadContent: function() {
        var me = this;

         // 如果组件自己提供视图，则用组件自己的视图，不要去远程加载
        if ($.isString(this.instance.ComponentView)) {
            this._loadComplete($(this.instance.ComponentView));

            return;
        }
        else if ($.isFunction(this.instance.ComponentView)) {
            var result = this.instance.ComponentView();

            // 如果是 Promise 对象，表示可能是 AJAX 加载，则等到数据加载完毕再渲染视图
            if ($.isPlainObject(result) && $.isFunction(result.promise)) {
                result.done(function(data){
                    me._loadComplete($(data));
                });
            }
            else {
                this._loadComplete($(result));
            }

            return;
        }

        if (this.options.url == '') {
            this.options.url = (this.viewName ?
                                TF.Helper.Utility.getComponentViewUrl(TF.Helper.Utility.getApplicationName(this.viewName),
                                TF.Helper.Utility.getComponentName(this.viewName)) : TF.Helper.Utility.getComponentViewUrl(this.appName, this.name));
        }
        else if (this.options.url.indexOf("http://") < 0) {
            this.options.url = TF.Helper.Utility.siteUrl(this.appName, this.options.url);
        }

        this.loader = $.ajax(this.options.url, {
            data: this.options.data || '',
            type: 'GET',
            timeout: 10000,
            dataType: 'text',
            cache: typeof this.options.cache === 'undefined' ? false : this.options.cache,
            xhrFields: {
                'withCredentials': true
            },
            success: proxy(this._loadComplete, this),
            error: proxy(function() {
                //this.loadError('4. Ajax Error!');
                //this.unsetLoadingMsg();
            }, this)
        });

        //this.setLoadingMsg();
    },

    _loadComplete: function(responseText, textStatus, jqXHR) {
        var me = this;

        // 如果是取消的请求，则什么也不做，我们只关心真正请求回来的数据，而不关心请求的状态
        if (jqXHR && jqXHR.statusText == 'abort') {
            return;
        }

        if (!this.instance) {
            return;
        }

        var response, responseTree;

        response = responseText;

        if ($.type(response) == 'string') {
            // 解决 IE 下 innerHTML 不能直接设置 script 的问题
            if (TF.Helper.Browser.ie) {
                response = response.replace(/(<div\s+class="TFComponent"\s*>)/ig, '$1<div style="display:none">tf</div>');
            }

            responseTree = $('<div></div>').html(response).find('.TFComponent');
        }
        else if (response && response.length > 0) {
            responseTree = response.first();
        }
        else {
            // error
            return;
        }

        // 如果没有装载正确，则立即返回
        if (responseTree.length == 0) {
            if (response) {
                this._loadError('DEBUG: ' + response);
            }
            return;
        }

        var element = responseTree;

        if (this.refreshing) {
            this.topElement.html(element.html());
        }
        else {
            // 存储经过包装的元素
            this._setTopElement(element);
        }

        // 是否以隐藏的方式渲染组件
        if (this.hidden) {
            this.topElement.hide();
        }

        var renderTo = $(this.options.renderTo);

        // 放入 DOM 树中
        if (!this.refreshing) {
            if (!this.options.applyTo) {
                if (!this.options.appendRender && !this.options.replaceRender) {
                    renderTo.empty();
                }

                if (this.options.replaceRender) {
                    // 要把元素属性复制过去
                    // 复制 class
                    var cls = renderTo[0].attributes.getNamedItem('class');
                    if (cls) {
                        $.each(cls.value.split(' '), function(i, v){
                            element.addClass(v);
                        });
                    }

                    // 复制 style
                    var style = renderTo[0].attributes.getNamedItem('style');
                    if (style) {
                        var namedItem = document.createAttribute("style");
                        namedItem.value = style.value;
                        element[0].attributes.setNamedItem(namedItem);
                    }

                    renderTo.replaceWith(element);
                }
                else {
                    renderTo.append(element);
                }
            }
        }

        if (this.find('.tf-component-error').length == 0) {
            this.find().attr('data-tf-component', this.fullName);

            // 判断是否是客户端渲染
            var template = this.find('script.TFTemplate');
            var data = this.find('script.TFData');

            var obj = null;

            if (data.length > 0) {
                try {
                    obj = $.parseJSON(data.html());
                } catch (e) {}
            }

            if (obj && template.length > 0) {
                // 是客户端渲染，执行模板操作
                mentor.Template.render(this.appName, template, this.find(), {'ComponentData': obj});
            }

            this.instance.options['TFData'] = obj;

            // 自动提取页面中的 options 值
            var options = this.find('.tf-options');
            var name, tag;
            $.each(options, function(i, e){
                e = $(e);
                name = e.attr('name');

                if (!name) {
                    return;
                }

                tag = e.prop('tagName').toLowerCase();
                if (tag == 'input' || tag == 'textarea') {
                    me.instance.options[name] = e.val();
                }
                else {
                    me.instance.options[name] = e.html();
                }
            });

            triggerEvent('complete', this._getEventObject(), this.instance);

            // 页面全部装载完成！
            if (this.refreshing) {
                // TODO:
                // 应该和加载一样需要做一些处理
                // 例如可能需要重新加载子组件

                this._setDefaultSubmit();

                // 先加载子组件，加载完毕后才是 DomRefreshReady
                // 如果没有子组件，直接执行 DomRefreshReady
                this._loadSubComponents(proxy(function(){

                    this.instance.DomRefreshReady();

                    this._setDefaultFocus();

                    this.rendering = false;

                    // 刷新完毕
                    this.refreshing = false;

                    triggerEvent('refreshReady', this._getEventObject(), this.instance);

                }, this));

            }
            else {
                // 处理事件委托绑定
                this._delegateJsEvent();
                this._delegateJsAction();

                this._delegateEvent(this.instance.Events);
                this._setDefaultSubmit();

                // 先加载子组件，加载完毕后才是 DomReady
                // 如果没有子组件，直接执行 DomReady
                this._loadSubComponents(proxy(function(){

                    this.instance.DomReady();

                    this._setDefaultFocus();

                    // 渲染完毕
                    this.rendered = true;

                    this.rendering = false;

                    // 刷新完毕
                    this.refreshing = false;

                    // 渲染完毕后要处理未渲染时的最后一条消息
                    if (this.lastRouterMessage) {
                        this.postMessage(this.lastRouterMessage.msg, this.lastRouterMessage.args);
                        this.lastRouterMessage = null;
                    }
                    if (this.lastMessage) {
                        this.postMessage(this.lastMessage.msg, this.lastMessage.args);
                        this.lastMessage = null;
                    }

                    triggerEvent('ready', this._getEventObject(), this.instance);

                }, this));

            }
        }
        else {
            this.rendering = false;

            // 刷新完毕
            this.refreshing = false;

            triggerEvent('failure', this._getEventObject(), this.instance);

            if (TF.Config[this.appName].debug) {
                typeof console === 'object' && console.error('Component [' + this.getComponentName() + '] load error!');
            }

            this.instance.LoadError();
        }

        return true;
    },

    _getEventObject: function() {
        return {
            instance: this.instance,
            fullName: this.fullName,
            name: this.name,
            appName: this.appName
        };
    },

    _loadError: function(msg) {
        typeof console === 'object' && console.error(msg);
    },

    _delegateEvent: function(configs){
        if (!configs) {
            return;
        }
        var value;
        var me = this;

        var eventFunc = function(type){
            var func = value[type];

            if ($.type(func) == 'string') {
                func = me.instance[func];
            }

            return function(ev) {
                ev.stopPropagation();
                return func.call(me.instance, ev, this);
            };
        };

        for (var key in configs) {
            value = configs[key];
            if ($.isFunction(value)) {
                value = {"click": value};
            }
            for (var type in value) {
                this.topElement.delegate(key, type, eventFunc(type));
            }
        }
    },

    // 获取视图里绑定的数据
    _getBindingData: function(element) {
        var el = $(element);
        var bindingElement = el.hasClass('tf-bind') ? el : el.parents('.tf-bind');
        var data = {};
        var binding = '';
        var targetElement;
        var targetName = '';
        var me = this;

        //console.log(bindingElement);
        //console.log($(this).parents('.tf-bind'));

        if (bindingElement.length > 0) {
            // 这里可以通过自动查找 target name 实现无需在 data-bind 里填写模版名
            targetElement = el.parents('[class*=TFTarget]');

            if (targetElement.length > 0) {
                // 解析 Target 名称
                var match = /TFTarget-(\S+)/.exec(targetElement.attr('class'));
                if (match) {
                    targetName = match[1];
                }

                if (targetName) {
                    targetName = '["' + targetName + '"]';
                }
            }

            //console.log(targetName);

            // 找到了绑定数据的DOM节点
            // 解析绑定数据
            binding = bindingElement.data('bind') || 'null';
            //console.log(this.templateData);
            //console.log('opts' + targetName + '.' + binding);
            binding = binding.split(',');

            if (binding.length > 1) {
                data = [];
                $.each(binding, function(index, item){
                    data.push(evalExp('opts' + targetName + '.' + $.trim(item), me.templateData));
                });
            }
            else {
                data = evalExp('opts' + targetName + '.' + $.trim(binding[0]), this.templateData);
            }

        }

        return data;
    },

    _delegateJsAction: function(){
        var me = this;

        this.topElement.delegate('[tf-action-click]', 'click', function(e) {
            e.stopPropagation();

            if (this.tagName.toLowerCase() == 'a') {
                e.preventDefault();
            }
            var args = {};
            var action = $(this).attr('tf-action-click') || '';

            // 解析参数
            var match = /(.*?)\((.*)\)/.exec(action);
            if (match) {
                action = $.trim(match[1]);
                if (match[2] != '') {
                    args = evalExp(match[2]);
                }
            }

            if ($.isPlainObject(args)) {
                args.__event = e;
                args.__data = me._getBindingData(this);
            }

            if (/[a-z0-9-]+?-action$/.test(action)) {
                me.postMessage(action, args);
            }
            else {
                var actionName = $.camelCase(action);
                if (me.instance && $.isFunction(me.instance[actionName])) {
                    return me.instance[actionName].call(me.instance, args, this);
                }
            }
        });
    },

    _delegateJsEvent: function(){
        var me = this;

        this.topElement.delegate('[tf-event-click]', 'click', function(e) {
            e.stopPropagation();

            if (this.tagName.toLowerCase() == 'a') {
                e.preventDefault();
            }
            // 由于单击label标签事件会冒泡两次，所以过滤掉label产生的事件
            // <div><label><input ...></label>test</div>
            // TODO: 这里可能不需要太智能的帮用户过滤
            if (e.target.tagName.toLowerCase() == 'label') {
                return;
            }

            e.__data = me._getBindingData(this);

            var eventName = $.camelCase($(this).attr('tf-event-click'));
            if (me.instance && $.isFunction(me.instance[eventName + 'Event'])) {
                return me.instance[eventName + 'Event'].call(me.instance, e, this);
            }
        });

        this.topElement.delegate('[tf-event-change]', 'change', function(e) {
            e.stopPropagation();

            e.__data = me._getBindingData(this);

            var eventName = $(this).attr('tf-event-change');
            if (eventName) {
                eventName = $.camelCase(eventName);
                if (me.instance && $.isFunction(me.instance[eventName + 'Event'])) {
                    return me.instance[eventName + 'Event'].call(me.instance, e, this);
                }
            }
        });
    },

    // 设置默认按钮
    _setDefaultSubmit: function() {
        var form = this.find('form.tf-button');
        var el;

        form.each(function(){
            el = $(this);
            if (el.length > 0) {
                el.off('submit');
                el.on('submit', function(e) {
                    e.preventDefault();
//                        var f = $(e.target).find('button.tf-default').first();
//                        if (f) {
//                            f.trigger('click');
//                        }
                });

                el.find('button.tf-default').attr('type', 'submit');

                // 如果没有 type=submit 的按钮则添加一个
//                    if (el.find('button[type=submit]').length == 0) {
//                        el.append($('<div style="position:absolute;left:-9999px;top:-9999px;"><button type="submit"></button></div>'));
//                    }
            }
        });
    },

    _setDefaultFocus: function() {
        if (this.isHidden()) {
            return;
        }

        var form = this.find('form.tf-focus');
        if (form.length > 0) {
            var first = null;
            var el, tag;
            for (var i = 0, len = form[0].elements.length; i < len; i++) {
                el = $(form[0].elements[i]);
                tag = el.prop('tagName').toLowerCase();

                if (tag == 'input' && el.attr('type') != 'hidden' && !el[0].readOnly && el.is(':visible')) {
                    first = el;
                    break;
                }
                else if (tag == 'textarea' && !el[0].readOnly && el.is(':visible')) {
                    first = el;
                    break;
                }
            }

            if (first && first.length > 0) {
                first.attr('autocomplete', 'off');
                this.setFocus(first);
            }
        }
    },

    // 加载子组件
    _loadSubComponents: function(callback) {
        var me = this;

        this.componentMgr = this.createComponentMgr(function(){
            me.instance.ComponentsReady();
            callback && callback();
        });

        // 兼容方式获取子组件元素
        var components1 = this.topElement.find('.tf-component');
        // 新式获取子组件元素
        var components2 = this.topElement.find('*').filter(function(){
            return this.tagName.toLowerCase().indexOf('tf:') === 0;
        });

        if (components1.length == 0 && components2.length == 0) {
            callback && callback();
            return;
        }

        var args;
        var name;
        var attributes;
        var exclude = ['id', 'class', 'style'];
        var match;

        $.each(components1, function(i, el){
            el = $(el);

            args = {};
            name = el.attr('tf-component-name') || '';

            // 解析参数
            match = /(.*?)\((.*)\)/.exec(name);
            if (match) {
                name = $.trim(match[1]);
                if (match[2] != '') {
                    args = evalExp(match[2]);
                }
            }

            args.name = name;
            args.renderTo = el;

            me.componentMgr.add(args);
        });

        // 组件名计数器
        var componentNames = {};

        $.each(components2, function(index, el){
            el = $(el);

            args = {};

            name = TF.Helper.Utility.toComponentName(el.prop('tagName').toLowerCase().slice(3));

            if (typeof componentNames[name] == 'undefined') {
                componentNames[name] = 0;
            }
            else {
                componentNames[name]++;
            }

            // 把自定义标签的内容存储成 Document Fragment
            var fragment;
            var fragmentElement = null;
            if (el.children().length > 0) {
                fragment = document.createDocumentFragment();
                fragment.appendChild($('<div></div>')[0]);
                fragmentElement = fragment.childNodes[0];
                fragmentElement.innerHTML = el.html();
            }

            attributes = $.makeArray(el[0].attributes);

            $.each(attributes, function(i, item){
                if ($.inArray(item.name, exclude) < 0) {
                    if (item.name.indexOf('data-view-') === 0) {
                        args.data = args.data || {};
                        args.data[item.name.substr(10)] = ((item.name == item.value || item.value === '') ? true : item.value);
                    }
                    else if (item.name.indexOf('tf-on-') === 0) {
                        var actionName = $.camelCase(item.value);
                        if (me.instance && $.isFunction(me.instance[actionName])) {
                            me.componentMgr.subscribe(name + '[' + componentNames[name] + ']', item.name.substr(6), (function(){
                                var newName = name + '[' + componentNames[name] + ']';
                                return function(args) {
                                    this[actionName]({
                                        target: newName,
                                        args: args
                                    });
                                };
                            })(), me.instance);
                        }
                    }
                    else {
                        args[$.camelCase(item.name)] = ((item.name == item.value || item.value === '') ? true : item.value);
                    }
                }
            });

            args.name = name;
            args.replaceRender = true;
            args.renderTo = el;
            args.__element = fragmentElement;

            me.componentMgr.add(args);
        });

        this.componentMgr.startLoad(true);
    },

    setFocus: function(el) {
        if (!el) {
            this._setDefaultFocus();
            return;
        }

        el = $(el);
        setTimeout(function(){
            try {
                if (el.length > 0) {
                    el[0].focus();
                }
            }
            catch(e){}
        }, 200);
    },

    find: function(selector) {
        if (this.topElement) {
            return selector ? this.topElement.find(selector) : this.topElement;
        }
        else {
            return $();
        }
    },

    _setTopElement: function(el, prefix) {
        prefix = prefix || 'transformers_id';
        this.topElement = $(el).attr('id', prefix + '_' + TF.Helper.Utility.random())
                          .addClass('g-tf-' + TF.Helper.Utility.toComponentUriName(this.fullName).replace(':', '-'));

        if (this.instance.Mentor && this.instance.Mentor.__path) {
            var path = this.instance.Mentor.__path;

            for (var i = path.length - 1; i >= 0; i--) {
                this.topElement.addClass('g-tf-' + TF.Helper.Utility.toComponentUriName(path[i]).replace(':', '-'));
            }
        }
    },
    _unsetTopElement: function() {
        if (this.topElement && this.topElement.length > 0)
        {
            this.topElement.parent().empty();
            this.topElement = null;
        }
    },
    // 取自己的组件名
    getComponentName: function() {
        return this.name;
    },
    setLoadingMsg: function(msg) {
        //if (this._isLoadingMsg) return;
        //this._isLoadingMsg = true;
        mentor.Status.setLoadingMsg(this.appName, msg, this.instance);
    },
    unsetLoadingMsg: function() {
        //if (this._isLoadingMsg) return;
        //this._isLoadingMsg = true;
        mentor.Status.unsetLoadingMsg(this.appName, this.instance);
    },
    setSuccMsg: function(msg) {
        mentor.Status.setSuccMsg(this.appName, msg, this.instance, {});
    },
    setFailMsg: function(msg) {
        mentor.Status.setFailMsg(this.appName, msg, this.instance, {});
    },

    getUrl: function(uri) {
        return TF.Helper.Utility.getComponentUrl(this.appName, uri || '', this.name);
    },

    // 封装组件内容 Request
    send: function(url, options) {
        var me = this;

        if (url.indexOf("/") < 0) {
            url = this.getUrl(url);
        }
        else {
            url = TF.Helper.Utility.siteUrl(this.appName, url.slice(1));
        }

        var ajaxOptions = {
            url: url,
            type: 'GET',
            timeout: 10000,
            dataType: 'text',
            cache: false,
            xhrFields: {
                'withCredentials': true
            },
            context: {
                instance: this.instance
            },
            complete: this._sendComplete
        };
        options = options || {};
        if ($.isFunction(options.fn)) {
            options.__TFCallback = options.fn;
            delete options.fn;
        }
        mix(ajaxOptions, options, true);

        if ($.type(ajaxOptions.data) == 'object') {
            var el = $(ajaxOptions.data);
            var tagName = el.prop('tagName');

            if (tagName && tagName.toLowerCase() == 'form') {
                ajaxOptions.data = el.serialize();
            }
        }

        // 如果已经发送请求，则取消上一个请求
        var requestName = url;
        var currentRequester = this.sendRequester.get(requestName);
        if (currentRequester) {
            currentRequester.abort();
        }

        // send before 钩子
        $.each(TF.Mentor._sendBefore, function(){
            this.call(me, ajaxOptions);
        });

        ajaxOptions.context.options = ajaxOptions;

        if (options.loadingMsg !== false) {
            this.setLoadingMsg(options.loadingMsg);
        }

        currentRequester = $.ajax(ajaxOptions);

        this.sendRequester.set(requestName, currentRequester);

        return currentRequester;
    },

    // 装载完成
    // 注意这里的 this 已经换成 ajax context 所指对象
    _sendComplete: function(jqXHR) {
        var me = this.instance;

        me.sys.sendRequester.erase(this.options.url);

        if (this.options.loadingMsg !== false) {
            me.sys.unsetLoadingMsg();
        }

        // 如果是取消的请求，则什么也不做，我们只关心真正请求回来的数据，而不关心请求的状态
        if (jqXHR.statusText == 'abort') {
            return;
        }

        var response = jqXHR.responseText;
        var result = null;

        try {
            result = $.parseJSON(response);
        } catch (e) {}

        if (!result) {
            if (jqXHR.statusText == 'timeout') {
                result = {'errno': 998, 'errmsg': 'Request timeout', data: []}; // 超时错误
            }
            else {
                result = {'errno': 999, 'errmsg': 'Error!', data: []}; // 内部错误
            }
        }

        // 输出调试信息
        if (TF.Config[me.sys.appName].debug) {
            var param = this.options.data && ($.type(this.options.data) == 'string' ? this.options.data : $.param(this.options.data));
            typeof console === 'object' && console.debug('url: ' + this.options.url + (param ? '?' + param : ''));
        }

        var isError = !mentor.Ajax.validation(me.sys.appName, result);
        var args;

        if (isError){
            args = mix(result, {
                message: result.errmsg,
                code: result.errno
            }, true);
        }
        else{
            args = mix(result, {
                message: '',
                code: 0
            }, true);
        }

        if ($.isFunction(this.options.__TFCallback)) {
            this.options.__TFCallback.call(me, !isError, args);
        }

        if (isError) {
            // 显示错误消息
            mentor.Status.setFailMsg(me.sys.appName, args.message, me, args);
        }
        else {
            if ($.type(args.message) == 'string') {
                // 显示成功消息
                mentor.Status.setSuccMsg(me.sys.appName, args.message, me, args);
            }
        }
    },

    // 静态渲染模板
    renderStaticTemplate: function(name, args) {
        var el;
        var me = this;

        args = args || {};

        // 支持渲染一批模板
        name = $.makeArray(name);

        $.each(name, function(index, item){
            // 根据不同情况取 Target 名
            if ($.type(item) == 'string') {
                el = me.find('.TFTemplate-' + item);
                mentor.Template.render(me.appName, el, me.find('.TFTarget-' + item), args);
                me.templateData[item] = args;
            }
            else if ($.isPlainObject(item)) {
                el = me.find('.TFTemplate-' + item.template);

                if ($.type(item.target) == 'string') {
                    mentor.Template.render(me.appName, el, me.find('.TFTarget-' + item.target), args);
                }
                else {
                    var targetElement = $(item.target);
                    var match = /TFTarget-(\S+)/.exec(targetElement.attr('class'));
                    var className;
                    if (match) {
                        className = match[1];
                        mentor.Template.render(me.appName, el, $(item.target), args);
                    }
                    else {
                        className = 'gen-' + TF.Helper.Utility.random();
                        $(item.target).addClass('TFTarget-' + className);
                        mentor.Template.render(me.appName, el, $(item.target), args);
                    }

                    item.target = className;
                }

                me.templateData[item.template] = args;
                me.templateData[item.target] = args;
            }
        });
    },

    // 取得渲染后的模板内容
    getRenderedTemplate: function(name, args) {
        var realName = name.split('.')[0];
        var el = this.find('.TFTemplate-' + realName);

        return mentor.Template.getRenderedText(this.appName, el, args || {}, name);
    },

    // 动态渲染模板，支持自动分页
    renderTemplate: function(name, args) {
        var me = this;

        if (!name) {
            return;
        }

        //{'template':'xxx', 'target':'xxxx'}
        if (!args) {
            args = {};
        }

        var url = this.getUrl(args.uri || TF.Helper.Utility.getDefaultDataUri(this.appName));

        name = $.makeArray(name);

        args.callback = function(result) {
            $.each(TF.Mentor._templateRenderAfter, function(){
                this.call(me, name, args);
            });

            if ($.isFunction(args.fn)) {
                args.fn.call(me.instance, result);
            }

            if (args.loadingMsg !== false) {
                me.unsetLoadingMsg();
            }
        };

        $.each(TF.Mentor._templateRenderBefore, function(){
            this.call(me, name, args);
        });

        var template = [], target = [], templateName = [], targetName = [];

        // 支持渲染一批模板
        $.each(name, function(index, item){
            if ($.type(item) == 'string') {
                template.push(me.find('.TFTemplate-' + item));
                target.push(me.find('.TFTarget-' + item));
                templateName.push(item);
                targetName.push(item);
            }
            else if ($.isPlainObject(item)) {
                template.push(me.find('.TFTemplate-' + item.template));

                if ($.type(item.target) == 'string') {
                    target.push(me.find('.TFTarget-' + item.target));
                }
                else {
                    var targetElement = $(item.target);
                    var className;
                    var match = /TFTarget-(\S+)/.exec(targetElement.attr('class'));
                    if (match) {
                        className = match[1];
                    }
                    else {
                        className = 'gen-' + TF.Helper.Utility.random();
                        targetElement.addClass('TFTarget-' + className);
                    }

                    item.target = className;
                    target.push(targetElement);
                }

                templateName.push(item.template);
                targetName.push(item.target);
            }
        });

        mix(args, {
            errorFunc: proxy(function(resultData){
                if (args.loadingMsg !== false) {
                    this.sys.unsetLoadingMsg();
                }
                this.RenderError(resultData);
            }, me.instance)
        });

        // ajax 模版渲染

//            if (url.indexOf("http://") < 0 && url.indexOf('/') != 0) {
//                url = TF.Helper.Utility.siteUrl(url);
//            }

        var requestName = $.map(name, function(item){
            if ($.isPlainObject(item)) {
                return $.param(item);
            }
            else {
                return item;
            }
        });

        var ajaxOptions = {
            url: url,
            type: 'GET',
            dataType: 'text',
            cache: false,
            xhrFields: {
                'withCredentials': true
            },
            complete: function(jqXHR, textStatus) {
                me.templateRequester.erase(requestName.join());

                if (args.loadingMsg !== false) {
                    me.unsetLoadingMsg();
                }
            },
            success: function(responseText, textStatus, jqXHR) {
                me.templateRequester.erase(requestName.join());

                // 输出调试信息
                if (TF.Config[me.appName].debug) {
                    var param = this.data && ($.type(this.data) == 'string' ? this.data : $.param(this.data));
                    typeof console === 'object' && console.debug('url: ' + this.url + (param ? '?' + param : ''));
                }

                var response = responseText;
                var result = null;

                try {
                    result = $.parseJSON(response);
                } catch (e) {}

                // 如果是空对象，则强制为 null
                if (result && $.isEmptyObject(result)) {
                    result = null;
                }

                // 数据过滤器，在这里可以进行一些显示前的处理。
                if (result && typeof(args) != 'undefined' && $.isFunction(args.filter)) {
                    var temp = args.filter.call(me.instance, result);

                    if ($.isPlainObject(temp)) {
                        mix(result, temp, true);
                    }
                }

                if (!result) {
                    // 清理
                    //ajax = null;
                    result = {};
                    //return;
                }

                // 如果有附加数据 addition，则添加到 result 对象中
                if (args.addition) {
                    mix(result, args.addition, true);
                }

                // 插入一些特殊系统对象
                mix(result, {
                    __TF: {}
                }, true);

                if (mentor.Ajax.validation(me.appName, result)) {
                    // 执行成功
                    $.each(template, function(i, t) {
                        result.__TF.template = templateName[i];
                        result.__TF.target = targetName[i];
                        mentor.Template.render(me.appName, t, target[i], result);
                    });

                    if (typeof(args) != 'undefined') {
                        args.callback(result);
                    }
                }
                else {
                    // 执行失败
                    if (typeof(args) != 'undefined') {
                        args.errorFunc(result);
                    }
                    else {
                        $.each(template, function(i, t){
                            result.__TF.template = templateName[i];
                            result.__TF.target = targetName[i];
                            $(target[i]).html(result.toString() || '');
                        });
                    }
                }

                $.each(template, function(i, t){
                    me.templateData[templateName[i]] = result;
                    me.templateData[targetName[i]] = result;
                });

                //ajax = null;
            }
        };
        mix(ajaxOptions, args, true);

        // 如果已经发送请求，则取消上一个请求
        var currentRequester = this.templateRequester.get(requestName.join());
        if (currentRequester) {
            currentRequester.abort();
        }

        if (args.loadingMsg !== false) {
            this.setLoadingMsg(args.loadingMsg);
        }

        currentRequester = $.ajax(ajaxOptions);

        this.templateRequester.set(name.join(), currentRequester);
    },

    // 显示组件
    show: function() {
        this.hidden = false;
        if (!this.rendered) {
            return;
        }
        this.topElement.show();
        this._setDefaultFocus();
    },

    // 在当前容器下只显示自己
    onlyShow: function() {
        this.hidden = false;

        if (!this.rendered) {
            return;
        }

        var el = this.topElement;
        var id;
        var comName;
        var me = this;
        if (el.length > 0) {
            id = el.attr('id');
            // 先隐藏除 name 所指定的组件外的其它组件
            el.parent().find('.TFComponent').each(function(index, comEl){
                comEl = $(comEl);
                if (id != comEl.attr('id')) {
                    comName = comEl.data('tf-component');

                    if (comName) {
                        me.parentComponentMgr.post(comName, 'component-hide');
                    }
                }
            });
        }

        this.show();
    },

    // 隐藏组件
    hide: function() {
        this.hidden = true;
        if (!this.rendered) {
            return;
        }
        this.topElement.hide();
    },

    isHidden: function() {
        return this.hidden;
    },

    isRendered: function() {
        return this.rendered;
    },

    createComponentMgr: function(callback) {
        return TF.Core.Application.createComponentMgrInstance(false, proxy(callback, this.instance));
    },

    cancelRequest: function() {
        this.sendRequester.each(function(index, item){
            if (item) {
                item.abort();
                //mentor.Status.unsetLoadingMsg(this.instance);
            }
        });
    },

    cancelRender: function() {
        if (this.loader) {
            this.loader.abort();
        }
    },

    destroy: function() {
        if (this.instance) {
            if (this.instance.DomDestroy(this.instance) === false) {
                return;
            }
        }

        // 从组件管理器中删除自己
        this.parentComponentMgr.remove(this.fullName);

        try {
            this.cancelRender();
            this.cancelRequest();

            // 清除表单验证对象
            //this.clearValidation();

            this._unsetTopElement();

            this.instance = null;
        }
        catch (e) {
        }
    },

    // 用于设置前进后退的 URI
    // args 是参数数组
    // name 是组件名，默认不写则是当前组件
    setRouterArgs: function(args, name) {
        var uri = [];
        uri.push(TF.Helper.Utility.toComponentUriName(name || this.fullName));
        args = $.makeArray(args);
        if (args.length > 0) {
            uri.push(args.filter(function(item){
                return item != '';
            }).join('/'));
        }

        this.lastArgs = args;

        // 组成一个可用的URI
        //appName:name/params

        TF.Core.Router.setUri(uri.join('/'));

        TF.Core.Application.publish('GlobalRoute', [uri.join('/'), [this.name, args]]);
    },

    // 验证组件表单
    validate: function(element) {
        var el = element ? $(element) : this.find('form.tf-validation');

        if (el.length > 0) {
            return mentor.Form.validation(this.appName, el);
        }
        else {
            return true;
        }
    }
};


TF.Component.Default = function(options) {
    this.options = {};
    mix(this.options, options, true);

    this.sys = {
        instance: this,
        // 此选项主要从加载器mix过来，以确定如何加载组件自身
        options: {},
        name: '', // 组件名称，小写字母
        rendered: false,
        refreshing: false,
        hidden: false,
        // send 请求实例
        sendRequester: new TF.Library.Hash(),
        // 模板请求实例
        templateRequester: new TF.Library.Hash(),
        templateData: {},
        // 组件索引值
        index: 0,
        // 组件最后获取的 URI 参数
        lastArgs: [],
        // 使用自定义标签引入组件时，标签子节点存储在这个属性中
        contentElement: null
    };
    mix(this.sys, componentSys);

    this.initialize(options);

    return this;
};
mix(TF.Component.Default.prototype, {
    initialize: function(options) {
        //this._isLoadingMsg = false;
    },

    InstanceReady: function() {
        // 实例准备就绪
    },

    DomReady: function() {
        // 组件中的 DOM 已经准备就绪
    },

    DomRefreshReady: function() {
        // 组件中的 DOM 已经刷新完毕并准备就绪
    },

    DomDestroy: function() {
        // 组件即将销毁
    },

    ComponentsReady: function() {
        // 子组件准备就绪
    },

    LoadError: function() {
        // 组件装载出错
        if (TF.Config[this.sys.appName].debug) {
            typeof console === 'object' && console.error('Component [' + this.sys.getComponentName() + '] load error! Please refresh!');
            //mentor.Status.setFailMsg(this.sys.appName, 'Component [' + this.sys.getComponentName() + '] load error! Please refresh!');
        }
    },

    // 默认渲染错误回调函数
    RenderError: function(result) {
        //window.location = '#';
        //mentor.Status.unsetLoadingMsg(this);
        //mentor.Status.setFailMsg(result.error, false, this);
    },

    on: function(eventName, callback) {
        return addEvent(this, eventName, callback);
    }
});

// 应用程序部分
var appReady = false;
var appSubscriptions = new TF.Library.Hash();
var defaultApplicationName = '';

TF.Core.Application = {
    // 创建应用
    create: function(name, config) {
        var appName = 'Transformers';
        var appConfig;

        if ($.type(name) == 'string') {
            appName = name;
            appConfig = config;
        }
        else {
            appConfig = name;
        }

        TF.Config[appName] = mix({}, defaultConfig, true);
        mix(TF.Config[appName], appConfig, true);

        // 首次创建的应用为默认应用
        if (!defaultApplicationName) {
            defaultApplicationName = appName;
        }
    },

    isReady: function() {
        return appReady;
    },

    // 订阅主题
    subscribe: function(name, fn, scope) {
        var key = TF.Helper.Utility.random();

        if (!appSubscriptions.has(name)) {
            appSubscriptions.set(name, new TF.Library.Hash());
        }

        appSubscriptions.get(name).set(key, {'fn': fn, 'scope': scope});

        // 返回 subscription 句柄
        return {'key': name, 'value': key};
    },

    // 取消订阅
    unsubscribe: function(handle) {
        if (handle && appSubscriptions.has(handle.key)) {
            appSubscriptions.get(handle.key).erase(handle.value);
        }
    },

    // 发布主题
    publish: function(name, args) {
        if (appSubscriptions.has(name)) {
            appSubscriptions.get(name).each(function(i, item) {
                if (item.fn) {
                    item.fn.apply(item.scope, args || []);
                }
            });
        }
    },

    // 自动加载页面中的组件
    bootstrap: function(element, componentMgr) {
        element = $(element).length > 0 ? $(element) : $('body');
        componentMgr = componentMgr || TF.Core.ComponentMgr;

        var components = element.find('*').filter(function(index, el){
            return el.tagName.toLowerCase().indexOf('tf:') === 0;
        });

        if (components.length > 0) {
            var args;
            var name;
            var attributes;
            var exclude = ['id', 'class', 'style'];

            components.each(function(index, el) {
                el = $(el);

                args = {};

                name = TF.Helper.Utility.toComponentName(el.prop('tagName').toLowerCase().slice(3));

                // 把自定义标签的内容存储成 Document Fragment
                var fragment;
                var fragmentElement = null;
                if (el.children().length > 0) {
                    fragment = document.createDocumentFragment();
                    fragment.appendChild($('<div></div>')[0]);
                    fragmentElement = fragment.childNodes[0];
                    fragmentElement.innerHTML = el.html();
                }

                attributes = $.makeArray(el[0].attributes);

                $.each(attributes, function(i, item){
                    if ($.inArray(item.name, exclude) < 0) {
                        args[$.camelCase(item.name)] = ((item.name == item.value || item.value === '') ? true : item.value);
                    }
                });

                args.name = name;
                args.replaceRender = true;
                args.renderTo = el;
                args.__element = fragmentElement;

                componentMgr.add(args);
            });
        }

        componentMgr.startLoad();
    }
};


// 创建组件
var defineComponentClass = function(data) {
    var superclass = TF.Component.Default;

    var component = function(){

        // 执行父类构造函数
        superclass.apply(this, arguments);

        // 从原型中拷贝普通变量到实例中
        for (var key in component.prototype) {
            if (component.prototype.hasOwnProperty(key)) {
                if ($.isPlainObject(component.prototype[key])) {
                    this[key] = {};
                    mix(this[key], component.prototype[key], true);
                }
            }
        }

        if ('initialize' in this) {
            this.initialize.apply(this, arguments);
        }
    };

    mix(component.prototype, data);

    var T = function(){};
    T.prototype = superclass.prototype;

    var cp = component.prototype;

    component.prototype = new T();

    //$super指向第一个父类，在构造器内可以通过arguments.callee.$super执行父类构造
    //多继承时，instance和$super只对第一个父类有效
    component.$super = superclass;

    //如果原始类型的prototype上有方法，先copy
    mix(component.prototype, cp, true);

    return component;
};


// ============================================================


// 制作组件管理器类
TF.Core.Application.createComponentMgrInstance = function(isGlobal, loadedCallback){
    var componentLength = 0,
        progressLength = 0,
        failureLength = 0,
        // 组件关联数组，key 为组件名，value 为组件实例
        components = new TF.Library.Hash(),
        // 事件订阅列表
        subscriptions = new TF.Library.Hash(),
        // 预装载关联数组，key 为组件名，value 为组件加载选项数组
        //preload =  new TF.Library.Hash(),
        // 是否正在使用进度条装载组件
        isLoading = false,
        // 组件别名关联数组
        componentAlias = new TF.Library.Hash();

    var getFullName = TF.Helper.Utility.getFullComponentName;

    var loadComplete = function(param) {
        var fullName = getFullName(param.fullName);

        if (param.instance == null) {
            $.error('Error: Component "' + fullName + '" load error! Please check Component Class Name or Define!');
        }

        var currentObj = components.get(fullName)[param.instance.options.__index || 0];

        currentObj.loaded = true;
        currentObj.instance = param.instance;

        progressLength++;

        if (progressLength >= componentLength) {
            completeProgress();
        }
    };

    var loadFailure = function(param) {
        loadComplete(param);
        failureLength++;
    };

    // 最终全部完成
    var completeProgress = function() {
        if (isGlobal) {
            // 广播一个全部组件加载完毕的消息
            TF.Core.Application.publish('GlobalComponentLoaded');
        }
        else {
            if ($.isFunction(loadedCallback)) {
                loadedCallback();
            }
        }
    };

    var renderComplete = function(param) {
        if (param.instance && !param.instance.options.lazyRender) {
            addEvent(param.instance, 'ready', loadComplete);
        }
        else {
            loadComplete(param);
        }
    };

    var loadFirstComplete = function(param) {
        loadComplete(param);

        var fullName = getFullName(param.fullName);

        $.each(components.get(fullName).slice(1), function(index, item) {
            item.options.__index = index + 1;
            var obj = new TF.Library.ComponentLoader(item.options, exports);
            addEvent(obj, 'instanced', loadComplete);
            addEvent(obj, 'failure', loadComplete);
            obj.load();
        });
    };

    var renderFirstComplete = function(param) {
        if (param.instance && !param.instance.options.lazyRender) {
            addEvent(param.instance, 'ready', loadComplete);
        }
        else {
            loadComplete(param);
        }

        var fullName = getFullName(param.fullName);

        $.each(components.get(fullName).slice(1), function(index, item) {
            item.options.__index = index + 1;
            var obj = new TF.Library.ComponentLoader(item.options, exports);
            addEvent(obj, 'instanced', renderComplete);
            addEvent(obj, 'failure', renderComplete);
            obj.load();
        });
    };

    // 解析组件名
    var parseName = function(name) {
        var match = /^([a-z0-9:]+)(?:\[([a-z0-9-_]+)\])?$/i.exec(name);
        var index = 0;

        if (match) {
            name = match[1];
            index = match[2];

            // 此处为了兼容 IE8 浏览器
            // 在 IE8 下 match[2] 为空字符串，而在 webkit 下是 undefined
            if (index === '') {
                index = undefined;
            }

            if (index !== undefined && isNaN(index)) {
                // 是别名
                if (!componentAlias.has(name + index)) {
                    throw 'Error: Component Alias "' + match[0] + '" not found!';
                }
                index = componentAlias.get(name + index);
            }
        }
        else {
            throw 'Error: Component name "' + name + '" invalid!';
        }

        // TODO: 如果使用的是别名，需要把别名转换为索引
        // 在添加组件的时候要设置好别名和索引的对应关系

        return {
            name: name,
            index: index
        };
    };

    var exports = {
        // 创建组件
        create: function(data) {
            return defineComponentClass(data);
        },

        // 注册组件
//            register: function(name) {
//                if (!components.has(name)) {
//                    components.set(name, []);
//                }
//            },

        // 启动组件装载进程，并行装载
        startLoad: function(withRender) {
            var me = this;

            if (isLoading) {
                return;
            }

            progressLength = 0;

            components.each(function(index, item) {
                if (item[0].async === true) {
                    return;
                }

                item[0].options.__index = 0;
                var obj = new TF.Library.ComponentLoader(item[0].options, me);
                if (item.length > 1) {
                    addEvent(obj, 'instanced', (withRender ? renderFirstComplete : loadFirstComplete));
                    addEvent(obj, 'failure', (withRender ? renderFirstComplete : loadFirstComplete));
                }
                else {
                    addEvent(obj, 'instanced', (withRender ? renderComplete : loadComplete));
                    addEvent(obj, 'failure', (withRender ? renderComplete : loadFailure));
                }
                obj.load();
            });
        },

        // 是否还在装载中
        isLoading: function() {
            return isLoading;
        },

        // 添加组件到预装载队列，等候装载
        add: function(options, defaultOptions) {
            if (isLoading) {
                return;
            }

            options = $.makeArray(options);

            defaultOptions = defaultOptions || {};

            var op, name, async, com;

            $.each(options, function(index, item){
                // 合并默认选项
                if ($.type(item) == 'string') {
                    op = {name: item};
                }
                else {
                    op = item;
                }
                mix(op, defaultOptions);

                name = getFullName(op.name);
                async = (op.async === true);
                com = {
                    options: op,
                    instance: null,
                    loaded: false,
                    async: async,
                    // 后台某组件最后收到的消息，value 为消息体（消息名+消息参数的数组）
                    message: null
                };

                if (!async) {
                    componentLength++;
                }

                if (components.has(name)) {
                    // 组件已存在
                    components.get(name).push(com);
                }
                else {
                    components.set(name, [com]);
                }

                // 保存别名
                if (op.alias) {
                    if (componentAlias.has(name + op.alias)) {
                        $.error('Error: Component alias "' + name + '[' + op.alias + ']" duplicate definition!');
                    }
                    componentAlias.set(name + op.alias, components.get(name).length - 1);
                }

            });

            return this;
        },

        // 装载某个后台组件
        loadBgComponent: function(com) {
            var fn = proxy(function(param) {
                var fullName = getFullName(param.fullName);

                if (param.instance == null) {
                    $.error('Error: Component "' + fullName + '" load error! Please check Component Class Name or Define!');
                }

                var currentObj = components.get(fullName)[param.instance.options.__index || 0];

                currentObj.loaded = true;
                currentObj.instance = param.instance;

                if (currentObj.message) {
                    currentObj.instance.sys.postMessage(currentObj.message[0], currentObj.message[1]);
                    currentObj.message = null;
                }
            }, this);

            // 加载组件
            var obj = new TF.Library.ComponentLoader(com.options, this);
            addEvent(obj, 'instanced', fn);
            obj.load();
        },

        // 删除组件
        remove: function(name) {
            name = getFullName(name);

            var obj = parseName(name);

            if (obj.index === undefined) {
                components.erase(obj.name);
            }
            else {
                var com = components.get(obj.name)[obj.index];
                if (com) {
                    com.instance = null;
                    com.loaded = false;
                }
            }
        },

        // 投递事件给具体的实例
        post: function(name, msg, args) {
            var nameObj, com;
            var me = this;

            name = $.makeArray(name);

            $.each(name, function(index, item) {
                item = getFullName(item);

                // 处理事件订阅
                me.publish(item, msg, args);

                nameObj = parseName(item);

                if (nameObj.index === undefined) {
                    // 当前名字下的所有组件
                    com = components.get(nameObj.name);

                    if (com) {
                        // 传递给组件
                        $.each(com, function() {
                            if (this.loaded) {
                                this.instance.sys.postMessage(msg, args);
                            }
                            else {
                                // 没进行预加载的组件全部认为是异步加载
                                this.message = [msg, args];
                                me.loadBgComponent(this);
                            }
                        });
                    }
                }
                else {
                    // 当前名字下的第 index 个组件
                    com = components.get(nameObj.name)[nameObj.index];

                    if (com && com.loaded) {
                        // 传递给组件
                        com.instance.sys.postMessage(msg, args);
                    }
                    else {
                        com.message = [msg, args];
                        me.loadBgComponent(com);
                    }
                }
            });
        },

        // 显示当前容器中 name 所指定的组件，并且隐藏此容器中其它组件
        show: function(name) {
            name = getFullName(name);
            this.post(name, 'component-only-show');
        },

        has: function(name) {
            name = getFullName(name);
            var nameObj = parseName(name);
            return components.has(nameObj.name);
        },

        // 取某个名字下的组件实例个数
        length: function(name) {
            name = getFullName(name);
            var nameObj = parseName(name);
            if (components.has(nameObj.name)) {
                return components.get(nameObj.name).length;
            }
            else {
                return 0;
            }
        },

        // 以某个函数订阅某个组件的消息
        subscribe: function(name, msg, fn, scope) {
            name = getFullName(name);
            var nameObj = parseName(name);

            name = nameObj.name + (nameObj.index === undefined ? '' : '[' + nameObj.index + ']');

            var func = proxy(fn, scope || fn);
            if (subscriptions.has(name + msg)) {
                // 已存在的组件订阅
                subscriptions.get(name + msg).push(func);
            }
            else {
                subscriptions.set(name + msg, [func]);
            }

            // 返回 subscription 句柄
            return {'key': name + msg, 'value': func};
        },

        // 取消订阅
        unsubscribe: function(handle) {
            if (subscriptions.has(handle.key)) {
                subscriptions.get(handle.key).erase(handle.value);
            }
        },

        // 发布消息
        publish: function(name, msg, args) {
            name = getFullName(name);
            var nameObj = parseName(name);
            var loaded = false;

            name = nameObj.name + (nameObj.index === undefined ? '' : '[' + nameObj.index + ']');

            var com = components.get(nameObj.name);

            // 检查组件是否已加载
            if (nameObj.index === undefined) {
                // 当前名字下的所有组件
                if (com) {
                    // 判断至少有一个组件已加载
                    $.each(com, function(index, value){
                        if (value.loaded) {
                            loaded = true;
                            return false;
                        }
                    });

                    if (loaded && subscriptions.has(name + msg)) {
                        $.each(subscriptions.get(name + msg), function(i, func) {
                            // 谁作为 this 需要考虑下
                            func.apply(func, [args, msg]);
                        });
                    }
                }
            }
            else {
                // 当前名字下的第 index 个组件
                if (com && com[nameObj.index] && com[nameObj.index].loaded) {
                    if (subscriptions.has(name + msg)) {
                        $.each(subscriptions.get(name + msg), function(i, func) {
                            // 谁作为 this 需要考虑下
                            func.apply(func, [args, msg]);
                        });
                    }

                    if (subscriptions.has(nameObj.name + msg)) {
                        $.each(subscriptions.get(nameObj.name + msg), function(i, func) {
                            // 谁作为 this 需要考虑下
                            func.apply(func, [args, msg]);
                        });
                    }
                }
            }
        },

        // 获取一个组件实例的代理，只可以调用组件 Action 方法
        // TODO: 目前只支持每个组件名一个实例，未来需要考虑同一个组件加载多次的需求
        getAgent: function(name) {
            name = getFullName(name);
            var nameObj = parseName(name);

            var agentObject;
            var agentExportObject;
            var match;
            var funcName;
            var com;

            com = components.get(nameObj.name);

            if (!com) {
                return null;
            }

            var agentFunc = function(actionName) {
                return function() {
                    //console.log(this.__instance);
                    return this.__instance.sys.postMessage(decamelize(actionName), arguments[0]);
                    //return this.__instance[actionName + 'Action'].apply(this.__instance, arguments);
                };
            };

            if (nameObj.index === undefined) {
                // 返回数组
                agentExportObject = [];

                $.each(com, function(index, item){
                    if (!item.loaded) {
                        return;
                    }

                    agentObject = {};

                    mix(agentObject, {
                        __instance: item.instance
                    });

                    for (var x in item.instance) {
                        if ($.isFunction(item.instance[x])) {
                            match = /^(.+?)Action$/.exec(x);
                            if (match) {
                                funcName = $.trim(match[1]);
                                agentObject[funcName] = agentFunc(funcName);
                            }
                        }
                    }

                    agentExportObject.push(agentObject);

                });
            }
            else {
                if (com[nameObj.index] && com[nameObj.index].loaded) {
                    agentObject = com[nameObj.index].instance;
                    agentExportObject = {};

                    mix(agentExportObject, {
                        __instance: agentObject
                    });

                    for (var x in agentObject) {
                        if ($.isFunction(agentObject[x])) {
                            match = /^(.+?)Action$/.exec(x);
                            if (match) {
                                funcName = $.trim(match[1]);
                                agentExportObject[funcName] = agentFunc(funcName);
                            }
                        }
                    }
                }
                else {
                    agentExportObject = null;
                }
            }

            return agentExportObject;
        }
    };

    return exports;
};

// 全局组件管理器（单例模式）
TF.Core.ComponentMgr = TF.Core.Application.createComponentMgrInstance(true);



// URI 路由部分
TF.Core.Router = (function() {
    var defaultName = 'Home';

    var locationHash = new TF.Library.LocationHash();

    // 额外的路由规则，不会影响系统既有路由规则
    var additionRouter = [];

    var parse = function(hash) {
        var bits = hash.match(/tf-([^\/]*)\/?(.*)/);
        var name, params;

        if (bits) {
            name = bits[1] ? TF.Helper.Utility.toComponentName(bits[1]) : defaultName;

            params = bits[2] ? bits[2].split('/') : [];
        }
        else {
            name = defaultName;
            params = [];
        }

        return {
            name: name,
            params: params,
            uri: exports.makeUri(name, params)
        };
    };

    var callback = function(hash){
        var result = parse(hash),
            name = result.name,
            params = result.params;

        var fullName = name;

        // 系统默认路由
        if (TF.Core.ComponentMgr.has(fullName)) {
            TF.Core.Application.publish('GlobalRoute', [result.uri, [name, params]]);
            TF.Core.ComponentMgr.post(fullName, 'component-route', params);
        }
        else {
            // 非法参数
            typeof console === 'object' && console.error(TF.Helper.Utility.toComponentUriName(name) + ' uri error!');
        }

        // 额外路由
        var reg, isMatch = false;
        $.each(additionRouter, function(index, item) {
            $.map(item, function(value, key){
                key = key.replace(/:num/gi, '[0-9]+');
                key = key.replace(/:any/gi, '.*');

                reg = new RegExp('^' + key + '$');
                if (result.uri.match(reg)) {
                    if (value.indexOf('$') >= 0 && key.indexOf('(') >= 0) {
                        value = result.uri.replace(reg, value);
                    }
                    isMatch = true;
                    // 匹配上
                    if (TF.Core.ComponentMgr.has(value)) {
                        TF.Core.Application.publish('GlobalRoute', [result.uri, [name, params]]);
                        TF.Core.ComponentMgr.post(value, 'component-route', params);
                    }
                }
            });
        });

    };

    var exports = {
        create: function(name, router) {
            additionRouter = router || additionRouter;
            defaultName = name || defaultName;

            TF.Core.Application.subscribe('GlobalComponentLoaded', function(){
                addEvent(locationHash, 'hashChanged', function(param){
                    callback(param.hash);
                });
                locationHash.start();
            });
        },

        // 解析 hash 中的字符串，取得里面的信息
        parseUri: function(uri) {
            return parse(uri || locationHash.getHash());
        },

        makeUri: function(name, params) {
            name = name || '';
            params = params || [];

            name = TF.Helper.Utility.toComponentUriName(name);
            params = params.join('/');

            var result = name;

            if (params) {
                result += '/' + decodeURI(params);
            }

            return result;
        },

        go: function(uri, url, isReload) {
            if (url) {
                if (isReload && location.pathname == url && location.hash == '#tf-' + encodeURI(uri)) {
                    location.reload();
                }
                else {
                    location.href = url + '#tf-' + encodeURI(uri);
                }
            }
            else if (locationHash) {
                locationHash.setHash('tf-' + uri);
            }
        },

        setUri: function(uri) {
            if (locationHash) {
                locationHash.setHash('tf-' + uri, true);
            }
        },

        getUri: function(name) {
            return 'tf-' + this.makeUri(name);
        }
    };

    return exports;
})();


TF.define = function(name, options) {
    var appName;

    if ($.type(name) == 'string') {
        appName = TF.Helper.Utility.getApplicationName(name);
        name = TF.Helper.Utility.getComponentName(name);

        TF.Component[appName] = TF.Component[appName] || {};

        TF.Component[appName][name] = defineComponentClass(options);

        return TF.Component[appName][name];
    }
    else {
        return defineComponentClass(name);
    }
};

$(document).ready(function(){
    appReady = true;
    TF.Core.Application.publish('DomReady');
    // 执行页面默认的装载完成函数
    if (TF.ready != undefined) {
        TF.ready();
    }
});


return TF;

}));