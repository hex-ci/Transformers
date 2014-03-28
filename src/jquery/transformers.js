/*
*
* Transformers for jQuery
*
* 为 jQuery 实现一套组件化开发模式与框架
*
*/

/**
 * 声明 Transformers 包
 * @author: Hex
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

    var TF,
        Transformers = TF = Transformers || {
        'version': '1.2.0',
        'build': '20140324'
    };

    var proxy = $.proxy;
    var extend = $.extend;

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
        return new Function("opts", "return (" + s + ");")(opts);
    };

    (function(){
        var rCRLF = /\r?\n/g,
            manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
            rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
            rsubmittable = /^(?:input|select|textarea|keygen)/i;

        $.fn.extend({
            serialize: function(options) {
                return jQuery.param( this.serializeArray(options) );
            },
            serializeArray: function(options) {
                options = options || {};

                return this.map(function(){
                    // Can add propHook for "elements" to filter or add form elements
                    var elements = jQuery.prop( this, "elements" );
                    return elements ? jQuery.makeArray( elements ) : this;
                })
                .filter(function(){
                    var type = this.type;
                    // Use .is(":disabled") so that fieldset[disabled] works
                    return this.name && (!jQuery( this ).is( ":disabled" ) || (this.nodeName.toLowerCase() == 'select' && options.withDisabledSelect) ) &&
                        rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
                        ( this.checked || !manipulation_rcheckableType.test( type ) );
                })
                .map(function( i, elem ){
                    var val = jQuery( this ).val();

                    return val == null ?
                        null :
                        jQuery.isArray( val ) ?
                            jQuery.map( val, function( val ){
                                return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
                            }) :
                            { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
                }).get();
            }
        });
    })();




    // 创建名字空间
    namespace('Core', TF);
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
    mentor.Status = function(){
        var isfun = $.isFunction;
        var cfg = TF.Config;

        var exports = {
            unsetStatusMsg: function(appName) {
                var mt = cfg[appName].mentor;

                if (mt.Status && isfun(mt.Status.unsetStatusMsg)){
                    mt.Status.unsetStatusMsg.apply(mt.Status, [].slice.call(arguments, 1));
                }
            },

            setSuccMsg: function(appName){
                var mt = cfg[appName].mentor;

                if (mt.Status && isfun(mt.Status.setSuccMsg)){
                    mt.Status.setSuccMsg.apply(mt.Status, [].slice.call(arguments, 1));
                }
            },

            setFailMsg: function(appName){
                if (!cfg[appName]) {
                    appName = defaultApplicationName;
                }

                var mt = cfg[appName].mentor;

                if (mt.Status && isfun(mt.Status.setFailMsg)){
                    mt.Status.setFailMsg.apply(mt.Status, [].slice.call(arguments, 1));
                }
            },

            setWarningMsg: function(appName){
                var mt = cfg[appName].mentor;

                if (mt.Status && isfun(mt.Status.setWarningMsg)){
                    mt.Status.setWarningMsg.apply(mt.Status, [].slice.call(arguments, 1));
                }
            },

            setLoadingMsg: function(appName) {
                var mt = cfg[appName].mentor;

                if (mt.Status && isfun(mt.Status.setLoadingMsg)){
                    mt.Status.setLoadingMsg.apply(mt.Status, [].slice.call(arguments, 1));
                }
            },

            unsetLoadingMsg: function(appName) {
                var mt = cfg[appName].mentor;

                if (mt.Status && isfun(mt.Status.unsetLoadingMsg)){
                    mt.Status.unsetLoadingMsg.apply(mt.Status, [].slice.call(arguments, 1));
                }
            }
        };

        return exports;
    }();


    // 模板渲染相关的方法
    mentor.Template = function(){
        var isfun = $.isFunction;

        var exports = {
            render: function(appName, text, opts) {
                var mt = TF.Config[appName].mentor;
                if (mt.Template && isfun(mt.Template.render)){
                    return mt.Template.render.apply(mt.Template, [].slice.call(arguments, 1));
                }
                else {
                    return text.tmpl(text, opts);
                }
            }
        };

        return exports;
    }();


    // Ajax 相关的一些方法，目前主要是接口调用是否成功的验证
    mentor.Ajax = function(){
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
    }();



    // mix 升级版，支持多级 mix
    var merge = function(des, src, override) {
        if (ObjectH.isArray(src)) {
            for (var i = 0, len = src.length; i < len; i++) {
                merge(des, src[i], override);
            }
            return des;
        }
        if (typeof override == 'function') {
            for (i in src) {
                des[i] = override(des[i], src[i], i);
            }
        }
        else {
            for (i in src) {
                //这里要加一个des[i]，是因为要照顾一些不可枚举的属性
                if (ObjectH.isPlainObject(des[i])) {
                    des[i] = merge(des[i], src[i], override);
                }
                else if (override || !(des[i] || (i in des))) {
                    des[i] = src[i];
                }
            }
        }
        return des;
    };



    // 一些工具类

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

            return appName.capitalize();
        },

        getComponentUrl: function(appName, uri, name) {
            var cfg = TF.Config[appName];

            // 通过 Application Name 得到相应的配置信息
            var pattern = cfg.dataUriPattern;
            var names = TF.Helper.Utility.splitComponentName(name);

            var str = pattern.tmpl({
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
            var str = pattern.tmpl({
                name: names
            });

            return cfg.baseUrl + str;
        },

        getComponentJsUrl: function(appName, name) {
            var cfg = TF.Config[appName];

            // 通过 Application Name 得到相应的配置信息
            var pattern = cfg.jsUriPattern;
            var names = TF.Helper.Utility.splitComponentName(name);

            var str = pattern.tmpl({
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

                return appName.capitalize() + ':' + name.camelize().capitalize();
            }
            else {
                return uriName.camelize().capitalize();
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
        }
    };


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
                    return key
                }
            }
            return null;
        },

        hasValue: function(value){
            return (this.keyOf(value) !== null);
        },

        forEach: function(fn, scope){
            Object.map(this.data, fn, scope);

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
            Object.map(this.data, function(key, value){
                delete this.data[key];
            }, this);

            return this;
        },

        include: function(key, value){
            if (this.data[key] != undefined) {
                this.data[key] = value;
            }

            return this;
        },

        getKeys: function(){
            return Object.keys(this.data);
        },

        getValues: function(){
            return Object.values(this.data);
        },

        toQueryString: function(){
            var s = [];
            for( var p in this.data ){
                if(this.data[p]==null) continue;
                if(this.data[p] instanceof Array)
                {
                    for (var i=0;i<this.data[p].length;i++) s.push( encodeURIComponent(p) + '[]=' + encodeURIComponent(this.data[p][i]));
                }
                else
                    s.push( encodeURIComponent(p) + '=' + encodeURIComponent(this.data[p]));
            }
            return s.join('&');
        }
    });


    // URI hash 管理，主要就是实现 hashchange 事件
    TF.Library.LocationHash = function(options) {
        this.options = {
            blank_page: 'javascript:0',
            start: false
        };
        this.prefix = '#';
        this.iframe = null;
        this.handle = false;
        this.useIframe = (Browser.ie && (typeof(document.documentMode)=='undefined' || document.documentMode < 8));
        this.state = null;
        this.supports = (('onhashchange' in window) && (typeof(document.documentMode) == 'undefined' || document.documentMode > 7));
        this.noFireOnce = false;

        mix(this.options, options, true);

        CustEvent.createEvents(this, ['hashChanged']);

        this.initialize();

        return this;
    };
    mix(TF.Library.LocationHash.prototype, {
        initialize: function(){
            var self = this;

            // Disable Opera's fast back/forward navigation mode
            if (Browser.opera && window.history.navigationMode) {
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
                    self.fire('hashChanged', {hash: self.getHash()});
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
            this.iframe = W(Dom.createElement('iframe', {
                src: this.options.blank_page
            })).css({
                'position'  : 'absolute',
                'top'       : 0,
                'left'      : 0,
                'width'     : '1px',
                'height'    : '1px',
                'visibility': 'hidden'
            }).appendTo(W('body')[0])[0];

            this.istate = null;

            doc = (this.iframe.contentDocument) ? this.iframe.contentDocument  : this.iframe.contentWindow.document;
            doc.open();
            doc.write('<html><head><title>' + document.title + '</title></head><body id="state">' + hash + '</body></html>');
            doc.close();
            this.istateOld = false;
        },

        checkHash: function(){
            var state = this.getState();
            if (this.state == state) return;
            if (Browser.ie && (this.state !== null)) {
                this.setState(state, true);
            }
            else {
                this.state = state;
            }

            this.fire('hashChanged', {hash: state});
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

            this.fire('hashChanged', {hash: hash});
        },

        pick: function() {
            for (var i = 0, l = arguments.length; i < l; i++){
                if (arguments[i] != undefined) return arguments[i];
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

            if (Browser.ie && (!fix || this.istateOld)) {
                if (!this.iframe) {
                    this.iframe = W(Dom.createElement('iframe', {
                        src: this.options.blank_page
                    })).css({
                        'position'  : 'absolute',
                        'top'       : 0,
                        'left'      : 0,
                        'width'     : '1px',
                        'height'    : '1px',
                        'visibility': 'hidden'
                    }).appendTo(document.body)[0];

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
                this.fire('hashChanged', {hash: this.getHash()});
                return;
            }

            this.handle = setInterval(proxy(this.checkHash, this), 200);
            this.started = true;

            return this;
        },

        stop: function() {
            this.clear(this.handle);
        }
    });


    // 应用程序部分
    var appReady = false;
    var appSubscriptions = new TF.Library.Hash();
    var defaultApplicationName = '';

    TF.Core.Application = {
        create: function(name, config) {
            var appName = 'Transformers';
            var appConfig;

            if (Object.isString(name)) {
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
                appSubscriptions.get(name).forEach(function(item, i) {
                    if (item.fn) {
                        item.fn.apply(item.scope, args || []);
                    }
                }, this);
            }
        },

        // 自动加载页面中的组件
        bootstrap: function(element, componentMgr) {
            element = W(element) || W('body');
            componentMgr = componentMgr || TF.Core.ComponentMgr

            var components = element.query('*').filter(function(el){
                return el.tagName.toLowerCase().indexOf('tf:') === 0;
            });

            //console.log(components);
            if (components.length > 0) {
                var args;
                var name;
                var attributes;
                var exclude = ['id', 'class', 'style'];

                components.forEach(function(el){
                    el = W(el);

                    args = {};

                    name = TF.Helper.Utility.toComponentName(el.attr('tagName').toLowerCase().slice(3));

                    //console.log(el[0].attributes);
                    attributes = $.makeArray(el[0].attributes);
                    //console.log(attributes);

                    attributes.forEach(function(item){
                        if (!exclude.contains(item.name)) {
                            args[item.name.camelize()] = ((item.name == item.value || item.value === '') ? true : item.value);
                        }
                    });

                    //console.log(args);
                    args.name = name;
                    args.replaceRender = true;
                    args.renderTo = el;

                    componentMgr.add(args);
                });
            }

            componentMgr.startLoad();
        }
    };


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

        CustEvent.createEvents(this, ['instanced', 'complete', 'failure']);

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

        load: function() {
            this._preload();
        },

        _preload: function() {
            // Application Name 不存在则创建
            TF.Component[this.appName] = TF.Component[this.appName] || {};

            var isLoad = (typeof TF.Component[this.appName][this.name] != 'undefined');
            if (isLoad) {
                this._createInstance();
            }
            else {
                $.getScript(TF.Helper.Utility.getComponentJsUrl(this.appName, this.name), proxy(function(){
                    if (typeof TF.Component[this.appName][this.name] != 'undefined') {
                        // 加载成功
                        this._createInstance();
                    }
                    else {
                        // 加载失败
                        // 应该返回错误，或者记录日志
                        this._failure();
                    }
                }, this));
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
            var appName
            var name;

            if (fullName) {
                appName = TF.Helper.Utility.getApplicationName(fullName);
                name = TF.Helper.Utility.getComponentName(fullName);

                var isLoad = (typeof TF.Component[appName][name] != 'undefined');

                if (isLoad) {
                    mentor = TF.Component[appName][name].prototype.Mentor;
                    if (mentor && mentor.name) {
                        me._loadMentor(function(){
                            me._initMentor(fullName, parentClass, TF.Component[appName][name]);
                            callback.call();
                        }, mentor.name, TF.Component[appName][name]);
                    }
                    else {
                        me._initMentor(fullName, parentClass, TF.Component[appName][name]);
                        callback.call();
                    }
                }
                else {
                    $.getScript(TF.Helper.Utility.getComponentJsUrl(appName, name), function(){
                        if (typeof TF.Component[appName][name] != 'undefined') {
                            // 加载成功
                            mentor = TF.Component[appName][name].prototype.Mentor;
                            if (mentor && mentor.name) {
                                me._loadMentor(function(){
                                    me._initMentor(fullName, parentClass, TF.Component[appName][name]);
                                    callback.call();
                                }, mentor.name, TF.Component[appName][name]);
                            }
                            else {
                                me._initMentor(name, parentClass, TF.Component[appName][name]);
                                callback.call();
                            }
                        }
                        else {
                            // TODO: 要抛一个异常，表示依赖加载失败，或者是触发一个加载失败的事件
                        }
                    });
                }

            }
            else {
                if (this._instance.Mentor) {
                    this._loadMentor(callback, this._instance.Mentor.name);
                }
                else {
                    callback.call();
                }
            }
        },

        _initMentor: function(fullName, componentClass, mentorClass) {
            var me = this;

            componentClass = componentClass || this._instance;

            if (Object.isFunction(componentClass)) {
                mix(componentClass.prototype, mentorClass.prototype, function(des, src, key){
                    if (key == 'Mentor' || componentClass.prototype.hasOwnProperty(key)) {
                        return des;
                    }
                    else {
                        return src;
                    }
                });

                // 设置是否使用借用组件的视图
                if (componentClass.prototype.Mentor.useMentorView) {
                    componentClass.prototype.Mentor.useMentorView = false;
                    componentClass.prototype.Mentor.useView = fullName;
                }
                else if (componentClass.prototype.Mentor.useView) {
                    componentClass.prototype.Mentor.useView = mentorClass.prototype.Mentor.useView;
                }

                if (mentorClass.prototype.Mentor) {
                    mix(componentClass.prototype.Mentor.viewData, mentorClass.prototype.Mentor.viewData, true);

                    if (mentorClass.prototype.Mentor.__path) {
                        componentClass.prototype.Mentor.__path = mentorClass.prototype.Mentor.__path;
                    }
                    else {
                        componentClass.prototype.Mentor.__path = [];
                    }
                }
                else {
                    componentClass.prototype.Mentor.__path = [];
                }

                componentClass.prototype.Mentor.__path.push(fullName);
            }
            else {
                // 把最后一级的父类方法转换一下放入当前实例
                // 前提是子类重载了父类的方法
                for (var i in mentorClass.prototype) {
                    if (mentorClass.prototype.hasOwnProperty(i) && Object.isFunction(mentorClass.prototype[i]) && Object.isFunction(this._instance[i])) {
                        this._instance['__parent__' + i] = mentorClass.prototype[i];
                    }
                }

                mix(this._instance, mentorClass.prototype, function(des, src, key){
                    if (key == 'Mentor' || TF.Component[me.appName][me.name].prototype.hasOwnProperty(key)) {
                        return des;
                    }
                    else {
                        return src;
                    }
                });

                // 设置是否使用借用组件的视图
                if (this._instance.Mentor.useMentorView) {
                    if (mentorClass.prototype.Mentor && mentorClass.prototype.Mentor.useView) {
                        this._instance.sys.viewName = mentorClass.prototype.Mentor.useView;
                    }
                    else {
                        this._instance.sys.viewName = fullName;
                    }
                }
                else if (this._instance.Mentor.useView) {
                    this._instance.sys.viewName = this._instance.Mentor.useView;
                }

                if (mentorClass.prototype.Mentor && mentorClass.prototype.Mentor.__path) {
                    this._instance.Mentor.__path = mentorClass.prototype.Mentor.__path;
                    this._instance.Mentor.__path.push(fullName);
                }
                else {
                    this._instance.Mentor.__path = [fullName];
                }

                this._instance.sys.options.data = this._instance.sys.options.data || {};
                mix(this._instance.sys.options.data, this._instance.Mentor.viewData, true);
            }

        },

        _initInstance: function(mentorClass) {
            // 组件实例化正确才加载内容
            this._instanced = true;

            // 把加载器的配置传递到组件实例的sys空间里
            mix(this._instance.sys.options, this.options, function(des, src, key){
                if (key == 'data') {
                    if (Object.isPlainObject(src)) {
                        if (!des) {
                            des = {};
                        }
                        return mix(des, src, true);
                    }
                    else if (Object.isString(src)) {
                        if (!des) {
                            des = {};
                        }
                        return mix(des, src.queryUrl(), true);
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
            // 组件需要知道自己的父级组件管理器是谁
            this._instance.sys.parentComponentMgr = this.componentMgrInstance;

            // 实例准备就绪
            this._instance.InstanceReady(this);

            //this.componentMgrInstance.loaded(this.fullName, this._instance);

            this.fire('instanced', {instance: this._instance, fullName: this.fullName, name: this.name, appName: this.appName});

            // 看是否是延迟渲染
            if (!this.options.lazyRender) {
                this._instance.sys.render();
            }

            this.fire('complete', {instance: this._instance, fullName: this.fullName, name: this.name, appName: this.appName});
        },

        _failure: function() {
            this.fire('failure', {instance: null, fullName: this.fullName, name: this.name, appName: this.appName});
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
            var funcName = msg.camelize();

            // 传递处理过的参数给 Action
            var filteredArgs = args;
            switch (msg) {
                case 'component-route':
                    filteredArgs = this._filterRouterArgs(args);
                    break;
            }

            if (this.instance && Object.isFunction(this.instance[funcName + 'ActionBefore'])) {
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
            if (this.instance && Object.isFunction(this.instance[funcName + 'Action'])) {
                returnValue = this.instance[funcName + 'Action'].call(this.instance, filteredArgs, args);
            }

            this.parentComponentMgr.publish(this.name + '[' + this.index + ']', msg, args);

            return returnValue;
        },

        // 系统路由处理函数
        route: function(args) {
            var notRefresh = false;

//            if (JSON.stringify(this.lastArgs) !== JSON.stringify(args)) {
//                this.lastArgs = args;
//                notRefresh = false;
//            }

            // 如果现在路由到其他组件了，则不显示组件
            if (TF.Helper.Utility.getFullComponentName(TF.Core.Router.parseUri().name) == TF.Helper.Utility.getFullComponentName(this.fullName)) {
                this.postMessage('component-only-show');
            }

            if (this.layoutType == 'normal') {
                if (args) {
                    // 传递页数给 fn 函数
                    this.layoutData.page = this.getUriPage(args);
                }
                else {
                    this.layoutData.page = 0;
                }

                this.renderNormalLayout(false, null, notRefresh);
            }
            else if (this.layoutType == 'tab') {
                if (args) {
                    var index = this.layoutData.tabs.get(this.getUriTab(args)) || 0;

                    this.layoutData.items[index].page = this.getUriPage(args);

                    this.layoutData.tab.switchTo(index);
                }
                else {
                    this.layoutData.items[0].page = 0;
                    this.layoutData.tab.switchTo(0);
                }

                this.renderTabLayout(false, null, notRefresh);
            }
            else {
            }
        },

        _filterRouterArgs: function(args) {
            if (this.layoutType == 'normal') {
                // 取最后一个参数，测试是否为页数
                var pager = args[args.length - 1] || '';
                if ((/p\d+/).test(pager)) {
                    return args.slice(0, -1);
                }
                else {
                    return args.slice(0);
                }
            }
            else if (this.layoutType == 'tab') {
                var newArgs

                // 取最后一个参数，测试是否为页数
                var pager = args[args.length - 1] || '';
                if ((/p\d+/).test(pager)) {
                    newArgs = args.slice(0, -1);
                }
                else {
                    newArgs = args.slice(0);
                }

                // 取第一个参数，测试是否为tab名
                var tab = newArgs[0] || '';
                if ((/tab-.+/).test(tab)) {
                    return newArgs.slice(1);
                }
                else {
                    return newArgs.slice(0);
                }
            }
            else {
                return args;
            }

        },

        // 渲染组件
        render: function() {
            if (this.rendering) {
                return;
            }

            this.rendering = true;

            if (!this.instance || this.rendered) {
                return;
            }
            if (this.options.applyTo) {
                //直接渲染
                this._loadComplete($(this.options.applyTo));
            }
            else if (this.options.contentEl) {
                //直接渲染
                this._loadComplete($(this.options.contentEl).clone());
            }
            else {
                this._loadContent();
            }
        },

        // 刷新组件内容
        refresh: function(data) {
            if (!this.rendered) return;

            if (Object.isObject(data)) {
                this.options.data = data;
                this.loader.data = data;
            }

            this.refreshing = true;
            this._loadContent();
        },

        // 装载组件模板
        _loadContent: function() {
            if (this.options.url == '') {
                this.options.url = (this.viewName ?
                                    TF.Helper.Utility.getComponentViewUrl(TF.Helper.Utility.getApplicationName(this.viewName),
                                    TF.Helper.Utility.getComponentName(this.viewName)) : TF.Helper.Utility.getComponentViewUrl(this.appName, this.name));
            }
            else if (this.options.url.indexOf("http:/"+"/") < 0) {
                this.options.url = TF.Helper.Utility.siteUrl(this.appName, this.options.url);
            }

            if (!this.options.hasCache) {
                this.options.data = this.options.data || {};
                this.options.data['_reqno'] = TF.Helper.Utility.random();
            }

            this.loader = $.ajax(this.options.url, {
                data: this.options.data,
                type: 'GET',
                timeout: 10000,
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
            // 如果是取消的请求，则什么也不做，我们只关心真正请求回来的数据，而不关心请求的状态
            if (jqXHR && jqXHR.statusText == 'canceled') {
                return;
            }

            if (!this.instance) {
                return;
            }

            var response, responseTree;

            response = responseText;

            if (Object.isString(response)) {
                // 解决 IE 下 innerHTML 不能直接设置 script 的问题
                if ((/msie/ig).test(window.navigator.userAgent.toLowerCase())) {
                    response = response.replace(/(<div\s+class="TFComponent"\s*>)/ig, '$1<div style="display:none">tf</div>');
                }

                responseTree = $('<div></div>').html(response).find('.TFComponent');
            }
            else if (Object.isWrap(response)) {
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
                                W(element).addClass(v);
                            });
                        }

                        // 复制 style
                        var style = renderTo[0].attributes.getNamedItem('style');
                        if (style) {
                            var namedItem = document.createAttribute("style");
                            namedItem.value = style.value;
                            $(element)[0].attributes.setNamedItem(namedItem);
                        }

                        renderTo.replaceWith(element);
                    }
                    else {
                        renderTo.append(element);
                    }
                }
            }

            if (this.query('.tf-component-error').length == 0) {
                this.query().attr('data-tf-component', this.fullName);

                // 判断是否是客户端渲染
                var template = this.query('script.TFTemplate');
                var data = this.query('script.TFData');

                var obj = null;

                if (data.length > 0) {
                    try {
                        obj = $.parseJSON(data.html());
                    } catch (e) {}
                }

                if (obj && template.length > 0) {
                    // 是客户端渲染，执行模板操作
                    this.query().html(mentor.Template.render(this.appName, template.html(), {'ComponentData': obj}));
                }

                this.instance.options['TFData'] = obj;

                // 自动提取页面中的 options 值
                var options = this.query('.tf-options');
                var name, tag;
                $.each(options, function(i, e){
                    e = W(e);
                    name = e.attr('name');

                    if (!name) {
                        return;
                    }

                    tag = e.prop('tagName').toLowerCase();
                    if (tag == 'input' || tag == 'textarea') {
                        this.instance.options[name] = e.val();
                    }
                    else {
                        this.instance.options[name] = e.html();
                    }
                }, this);

                $.event.trigger('complete', this._getEventObject(), this.instance);

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

                        $.event.trigger('refreshReady', this._getEventObject(), this.instance);

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

                        $.event.trigger('ready', this._getEventObject(), this.instance);

                    }, this));

                }
            }
            else {
                this.rendering = false;

                // 刷新完毕
                this.refreshing = false;

                $.event.trigger('failure', this._getEventObject(), this.instance);

                if (TF.Config[this.appName].debug) {
                    console.error && console.error('Component [' + this.getComponentName() + '] load error!');
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
            console.error(msg);
        },

        _delegateEvent: function(configs){
            if (!configs) {
                return;
            }
            var value;
            var me = this;
            for (var key in configs) {
                value = configs[key];
                if ($.isFunction(value)) {
                    value = {"click": value};
                }
                for (var type in value) {
                    this.topElement.delegate(key, type, (function(){
                        var func = value[type];
                        if ($.type(func) == 'string') {
                            func = me.instance[func];
                        }
                        return function(ev) {
                            ev.stopPropagation();
                            return func.call(this, ev, me.instance);
                        };
                    })());
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

            //console.log(me.templateData);
            //console.log(W(this).parentNode('.tf-bind'));

            if (bindingElement.length > 0) {
                // 这里可以通过自动查找 target name 实现无需在 data-bind 里填写模版名
                targetElement = el.parents('[class|=TFTarget]');

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
                data = evalExp('opts' + targetName + '.' + binding, this.templateData);
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
                var action = W(this).attr('tf-action-click') || '';

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
                    args.__element = this;
                    args.__data = me._getBindingData(this);
                }

                me.postMessage(action, args);
            });
        },

        _delegateJsEvent: function(){
            var me = this;

            this.topElement.delegate('.tf-click', 'click', function(e) {
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
                    return me.instance[eventName + 'Event'].call(this, e, me.instance);
                }
            });

            this.topElement.delegate('.tf-change', 'change', function(e) {
                e.stopPropagation();

                e.__data = me._getBindingData(this);

                var eventName = $(this).attr('tf-event-change');
                if (eventName) {
                    eventName = $.camelCase(eventName);
                    if (me.instance && $.isFunction(me.instance[eventName + 'Event'])) {
                        return me.instance[eventName + 'Event'].call(this, e, me.instance);
                    }
                }
            });
        },

        // 设置默认按钮
        _setDefaultSubmit: function() {
            var form = this.query('form.tf-button');
            var me = this;

            if (form.length > 0) {
                form.off('submit');
                form.on('submit', function(event) {
                    event.preventDefault();
                    var f = form.query('button.tf-default').first();
                    if (f) {
                        f.trigger('click');
                    }
                });
                // 如果没有 type=submit 的按钮则添加一个
                if (form.query('button[type=submit]').length == 0) {
                    form.append($('<div style="position:absolute;left:-9999px;top:-9999px;"><button type="submit"></button></div>'));
                }
            }
        },

        _setDefaultFocus: function() {
            if (this.isHidden()) {
                return;
            }

            var form = this.query('form.tf-focus');
            if (form.length > 0) {
                var first = null;
                var el, tag;
                for (var i = 0, len = form[0].elements.length; i < len; i++) {
                    el = $(form[0].elements[i]);
                    tag = el.prop('tagName').toLowerCase();

                    if (tag == 'input' && el.attr('type') == 'text' && !el[0].readOnly && el.is(':visible')) {
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

            $.each(components2, function(i, el){
                el = $(el);

                args = {};

                name = TF.Helper.Utility.toComponentName(el.prop('tagName').toLowerCase().slice(3));

                //console.log(el[0].attributes);
                attributes = $.makeArray(el[0].attributes);
                //console.log(attributes);

                $.each(attributes, function(i, item){
                    if (!$.inArray(item.name, exclude)) {
                        args[$.camelCase(item.name)] = ((item.name == item.value || item.value === '') ? true : item.value);
                    }
                });

                //console.log(args);
                args.name = name;
                args.replaceRender = true;
                args.renderTo = el;

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

        // 创建组件内部路由规则
        createRouter: function(routes, fn, scope) {
            if (routes) {
                var routerItems = routes || [];
                var routerFn = fn || function(){};
                var routerScope = scope || this.instance;

                var func = function(uri) {
                    var reg, isMatch = false;
                    $.each(routerItems, function(index, item) {
                        $.each(item, function(key, value){
                            key = key.replace(/:num/gi, '[0-9]+');
                            key = key.replace(/:any/gi, '.*');

                            reg = new RegExp('^' + key + '$');
                            if (uri.match(reg)) {
                                if (value.indexOf('$') >= 0 && key.indexOf('(') >= 0) {
                                    value = uri.replace(reg, value);
                                }
                                isMatch = true;
                                routerFn.apply(routerScope, [value, index, item]);
                            }
                        });

                        if (isMatch) {
                            return false;
                        }
                    });

                    if (!isMatch) {
                        routerFn.apply(routerScope, [uri, -1, null]);
                    }
                }

                //[{'key':'inbox/(:any)/(:any)', 'value': 'inbox/$2'}, ]

                TF.Core.Application.subscribe('GlobalRoute', function(uri) {
                    func(uri);
                });

                // 一般这里会错过首次的全局路由事件，所以要手动执行一次
                var uriObject = TF.Core.Router.parseUri();
                func(uriObject.uri);
            }
        },

        query: function(selector) {
            if (this.topElement) {
                return this.topElement.find(selector);
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
                xhrFields: {
                    'withCredentials': true
                },
                context: {
                    instance: this.instance,
                    options: mix({}, $.ajaxSettings)
                },
                complete: this._sendComplete
            };
            options = options || {};
            if ($.isFunction(options.fn)) {
                options.__TFCallback = options.fn;
                delete options.fn;
            }
            mix(ajaxOptions, options, true);

            if ($(ajaxOptions.data).prop('tagName').toLowerCase() == 'form') {
                ajaxOptions.data = $(ajaxOptions.data).serialize({
                    withDisabledSelect: ajaxOptions.withDisabledSelect
                });
            }

            if (!ajaxOptions.hasCache && ajaxOptions.type == 'get') {
                ajaxOptions.data = ajaxOptions.data || {};
                ajaxOptions.data['_reqno'] = TF.Helper.Utility.random();
            }

            // 如果已经发送请求，则取消上一个请求
            if (this.requester) {
                this.requester.abort();
            }

            this.requester = $.ajax(ajaxOptions);

            if (options.loadingMsg !== false) {
                this.setLoadingMsg(options.loadingMsg);
            }
        },

        // 装载完成
        // 注意这里的 this 已经换成 ajax context 所指对象
        _sendComplete: function(jqXHR) {//console.log(this);console.log(jqXHR)
            var me = this.instance;

            if (this.options.loadingMsg !== false) {
                me.sys.unsetLoadingMsg();
            }

            // 如果是取消的请求，则什么也不做，我们只关心真正请求回来的数据，而不关心请求的状态
            if (jqXHR.statusText == 'canceled') {
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
                //var param = Object.isString(jqXHR.target.data) ? jqXHR.target.data : Object.encodeURIJson(jqXHR.target.data);
                //console.debug && console.debug('url: ' + jqXHR.target.url + (param ? '?' + param : ''));
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
                if (Object.isString(args.message)) {
                    // 显示成功消息
                    mentor.Status.setSuccMsg(me.sys.appName, args.message, me, args);
                }
            }
        },

        // 静态渲染模板
        renderStaticTemplate: function(name, args) {
            var html;

            args = args || {};

            // 支持渲染一批模板
            name = $.makeArray(name);

            $.each(name, function(index, item){
                // 根据不同情况取 Target 名
                if ($.type(item) == 'string') {
                    html = this.query('.TFTemplate-' + item).html();
                    this.query('.TFTarget-' + item).html(mentor.Template.render(this.appName, html, args));
                    this.templateData[item] = args;
                }
                else if ($.isPlainObject(item)) {
                    templateName = item.template;
                    html = this.query('.TFTemplate-' + item.template).html();

                    if ($.type(item.target) == 'string') {
                        this.query('.TFTarget-' + item.target).html(mentor.Template.render(this.appName, html, args));
                    }
                    else {
                        var targetElement = $(item.target);
                        var match = /TFTarget-(\S+)/.exec(targetElement.attr('class'));
                        var className;
                        if (match) {
                            className = match[1];
                            $(item.target).html(mentor.Template.render(this.appName, html, args));
                        }
                        else {
                            className = 'gen-' + TF.Helper.Utility.random();
                            $(item.target).addClass('TFTarget-' + className).html(mentor.Template.render(this.appName, html, args));
                        }

                        item.target = className;
                    }

                    this.templateData[item.template] = args;
                    this.templateData[item.target] = args;
                }
            }, this);
        },

        // 取得渲染后的模板内容
        getRenderedTemplate: function(name, args) {
            return mentor.Template.render(this.appName, this.query('.TFTemplate-' + name).html(), args || {});
        },

        // 动态渲染模板，支持自动分页
        renderTemplate: function(name, args, actionName) {
            if (!name) return;
            //{'template':'xxx', 'target':'xxxx'}
            if (!args) args = {};

            if (args.loadingMsg !== false) {
                this.setLoadingMsg(args.loadingMsg);
            }

            var url = this.getUrl(actionName || TF.Helper.Utility.getDefaultDataUri(this.appName));
            var me = this;

            name = $.makeArray(name);

            if (args && args.data) {
                args.old_data = args.data;
            }

            // 自动绑定到 this
            if (args.fn) {
                args.old_fn = args.fn;
                args.fn = null;
                args.fn = function(result) {
                    me._pageInitialize(name, args);
                    args.old_fn.call(me.instance, result);
                    if (args.loadingMsg !== false) {
                        me.unsetLoadingMsg();
                    }
                };
            }
            else {
                args.fn = function(result) {
                    me._pageInitialize(name, args);
                    if (args.loadingMsg !== false) {
                        me.unsetLoadingMsg();
                    }
                };
            }

            if (args.page) {
                args.pageData = 'component_page=' + args.page;
            }
            if (args.pageData) {
                if ($.isPlainObject(args.pageData)) {
                    args.pageData = $.param(args.pageData);
                }
                if ($.isPlainObject(args.old_data)) {
                    args.old_data = $.param(args.old_data);
                }
                args.data = args.old_data ? (args.old_data + '&' + args.pageData) : args.pageData;
            }

            var template = [], target = [], templateName = [], targetName = [];

            // 支持渲染一批模板
            $.each(name, function(index, item){
                if ($.type(item) == 'string') {
                    template.push(this.query('.TFTemplate-' + item));
                    target.push(this.query('.TFTarget-' + item));
                    templateName.push(item);
                    targetName.push(item);
                }
                else if ($.isPlainObject(item)) {
                    template.push(this.query('.TFTemplate-' + item.template));

                    if ($.type(item.target) == 'string') {
                        target.push(this.query('.TFTarget-' + item.target));
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
            }, this);

            mix(args, {
                'errorFunc': proxy(function(resultData){
                    if (args.loadingMsg !== false) {
                        this.sys.unsetLoadingMsg();
                    }
                    this.RenderError(resultData);
                }, me.instance)
            });

            // ajax 模版渲染
            //console.info(name);
            //var waiter = [];
            var w, pos, object;

//            if (url.indexOf("http://") < 0 && url.indexOf('/') != 0) {
//                url = TF.Helper.Utility.siteUrl(url);
//            }

            var ajaxOptions = {
                url: url,
                type: 'GET',
                complete: function(jqXHR, textStatus) {
                    if (args.loadingMsg !== false) {
                        me.unsetLoadingMsg();
                    }
                },
                success: function(responseText, textStatus, jqXHR) {
                    // 输出调试信息
                    if (TF.Config[me.appName].debug) {
                        //var param = Object.isString(ajaxEvent.target.data) ? ajaxEvent.target.data : Object.encodeURIJson(ajaxEvent.target.data);
                        //console.debug('url: ' + ajaxEvent.target.url + (param ? '?' + param : ''));
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
                        var temp = args.filter(result);

                        if ($.isPlainObject(temp)) {
                            mix(result, temp);
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
                            object = W(target[i]);
                            try {
                                object.html(mentor.Template.render(me.appName, t.html(), result));
                            }
                            catch(e) {
                                object.html(e);
                            }
                        });

                        if (typeof(args) != 'undefined' && $.isFunction(args.fn)) {
                            args.fn(result);
                        }
                    }
                    else {
                        // 执行失败
                        if (typeof(args) != 'undefined' && $.isFunction(args.errorFunc)) {
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

            if (!ajaxOptions.hasCache && ajaxOptions.type == 'GET') {
                ajaxOptions.data = ajaxOptions.data || {};
                ajaxOptions.data['_reqno'] = TF.Helper.Utility.random();
            }

            // 如果已经发送请求，则取消上一个请求
            var currentRequester = this.templateRequester.get(name.join());
            if (currentRequester) {
                currentRequester.abort();
            }

            currentRequester = $.ajax(ajaxOptions);

            this.templateRequester.set(name.join(), currentRequester);
        },

        // 默认的翻页功能初始化函数
        _pageInitialize: function(name, args) {
            var target;
            var me = this;

            name = $.makeArray(name);

            $.each(name, function(index, item){
                // 根据不同情况取 Target 名
                if ($.type(item) == 'string') {
                    target = item;
                }
                else if ($.isPlainObject(item)) {
                    target = item.target;
                }
                me.query('.TFTarget-' + target + ' .ComponentPager').delegate('a', 'click', function(e){
                    e.stopPropagation();
                    e.preventDefault();

                    //me.setLoadingMsg();

                    args.fn = null;
                    args.fn = args.old_fn ? args.old_fn : null;
                    args.data = args.old_data ? args.old_data : null;
                    page = $(this).data('page');

                    me._pageHandler(name[index], page, args, index);
                });
            });
        },

        // 默认的翻页处理器
        _pageHandler: function(name, page, args, index) {
            // 添加模板名、当前页等参数
            if ($.type(name) == 'string') {
                args.pageData = 'component_template=' + name;
            }
            else if ($.isPlainObject(name)) {
                args.pageData = 'component_template=' + name.template + '&component_target=' + name.target;
            }
            args.pageData += '&component_page=' + page;
            args.page = page;
            this.renderTemplate(name, args);

            // 设置当前标签的当前页数
            if (this.layoutType == 'normal') {
                this.layoutData.page = page;
            }
            else if (this.layoutType == 'tab') {
                this.layoutData.items[this.layoutData.tabs.get(name)].page = page;
            }

            // 处理前进后退
            if (this.layoutType) {
                var values = TF.Core.Router.parseUri().params;
                if (/p\d+/.test(values[values.length - 1])) {
                    values[values.length - 1] = 'p' + page;
                }
                else {
                    values[values.length] = 'p' + page;
                }

                this.setRouterArgs(values);
            }
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
            if (this.requester) {
                this.requester.abort();
                //mentor.Status.unsetLoadingMsg(this.instance);
            }
        },

        cancelRender: function() {
            if (this.loader) {
                this.loader.abort();
            }
        },

        destroy: function() {
            if (this.instance) {
                if (this.instance.DomDestroy(this.instance) == false) {
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

        // 创建常规布局，常规布局包括的能力是自动分页
        createNormalLayout: function(data) {
            //[{'name':'模板名', 'fn': '回调函数', 'page': '当前页数'}, ]
            if (data) {
                this.layoutType = 'normal';
                this.layoutData = data;
            }
        },

        // 显示常规布局内容
        renderNormalLayout: function(isSetRouter, additional, notRefresh) {
            if (isSetRouter) {
                var args = $.makeArray(additional || []);
                if (this.layoutData.page > 0) {
                    args.push('p' + this.layoutData.page);
                }
                this.setRouterArgs(args);
            }

            if (!notRefresh || this.query('.TFTarget-' + this.layoutData.name).children().length == 0) {
                this.layoutData.fn.call(this.instance, this.layoutData.page);
            }
        },

        resetNormalLayoutPage: function() {
            this.layoutData.page = 0;
        },

        createTabLayout: function(data, initPanel, cls) {
            //[{'name':'mime', 'fn': '', 'page': '0'}, ]
            var me = this;

            if (!data) {
                return;
            }

            this.layoutType = 'tab';
            this.layoutData = {
                tabs: new TF.Library.Hash(),
                items: data
            };

            $.each(data, function(index, item){
                me.layoutData.tabs.set(item.name, index);
            });

            this.layoutData.tab = new QW.TabView(this.query(cls || ''), {
                tabSelector: '.le-tabs li',
                viewSelector: '.views .view-item',
                selectedClass: 'active',
                selectedViewClass: 'active'
            });
            // 重写 switchToItem 方法，以实现控制tab切换
            this.layoutData.tab.switchToItem = function(itemObj) {
                var index = $.inArray(itemObj, this.items);
                var lastIndex = this.selectedIndex;

                this.switchTo(index);

                if (lastIndex != index) {
                    me.renderTabLayout(true, TF.Core.Router.parseUri().params, true);
                }
            };

            if (initPanel) {
                this.layoutData.tab.switchTo(initPanel);
            }
        },

        // 显示 Tab 布局内容
        renderTabLayout: function(isSetRouter, additional, notRefresh) {
            var index = this.layoutData.tab.selectedIndex;

            if (isSetRouter) {
                var values = ['tab-' + this.layoutData.items[index].name];

                var args = $.makeArray(additional || []);//TF.Core.Router.parseUri().params;
                if (/p\d+/.test(args[args.length - 1])) {
                    args = args.slice(0, -1);
                }
                if (/tab-.+/.test(args[0])) {
                    args = args.slice(1);
                }

                values.push(args);
                //values.push(additional || []);

                if (this.layoutData.items[index].page > 0) {
                    values.push('p' + this.layoutData.items[index].page);
                }

                this.setRouterArgs(values.expand(true));
            }

            if (!notRefresh || W(this.layoutData.tab.views[index]).query('.TFTarget-' + this.layoutData.items[index].name).firstChild('*').length == 0) {
                this.layoutData.items[index].fn && this.layoutData.items[index].fn.call(this.instance, this.layoutData.items[index].page);
            }
        },

        resetTabLayoutPage: function() {
            var index = this.layoutData.tab.selectedIndex;
            this.layoutData.items[index].page = 0;
        },

        getCurrentTab: function() {
            var index = this.layoutData.tab.selectedIndex;

            if (index < 0) {
                return W([]);
            }
            return W(this.layoutData.tab.views[index]);
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

            //var old = this._getHistoryMgrValues();
            //if (old[0] == name[0] && old[1] == name[1]) return;
            TF.Core.Router.setUri(uri.join('/'));
            //this.options.HistoryMgr.setValues(name);
            //Iqwer.Class.Core.Instance.publish('全局历史路由', [name]);

            TF.Core.Application.publish('GlobalRoute', [uri.join('/'), [this.name, args]]);
        },

        // 取URI参数中的页数，args 为数组
        getUriPage: function(args) {
            if (!args) {
                return 0;
            }

            args = $.makeArray(args);
            var pager = args[args.length - 1] || '';
            if ((/p\d+/).test(pager)) {
                return pager.slice(1);
            }
            else {
                return 0;
            }
        },

        // 取URI参数中的tab名，args 为数组
        getUriTab: function(args) {
            var defaultName = this.layoutData.items[0].name;

            if (!args) {
                return defaultName;
            }

            args = $.makeArray(args);
            var tab = args[0] || '';
            if ((/tab-.+/).test(tab)) {
                return tab.slice(4);
            }
            else {
                return defaultName;
            }
        },

        // 验证组件表单
        validate: function() {
            var el = this.query('form.tf-validation');

            if (el.length > 0) {
                return QW.Valid.checkAll(el[0]);
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
            // 模板请求实例
            templateRequester: new TF.Library.Hash(),
            templateData: {},
            // 组件索引值
            index: 0,
            // 组件最后获取的 URI 参数
            lastArgs: []
        };
        mix(this.sys, componentSys);

        CustEvent.createEvents(this, ['complete', 'failure', 'refreshReady', 'ready']);

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
            mentor.Status.setFailMsg(this.sys.appName, 'Component [' + this.sys.getComponentName() + '] load error! Please refresh!');
        },

        // 默认渲染错误回调函数
        RenderError: function(result) {
            //window.location = '#';
            //mentor.Status.unsetLoadingMsg(this);
            //mentor.Status.setFailMsg(result.error, false, this);
        }
    });


    // 创建组件
    var defineComponentClass = function(data) {
        var superclass = TF.Component.Default

        var component = function(){

            // 执行父类构造函数
            superclass.apply(this, arguments);

            // 从原型中拷贝普通变量到实例中
            for (var key in component.prototype) {
                if (component.prototype.hasOwnProperty(key)) {
                    if (Object.isPlainObject(component.prototype[key])) {
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


    // 制作组件管理器类
    TF.Core.Application.createComponentMgrInstance = function(isGlobal, loadedCallback){
        var length = 0,
            progressLength = 0,
            // 组件关联数组，key 为组件名，value 为组件实例
            components = new TF.Library.Hash(),
            // 事件订阅列表
            subscriptions = new TF.Library.Hash(),
            // 预装载关联数组，key 为组件名，value 为组件加载选项数组
            //preload =  new TF.Library.Hash(),
            // 后台组件关联数组，key 为组件名，value 为组件创建 Options
            backgroundComponents = new TF.Library.Hash(),
            // 后台某组件最后收到的消息，key 为组件名，value 为消息体（消息名+消息参数的数组）
            backgroundLastMessage = new TF.Library.Hash(),
            // 是否正在使用进度条装载组件
            isLoading = false,
            // 组件别名关联数组
            componentAlias = new TF.Library.Hash();

        var getFullName = TF.Helper.Utility.getFullComponentName;

        var loadComplete = function(e) {
            var fullName = getFullName(e.fullName);

            if (e.instance == null) {
                throw 'Error: Component "' + fullName + '" load error! Please check Component Class Name!';
            }

            var currentObj = components.get(fullName)[e.instance.options.__index || 0];

            currentObj.loaded = true;
            currentObj.instance = e.instance;

            progressLength++;

            if (progressLength >= length){
                completeProgress();
            }

        };

        // 最终全部完成
        var completeProgress = function() {
            if (isGlobal) {
                // 广播一个全部组件加载完毕的消息
                TF.Core.Application.publish('GlobalComponentLoaded');
            }
            else {
                if (Object.isFunction(loadedCallback)) {
                    loadedCallback();
                }
            }
        };

        var renderComplete = function(e) {
            if (e.instance && !e.instance.options.lazyRender) {
                e.instance.on('ready', loadComplete);
            }
            else {
                loadComplete(e);
            }
        };

        var loadFirstComplete = function(e) {
            loadComplete(e);

            var fullName = getFullName(e.fullName);

            components.get(fullName).slice(1).forEach(function(item, index) {
                item.options.__index = index + 1;
                var obj = new TF.Library.ComponentLoader(item.options, exports);
                obj.on('complete', loadComplete);
                obj.on('failure', loadComplete);
                obj.load();
            });
        };

        var renderFirstComplete = function(e) {
            if (e.instance && !e.instance.options.lazyRender) {
                e.instance.on('ready', loadComplete);
            }
            else {
                loadComplete(e);
            }

            var fullName = getFullName(e.fullName);

            components.get(fullName).slice(1).forEach(function(item, index) {
                item.options.__index = index + 1;
                var obj = new TF.Library.ComponentLoader(item.options, exports);
                obj.on('complete', renderComplete);
                obj.on('failure', renderComplete);
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
                if (isLoading) return;

                progressLength = 0;

                components.forEach(function(item) {
                    item[0].options.__index = 0;
                    var obj = new TF.Library.ComponentLoader(item[0].options, this);
                    if (item.length > 1) {
                        obj.on('complete', (withRender ? renderFirstComplete : loadFirstComplete));
                        obj.on('failure', (withRender ? renderFirstComplete : loadFirstComplete));
                    }
                    else {
                        obj.on('complete', (withRender ? renderComplete : loadComplete));
                        obj.on('failure', (withRender ? renderComplete : loadComplete));
                    }
                    obj.load();
                }, this);
            },

            // 是否还在装载中
            isLoading: function() {
                return isLoading;
            },

            // 添加组件到预装载队列，等候装载
            add: function(options, defaultOptions) {
                if (isLoading) return;

                options = $.makeArray(options);

                defaultOptions = defaultOptions || {};

                var op, name;

                options.forEach(function(item){
                    // 合并默认选项
                    if (Object.isString(item)) {
                        op = {name: item};
                    }
                    else {
                        op = item;
                    }
                    mix(op, defaultOptions);

                    name = getFullName(op.name);

                    length++;

                    if (components.has(name)) {
                        // 组件已存在
                        components.get(name).push({
                            options: op,
                            instance: null,
                            loaded: false
                        });

                    }
                    else {
                        components.set(name, [{
                            options: op,
                            instance: null,
                            loaded: false
                        }]);
                    }

                    // 保存别名
                    if (op.alias) {
                        if (componentAlias.has(name + op.alias)) {
                            throw 'Error: Component alias "' + name + '[' + op.alias + ']" duplicate definition!';
                        }
                        componentAlias.set(name + op.alias, components.get(name).length - 1);
                    }

                }, this);

                return this;
            },

            // TODO
            // 添加组件到后台装载数组，等候随时装载
            addToBg: function(options) {
                backgroundComponents.set(getFullName(options.name), options);

                return this;
            },

            // TODO
            // 装载某个后台组件
            loadBgComponent: function(name) {
                name = getFullName(name);

                var options = backgroundComponents.get(name);
                var lastMessage;

                if (components.has(name) || !options) {
                    return;
                }

                var fn = proxy(function(e) {
                    //mentor.Status.unsetLoadingMsg();
                    lastMessage = backgroundLastMessage.get(name);
                    if (lastMessage) {
                        this.post(name, lastMessage[0], lastMessage[1]);
                    }
                }, this);

                //mentor.Status.unsetLoadingMsg();
                // 加载组件
                var obj = new TF.Library.ComponentLoader(options, this);
                obj.on('complete', fn);
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
                var nameObj;

                name = $.makeArray(name);

                name.forEach(function(item) {
                    item = getFullName(item);

                    // 处理事件订阅
                    this.publish(item, msg, args);

                    nameObj = parseName(item);

                    if (nameObj.index === undefined) {
                        // 当前名字下的所有组件
                        var com = components.get(nameObj.name);

                        if (com) {
                            // 传递给组件
                            com.forEach(function(value) {
                                if (value.loaded) {
                                    value.instance.sys.postMessage(msg, args);
                                }
                            });
                        }
                        else {
                            // 发送给后台组件
//                            backgroundLastMessage.set(item, [msg, args]);
//                            this.loadBgComponent(item);
                        }
                    }
                    else {
                        // 当前名字下的第 index 个组件
                        var com = components.get(nameObj.name)[nameObj.index];

                        if (com && com.loaded) {
                            // 传递给组件
                            com.instance.sys.postMessage(msg, args);
                        }
                        else {
                            // 发送给后台组件
//                            backgroundLastMessage.set(item, [msg, args]);
//                            this.loadBgComponent(item);
                        }
                    }
                }, this);
            },

            // 显示当前容器中 name 所指定的组件，并且隐藏此容器中其它组件
            show: function(name) {
                name = getFullName(name);
                this.post(name, 'component-only-show');
            },

            has: function(name) {
                name = getFullName(name);
                var nameObj = parseName(name);
                return components.has(nameObj.name) || backgroundComponents.has(nameObj.name);
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
                        loaded = com.some(function(value) {
                            return value.loaded;
                        });

                        if (loaded && subscriptions.has(name + msg)) {
                            subscriptions.get(name + msg).forEach(function(func) {
                                // 谁作为 this 需要考虑下
                                func.apply(func, [args, msg]);
                            }, this);
                        }
                    }
                }
                else {
                    // 当前名字下的第 index 个组件
                    if (com && com[nameObj.index] && com[nameObj.index].loaded) {
                        if (subscriptions.has(name + msg)) {
                            subscriptions.get(name + msg).forEach(function(func) {
                                // 谁作为 this 需要考虑下
                                func.apply(func, [args, msg]);
                            }, this);
                        }

                        if (subscriptions.has(nameObj.name + msg)) {
                            subscriptions.get(nameObj.name + msg).forEach(function(func) {
                                // 谁作为 this 需要考虑下
                                func.apply(func, [args, msg]);
                            }, this);
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

                if (nameObj.index === undefined) {
                    // 返回数组
                    agentExportObject = [];

                    com.forEach(function(item){
                        if (!item.loaded) {
                            return;
                        }

                        agentObject = {};

                        mix(agentObject, {
                            __instance: item.instance
                        });

                        for (x in item.instance) {
                            if (Object.isFunction(item.instance[x])) {
                                match = /^(.+?)Action$/.exec(x);
                                if (match) {
                                    funcName = match[1].trim();
                                    agentObject[funcName] = function(actionName) {
                                        return function() {
                                            //console.log(this.__instance);
                                            return this.__instance.sys.postMessage(actionName.decamelize(), arguments[0]);
                                            //return this.__instance[actionName + 'Action'].apply(this.__instance, arguments);
                                        };
                                    }(funcName);
                                }
                            }
                        }

                        agentExportObject.push(agentObject);

                    }, this);
                }
                else {
                    if (com[nameObj.index] && com[nameObj.index].loaded) {
                        agentObject = com[nameObj.index].instance;
                        agentExportObject = {};

                        mix(agentExportObject, {
                            __instance: agentObject
                        });

                        for (x in agentObject) {
                            if (Object.isFunction(agentObject[x])) {
                                match = /^(.+?)Action$/.exec(x);
                                if (match) {
                                    funcName = match[1].trim();
                                    agentExportObject[funcName] = function(actionName) {
                                        return function() {
                                            //console.log(this.__instance);
                                            return this.__instance.sys.postMessage(actionName.decamelize(), arguments[0]);
                                            //return this.__instance[actionName + 'Action'].apply(this.__instance, arguments);
                                        };
                                    }(funcName);
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
    TF.Core.Router = function() {
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
                //window.location = '#tf-' + TF.Helper.Utility.toComponentUriName(defaultName);
                mentor.Status.setFailMsg(TF.Helper.Utility.getApplicationName(fullName), TF.Helper.Utility.toComponentUriName(name) + ' uri error!');
            }

            // 额外路由
            var reg, isMatch = false;
            additionRouter.forEach(function(item, index) {
                Object.map(item, function(value, key){
                    key = key.replace(/:num/gi, '[0-9]+');
                    key = key.replace(/:any/gi, '.*');

                    reg = new RegExp('^' + key + '$');
                    if (result.uri.match(reg)) {
                        if (value.contains('$') && key.contains('(')) {
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
                    locationHash.on('hashChanged', function(e){
                        callback(e.hash);
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

            go: function(uri, url) {
                if (url) {
                    //console.log(url + '#tf-' + encodeURI(uri));
                    location.href = url + '#tf-' + encodeURI(uri);
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
    }();


    TF.define = function(name, options) {
        var appName;

        if (Object.isString(name)) {
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


    Dom.ready(function(){
        appReady = true;
        TF.Core.Application.publish('DomReady');
        // 执行页面默认的装载完成函数
        if (TF.ready != undefined) {
            TF.ready();
        }
    });


    return TF;

}));