
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
    var isfun = $.isFunction;

    var exports = {
        render: function(appName, text, opts) {
            var mt = TF.Config[appName].mentor;
            if (mt.Template && isfun(mt.Template.render)){
                return mt.Template.render.apply(mt.Template, [].slice.call(arguments, 1));
            }
            else {
                return TF.Helper.Utility.template(text, opts);
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
