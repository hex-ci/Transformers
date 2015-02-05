
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
namespace('Component', TF);
namespace('Config', TF);
namespace('Library', TF);
namespace('Helper', TF);
