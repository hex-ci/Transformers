/*
*
* Transformers for QWrap 核心库
*
* 为 QWrap 实现一套组件化开发模式
*
*/

/**
 * 声明 Transformers 包
 * @author: Hex
 */

;(function () {
    var TF,
        Transformers = TF = Transformers || {
        'version': '0.2',
        'build': '20130118'
    };

    var mix = QW.ObjectH.mix,
        bind = QW.FunctionH.bind;

    // 创建名字空间
    namespace('Core', TF);
    namespace('Component', TF);
    namespace('Library', TF);
    namespace('Helper', TF);

    TF.Core.Config = {
        name: '',
        baseUrl: '/',
        templateUriPattern: '{$application}/{$channel}/{$name}/view',
        jsUriPattern: 'resource/js/{$application}/{$channel}/{$name}.js',
        dataUriPattern: '{$application}/{$channel}/{$name}/{$uri}',
        defaultDataUri: 'model',
        ajaxDataValidation: function(obj){
            return (obj.errno == 0);
        }
    };

    // 一些工具类

    // 实用工具静态类，包括一些常用例程
    TF.Helper.Utility = {
        baseUrl: function(){
            return TF.Core.Config.baseUrl;
        }

        , siteUrl: function(uri){
            return TF.Core.Config.baseUrl + uri;
        }

        , getApplicationPath: function() {
            return TF.Core.Config.name ? TF.Core.Config.name.toLowerCase() + '/' : '';
        }

        , getComponentUrl: function(uri, channelName, name) {
            var pattern = TF.Core.Config.dataUriPattern;
            var str = pattern.tmpl({
                application: TF.Core.Config.name.toLowerCase(),
                channel: channelName.toLowerCase(),
                name: decamelize(name),
                uri: uri
            });

            return TF.Helper.Utility.baseUrl() + str;
        }

        , getComponentViewUrl: function(channelName, name) {
            var pattern = TF.Core.Config.templateUriPattern;
            var str = pattern.tmpl({
                application: TF.Core.Config.name.toLowerCase(),
                channel: channelName.toLowerCase(),
                name: decamelize(name)
            });

            return TF.Helper.Utility.baseUrl() + str;
        }

        , getComponentJsUrl: function(channelName, name) {
            var pattern = TF.Core.Config.jsUriPattern;
            var str = pattern.tmpl({
                application: TF.Core.Config.name.toLowerCase(),
                channel: channelName.toLowerCase(),
                name: decamelize(name)
            });

            return TF.Helper.Utility.baseUrl() + str;
        }

        , getDefaultDataUri: function() {
            return TF.Core.Config.defaultDataUri;
        }

        // 生成随机数字字符串
        , random: function() {
            return ((new Date()).getTime() + Math.floor(Math.random()*9999));
        }

        , toArray: function (source) {
            if (source === null || source === undefined)
                return [];
            if (Object.isArray(source))
                return source;

            // The strings and functions also have 'length'
            if (typeof source.length !== 'number' || typeof source === 'string' || Object.isFunction(source)) {
                return [source];
            }

            return [].slice.call(source);
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
        },

        extend: function(properties){
            Object.mix(this.data, properties || {});

            return this;
        },

        combine: function(properties){
            Object.map(properties || {}, function(value, key){
                if (this.has(key)) {
                    if (!this.data[key]) {
                        this.data[key] = value;
                    }
                }
            }, this);

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
            return Object.encodeURIJson(this.data);
        }
    });


    // URI hash 管理，主要就是实现 hashchange 事件
    TF.Library.LocationHash = function(options) {
        this.options = {
            blank_page: 'javascript:0',
            start: false
        };
        this.iframe = null;
        this.handle = false;
        this.useIframe = (Browser.ie && (typeof(document.documentMode)=='undefined' || document.documentMode < 8));
        this.state = null;
        this.supports = (('onhashchange' in window) && (typeof(document.documentMode) == 'undefined' || document.documentMode > 7));

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
                W(window).on('hashchange', function() {
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
            var pos = href.indexOf('#') + 1;
            return (pos) ? href.substr(pos) : '';
        },

        setHash: function(hash) {
            if (this.supports) {
                top.location.hash = hash || '#';
                return;
            }

            var href = decodeURI(hash);
            var pos = href.indexOf('#') + 1;
            hash = (pos) ? href.substr(pos) : '';

            this.setState(hash);

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
                    var istate = doc.body.innerText;
                    if (this.state == state) return istate;
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
            top.location.hash = state || '#';

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

            this.handle = setInterval(bind(this.checkHash, this), 200);
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
    TF.Core.Application = {
        create: function(config) {
            mix(TF.Core.Config, config, true);
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
        }

    };

    // 组件加载器类

    var decamelize = function(s) {
        return s.replace(/[A-Z]/g, function(a) {
            return '_' + a.toLowerCase();
        }).slice(1);
    };

    TF.Library.ComponentLoader = function(options, componentMgrInstance) {
        this.options = {
            name: 'Default',
            url: '',
            hide: false,            // 是否以隐藏的方式渲染组件
            lazyInit: false,        // 延迟初始化
            lazyRender: false,      // 延迟渲染
            appendRender: false,    // 是否添加到容器节点
            renderTo: '#component',  // 组件的容器
            applyTo: '',            // 直接把某个 DOM 节点变成组件
            contentEl: '',          // 从某个 DOM 节点取得组件的内容
            data: ''               // URL 参数
        };
        mix(this.options, options, true);

        CustEvent.createEvents(this, ['complete', 'failure']);

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

            var name = decamelize(this.options.name).split('_');
            this.channelName = name[0].capitalize();
            name[0] = '';
            this.name = name.join('-').camelize().capitalize();

            // 注册到组件管理器
            this.componentMgrInstance.register(this.fullName);
        }

        , load: function() {
            this.preload();
        }

        , preload: function() {
            // 创建组件所需的名字空间
            namespace(this.channelName, TF.Component);

            var isLoad = (typeof TF.Component[this.channelName][this.name] == 'undefined' ? false : true);

            if (isLoad) {
                this.createInstance();
            }
            else {
                loadJs(TF.Helper.Utility.getComponentJsUrl(this.channelName, this.name), bind(function(){
                    if (typeof TF.Component[this.channelName][this.name] != 'undefined') {
                        // 加载成功
                        this.createInstance();
                    }
                    else {
                        // 加载失败
                        // 应该返回错误，或者记录日志
                        this.fire('failure', {instance: null, fullName: this.fullName, name: this.name, channelName: this.channelName});
                    }
                }, this));
            }
        }

        // 创建当前内容的名字空间实例
        , createInstance: function() {
            try {
                this._instance = new TF.Component[this.channelName][this.name](this.options);
            }
            catch(e) {
            }

            // 组件实例化正确才加载内容
            if (this._instance) {
                this._instanced = true;

                // 把加载器的配置传递到组件实例的sys空间里
                mix(this._instance.sys.options, this.options, true);

                this._instance.sys.hidden = this.options.hide;
                this._instance.sys.fullName = this.fullName;
                this._instance.sys.name = this.name;
                this._instance.sys.channelName = this.channelName;
                // 组件需要知道自己的父级组件管理器是谁
                this._instance.sys.parentComponentMgr = this.componentMgrInstance;

                // 实例准备就绪
                this._instance.InstanceReady(this);

                this.componentMgrInstance.loaded(this.fullName, this._instance);

                // 看是否是延迟渲染
                if (!this.options.lazyRender) {
                    this._instance.sys.render();
                }

                this.fire('complete', {instance: this._instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
            }
            else
            {
                //alert('组件装载出错，请刷新页面。');
                this.fire('failure', {instance: null, fullName: this.fullName, name: this.name, channelName: this.channelName});
            }
        },

        getInstance: function() {
            return this._instance;
        }

    });

    // 组件系统内部方法
    var componentSys = {
        // 组件消息处理中心
        postMessage: function(msg, args) {
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
            var is_continue = true,
                funcName = msg.camelize();

            if (this.instance && Object.isFunction(this.instance[funcName + 'ActionBefore'])) {
                is_continue = this.instance[funcName + 'ActionBefore'].call(this.instance, args);
            }

            if (is_continue === false) {
                return;
            }

            // 系统事件处理
            switch (msg) {
                case 'component-route':
                    if (this.instance && Object.isFunction(this.instance['componentRouteAction'])) {
                        this.instance['componentRouteAction'].call(this.instance, args);
                    }
                    else {
                        this.route(args);
                    }
                    return;
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
                this.instance[funcName + 'Action'].call(this.instance, args);
            }
        },

        route: function(args) {
            this.onlyShow(args);
        },

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
                this._loadComplete(W(this.options.applyTo));
            }
            else if (this.options.contentEl) {
                //直接渲染
                this._loadComplete(W(this.options.contentEl).cloneNode(true));
            }
            else {
                this._loadContent();
            }
        },

        // 装载组件模板
        _loadContent: function() {
            if (this.options.url == '') {
                this.options.url = TF.Helper.Utility.getComponentViewUrl(this.channelName, this.name);
            }
            else if (this.options.url.indexOf("http://") < 0) {
                this.options.url = TF.Helper.Utility.siteUrl(this.options.url);
            }

            if (!this.loader) {
                this.loader = new QW.Ajax({
                    url: this.options.url,
                    data: this.options.data,
                    method: 'get',
                    timeout: 10000,
                    onsucceed: bind(this._loadComplete, this),
                    onerror: bind(function() {
                        //this.loadError('4. Ajax Error!');
                    }, this)
                });
            }

            this.loader.send();
        },

        _loadComplete: function(ajaxEvent) {
            var response, responseTree;

            response = ajaxEvent.target.requester.responseText;

            if (Object.isString(response)) {
                responseTree = W(Dom.createElement('div')).html(response).query('.TFComponent');
            }
            else if (Object.isWrap(response)) {
                responseTree = response.first();
            }
            else {
                // error
                return;
            }

            // 如果没有装载正确，则立即返回
            if (!this.instance || responseTree.length == 0) {
                //alert('组件装载出错，请刷新页面。');
                //this._loadError('1. Ajax Error!');
                return;
            }

            var element = responseTree;

            // 存储经过包装的元素
            this._setTopElement(element);

            // 是否以隐藏的方式渲染组件
            if (this.hidden) {
                this.topElement.hide();
            }

            // 放入 DOM 树中
            if (!this.refreshing) {
                if (!this.options.applyTo) {
                    if (!this.options.appendRender) {
                        W(this.options.renderTo).empty();
                    }
                    W(this.options.renderTo).appendChild(element);
                }
            }

            if (this.query('.js-component-error').length == 0) {
                this.query().attr('data-tf-component', this.fullName);

                // 判断是否是客户端渲染
                var template = this.query('script[class~=TFTemplate]');
                var data = this.query('script[class~=TFData]');

                if (template.length > 0 && data.length > 0) {
                    // 是客户端渲染，执行模板操作
                    var obj = null;
                    try {
                        obj = QW.JSON.parse(data.html());
                    } catch (e) {}
                    this.query().html(baidu.template(template.html(), {'ComponentData': obj}));
                }

                // 自动提取页面中的 options 值
                var options = this.query('[class~=options]');
                var name, tag;
                options.forEach(function(e){
                    name = e.attr('name');
                    tag = e.attr('tagName').toLowerCase();
                    if (tag == 'input' || tag == 'textarea') {
                        this.instance.options[name] = e.attr('value');
                    }
                    else {
                        this.instance.options[name] = e.attr('text');
                    }
                }, this);

                this.instance.fire('complete', {instance: this.instance, fullName: this.fullName, name: this.name, channelName: this.channelName});

                // 页面全部装载完成！
                if (this.refreshing) {
                    this.instance.DomRefreshReady();
                    this.instance.fire('refreshReady', {instance: this.instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
                }
                else {
                    // 处理事件委托绑定
                    this._delegateJsAction();
                    this._delegateEvent(this.instance.Events);

                    this.instance.DomReady();

                    // 渲染完毕
                    this.rendered = true;

                    // 渲染完毕后要处理未渲染时的最后一条消息
                    if (this.lastRouterMessage) {
                        this.postMessage(this.lastRouterMessage.msg, this.lastRouterMessage.args);
                        this.lastRouterMessage = null;
                    }
                    if (this.lastMessage) {
                        this.postMessage(this.lastMessage.msg, this.lastMessage.args);
                        this.lastMessage = null;
                    }

                    this.instance.fire('ready', {instance: this.instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
                }
            }
            else {
                this.instance.fire('failure', {instance: this.instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
            }

            this.rendering = false;

            return true;
        },

        _delegateEvent: function(configs){
            if (!configs) {
                return;
            }
            var value;
            for (var key in configs) {
                value = configs[key];
                if (Object.isFunction(value)) {
                    value = {"click": value};
                }
                for (var type in value) {
                    this.topElement.delegate(key, type, bind(value[type], this.instance));
                }
            }
        },

        _delegateJsAction: function(){
            this.topElement.delegate('.js-action', 'click', bind(function(e){
                e.preventDefault();
                var action = W(e.target).attr('data-action');
                this.postMessage(action, {event: e});
            }, this));
        },

        // 创建浏览器历史路由规则
        createRouter: function(routes, fn, scope) {
            if (routes) {
                var routerItems = routes || [];
                var routerFn = fn || function(){};
                var routerScope = scope || this.instance;

                var func = function(uri) {
                    var reg, isMatch = false;
                    routerItems.forEach(function(item, index) {
                        Object.map(item, function(value, key, obj){
                            key = key.replace(/:num/gi, '[0-9]+');
                            key = key.replace(/:any/gi, '.*');

                            reg = new RegExp('^' + key + '$');
                            if (uri.match(reg)) {
                                if (value.contains('$') && key.contains('(')) {
                                    value = uri.replace(reg, value);
                                }
                                isMatch = true;
                                routerFn.apply(routerScope, [value, index, item]);
                            }
                        });
                    });

                    if (!isMatch) {
                        routerFn.apply(routerScope, [uri, -1, null]);
                    }
                }

                //[{'key':'inbox/(:any)/(:any)', 'value': 'inbox/$2'}, ]

                TF.Core.Application.subscribe('GlobalRoute', function(uri) {
                    func(uri.toLowerCase());
                });

                // 一般这里会错过首次的全局路由事件，所以要手动执行一次
                var uri = TF.Core.Router.parseUri();
                uri = [uri.channelName, uri.name, uri.params];
                uri = uri[1] ? uri.join('/') : uri[0];
                func(uri.toLowerCase());
            }
        },

        query: function(selector) {
            if (this.topElement) {
                return this.topElement.query(selector);
            }
            else {
                return new NodeW([]);
            }
        },

        _setTopElement: function(el, prefix) {
            prefix = prefix || 'transformers_gen';
            this.topElement = W(el).attr('id', prefix + '_' + TF.Helper.Utility.random());
        },
        _unsetTopElement: function() {
            if (this.topElement && this.topElement.length > 0)
            {
                this.topElement.parentNode().empty();
                this.topElement = null;
            }
        },
        // 取自己的组件名
        getComponentName: function() {
            //return T.string.capitalize(this._channelName) + T.string.capitalize(T.string.camelCase(this._name.replace(/_/g, '-')));
        },
        setLoadingMsg: function(msg) {
            //if (this._isLoadingMsg) return;
            //this._isLoadingMsg = true;
            //TF.Singleton.page.setLoadingMsg(msg);
        },

        // 封装组件内容 Request
        send: function(url, options) {
            if (url.indexOf("/") < 0) {
                url = TF.Helper.Utility.getComponentUrl(url, this.channelName, this.name);
            }
            else {
                url = TF.Helper.Utility.siteUrl(url.slice(1));
            }

            var ajaxOptions = {
                url: url,
                method: 'get',
                timeout: 10000,
                oncomplete: bind(this._sendComplete, this.instance)
            };
            options = options || {};
            if (Object.isFunction(options.fn)) {
                options.TFCallback = options.fn;
                delete options.fn;
            }
            mix(ajaxOptions, options, true);

            // 如果已经发送请求，则取消上一个请求
            if (this.requester) {
                this.requester.cancel();
            }

            this.requester = new QW.Ajax(ajaxOptions);
            this.requester.send();
        },

        // 装载完成
        _sendComplete: function(ajaxEvent) {
            // 如果是取消的请求，则什么也不做，我们只关心真正请求回来的数据，而不关心请求的状态
            if (ajaxEvent.target.state == QW.Ajax.STATE_CANCEL) {
                return;
            }

            var response = ajaxEvent.target.requester.responseText;
            var result = null;

            try {
                result = QW.JSON.parse(response);
            } catch (e) {}

            if (!result) {
                result = {'errno': 999, 'errmsg': 'Error!', data: []}; // 内部错误
            }

            var isError = !TF.Core.Config.ajaxDataValidation(result);
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

            if (Object.isFunction(ajaxEvent.target.TFCallback)) {
                ajaxEvent.target.TFCallback.call(this, !isError, args);
            }

            if (isError && args.message != '') {
                // 显示错误消息
                //Iqwer.Class.Page.Instance.setErrorMsg(args.message);
            }
            else {
                if (Object.isString(args.message) && args.message != '') {
                    // 显示成功消息
                    //Iqwer.Class.Page.Instance.setSuccessMsg(args.message);
                }
            }
        },

        // 静态渲染模板
        renderStaticTemplate: function(name, args) {
            // 支持渲染一批模板
            name = TF.Helper.Utility.toArray(name);

            name.forEach(function(item){
                // 根据不同情况取 Target 名
                if (Object.isString(item)) {
                    this.query('.TFTarget_' + item).html(baidu.template(this.query('.TFTemplate_' + item).html(), args));
                }
                else if (Object.isObject(item)) {
                    this.query('.TFTarget_' + item.target).html(baidu.template(this.query('.TFTemplate_' + item.template).html(), args));
                }
            }, this);
        },

        // 动态渲染模板，支持自动分页
        renderTemplate: function(name, args) {
            if (!name) return;
    //{'template':'xxx', 'target':'xxxx'}
            //this._setLoadingMsg();
            var url = TF.Helper.Utility.getComponentUrl(TF.Helper.Utility.getDefaultDataUri(), this.channelName, this.name);
            var me = this.instance;

            name = TF.Helper.Utility.toArray(name);

            if (args && args.data) {
                args.old_data = args.data;
            }

            // 自动绑定到 this
            if (args && args.fn) {
                args.old_fn = args.fn;
                args.fn = null;
                args.fn = function(result) {
                    //this.pageInitialize.run({'name': name, 'args': args}, me);
                    args.old_fn.call(me, result);
                    if (args.loadingMsg != false) {
                        //Iqwer.Class.Page.Instance.unsetLoadingMsg();
                    }
                };
            }
            else {
                if (!args) args = {};
                args.fn = function(result) {
                    //this.pageInitialize.run({'name': name, 'args': args}, me);
                    if (args.loadingMsg != false) {
                        //Iqwer.Class.Page.Instance.unsetLoadingMsg();
                    }
                };
            }

            if (args.page) {
                args.pageData = 'component_page=' + args.page;
            }
            if (args.pageData) {
                if (Object.isObject(args.pageData)) {
                    args.pageData = Object.encodeURIJson(args.pageData);
                }
                if (Object.isObject(args.old_data)) {
                    args.old_data = Object.encodeURIJson(args.old_data);
                }
                args.data = args.old_data ? (args.old_data + '&' + args.pageData) : args.pageData;
            }

            var template = [], target = [];

            // 支持渲染一批模板
            name.forEach(function(item){
                if (Object.isString(item)) {
                    template.push(this.query('.TFTemplate_' + item));
                    target.push(this.query('.TFTarget_' + item));
                }
                else if (Object.isObject(item)) {
                    template.push(this.query('.TFTemplate_' + item.template));
                    target.push(this.query('.TFTarget_' + item.target));
                }
            }, this);

            this._renderAjaxTemplate(template, target, url, mix({'fn_error': bind(this.instance.RenderError, this.instance)}, args));
        },

        // ajax 模版渲染
        _renderAjaxTemplate: function(template, target, url, options) {
            var waiter = [];
            var w, pos, object;

            template = TF.Helper.Utility.toArray(template);
            target = TF.Helper.Utility.toArray(target);

            if (url.indexOf("http://") < 0 && url.indexOf("/") != 0) {
                url = TF.Helper.Utility.siteUrl(url);
            }

            var ajax = new QW.Ajax({
                url: url,
                method: 'get',
                onerror: function() {
//                    (function() {
//                        try
//                        {
//                            // 重试
//                            TrimPath.load(template, target, url, options);
//                        }
//                        catch (e)
//                        {
//                        }
//                    }).delay(500);
                },
                onsucceed: function(ajaxEvent) {
                    var response = ajaxEvent.target.requester.responseText;
                    var result = null;

                    try {
                        result = QW.JSON.parse(response);
                    } catch (e) {}

                    // 如果是空对象，则强制为 null
                    if (result) {
                        // 这里为了判断是否是空对象
                        var j = false;
                        for (var i in result) {
                            j = true;
                            break;
                        }

                        if (!j) {
                            result = null;
                        }
                    }

                    // 数据过滤器，在这里可以进行一些显示前的处理。
                    if (result && typeof(options) != 'undefined' && Object.isFunction(options.filter)) {
                        var temp = options.filter(result);

                        if (Object.isObject(temp)) {
                            result = mix(result, temp);
                        }
                    }

                    if (!result) {
                        // 清理
                        //ajax = null;
                        result = null;

//                        (function() {
//                            try
//                            {
//                                // 重试
//                                TrimPath.load(template, target, url, options);
//                            }
//                            catch (e)
//                            {
//                            }
//                        }).delay(500);

                        return;
                    }

                    // 如果有附加数据 addition，则添加到 result 对象中
                    if (options.addition) {
                        result = mix(result, options.addition, true);
                    }

                    if (TF.Core.Config.ajaxDataValidation(result)) {
                        // 执行成功
                        template.forEach(function(t, i) {
                            object = W(target[i]);
                            try {
                                object.html(baidu.template(t.html(), result));
                            }
                            catch(e) {
                                object.html(e);
                            }
                        });

                        if (typeof(options) != 'undefined' && Object.isFunction(options.fn)) {
                            options.fn(result);
                        }
                    }
                    else {
                        // 执行失败
                        // 如果用户登陆信息验证失败，立即刷新以便重新登陆
//                        if (result.errno == 403) {
//                            //window.location.reload();
//                            return;
//                        }

                        if (typeof(options) != 'undefined' && Object.isFunction(options.fn_error)) {
                            options.fn_error(result);
                        }
                        else {
                            template.forEach(function(t, i){
                                W(target[i]).html(result.errmsg || '');
                            });
                        }
                    }

                    //ajax = null;
                }
            });

            ajax.send();
        },

        // 显示组件
        show: function() {
            this.hidden = false;
            if (!this.rendered) {
                return;
            }
            this.topElement.show();
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
                //alert(el.getParent().getChildren().length);
                el.parentNode().query('.TFComponent').forEach(function(comEl){
                    comEl = W(comEl);
                    if (id != comEl.attr('id')) {
                        comName = comEl.attr('data-tf-component');

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
            return TF.Core.Application.createComponentMgrInstance(callback);
        },

        cancelRequest: function() {
            if (this.requester) {
                this.requester.cancel();
                //TF.Singleton.page.unsetLoadingMsg();
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
                this.cancelRequest();

                // 清除表单验证对象
                //this.clearValidation();

                this._unsetTopElement();

                this.instance = null;
            }
            catch (e) {
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
            channelName: '',  // 组件 栏目 名称，小写字母
            rendered: false,
            refreshing: false,
            hidden: false
        };
        mix(this.sys, componentSys);

        CustEvent.createEvents(this, ['complete', 'failure', 'refreshReady', 'ready']);

        this.initialize(options);

        return this;
    };
    mix(TF.Component.Default.prototype, {
        initialize: function(options) {
            //this._first_load = this.options._needLoading ? true : false;
            //this._isLoadingMsg = false;
        },

        InstanceReady: function(loader) {
            // 实例准备就绪
        },
        DomReady: function(loader) {
            // 组件中的 DOM 已经准备就绪
        },
        DomRefreshReady: function(loader) {
            // 组件中的 DOM 已经刷新完毕并准备就绪
        },
        DomDestroy: function(loader) {
            // 组件即将销毁
        },
        loadError: function(loader, msg) {
            // 组件装载出错
            //alert('Component Error: ' + msg);
            //ComponentObject._loadContent();
        },
        // 默认渲染错误回调函数
        RenderError: function(result) {
            //window.location = '#';
            //TF.Singleton.page.unsetLoadingMsg();
            //TF.Singleton.page.setErrorMsg(result.error);
            //this._loaded();
        }
    });


    // 制作组件管理器类
    TF.Core.Application.createComponentMgrInstance = function(isGlobal, loadedCallback){
        var length = 0,
            // 组件关联数组，key 为组件名，value 为组件实例
            components = new TF.Library.Hash(),
            // 事件订阅列表
            subscriptions = new TF.Library.Hash(),
            // 预装载数组
            preload = [],
            // 预装载时候的 Show 消息数组
            preloadShow = [],
            // 后台组件关联数组，key 为组件名，value 为组件创建 Options
            backgroundComponents = new TF.Library.Hash(),
            // 后台某组件最后收到的消息，key 为组件名，value 为消息体（消息名+消息参数的数组）
            backgroundLastMessage = new TF.Library.Hash(),
            // 是否正在使用进度条装载组件
            isLoading = false,
            // 已装载的组件名数组
            loadedComponents = [];

        var loadComplete = function(e) {
            if (!loadedComponents.contains(e.fullName)) {
                loadedComponents.push(e.fullName);
            }

            if (components.has(e.fullName)) {
                components.set(e.fullName, [e.instance]);
            }

            if (loadedComponents.length >= length){
                completeProgress();
            }
        };

        // 最终全部完成
        var completeProgress = function() {
            preloadShow.forEach(function(item){
                this.show(item);
            }, exports);
            preloadShow.length = 0;

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

        var exports = {
            // 创建组件
            create: function(data) {
                var superclass = data.Extends || TF.Component.Default

                delete data['Extends'];

                var component = function(){
                    // 执行父类构造函数
                    superclass.apply(this, arguments);

                    if ('initialize' in this) {
                        this.initialize.apply(this, arguments);
                    }
                };

                mix(component.prototype, data);

                return Function.extend(component, superclass);
            },

            // 注册组件
            register: function(name) {
                if (!components.has(name)) {
                    components.set(name, []);
                }
            },

            // 启动组件装载进程，并行装载
            startLoad: function() {
                if (isLoading) return;

                preload.forEach(function(item) {
                    var obj = new TF.Library.ComponentLoader(item, this);
                    obj.on('complete', loadComplete);
                    obj.load();
                }, this);
            },

            // 是否还在装载中
            isLoading: function() {
                return isLoading;
            },

            // 某某组件已装载
            loaded: function(name, instance) {
                if (components.has(name) && !loadedComponents.contains(name)) {
                    components.set(name, [instance]);
                    loadedComponents.push(name);
                }
            },

            // 添加组件到预装载队列，等候装载
            add: function(options) {
                if (isLoading) return;

                if (!this.has(options.name) && !loadedComponents.contains(options.name)) {
                    length++;
                    preload.push(options);
                }

                return this;
            },

            // 添加组件到后台装载数组，等候随时装载
            addToBg: function(options) {
                backgroundComponents.set(options.name, options);

                return this;
            },

            // 装载某个后台组件
            loadBgComponent: function(name) {
                var options = backgroundComponents.get(name),
                    lastMessage;

                if (components.has(name) || !options) return;

                var fn = bind(function(e) {
                    //TF.Singleton.page.unsetLoadingMsg();
                    lastMessage = backgroundLastMessage.get(name);
                    if (lastMessage) {
                        this.post(name, lastMessage[0], lastMessage[1]);
                    }
                }, this);

                //TF.Singleton.page.setLoadingMsg();
                // 加载组件
                var obj = new TF.Library.ComponentLoader(options, this);
                obj.on('complete', fn);
                obj.load();
            },

            // 删除组件
            remove: function(name) {
                if (components.has(name)) {
                    // 删除已存在的实例
                    components.erase(name);
                }
            },

            // 投递事件给具体的实例
            post: function(name, msg, args) {
                name = TF.Helper.Utility.toArray(name);

                name.forEach(function(item) {
                    if (components.has(item) && loadedComponents.contains(item)) {
                        // 处理事件订阅
                        if (subscriptions.has(item + msg)) {
                            subscriptions.get(item + msg).forEach(function(func) {
                                // 谁作为 this 需要考虑下
                                func.apply(func, [args, msg]);
                            }, this);
                        }

                        // 传递给组件
                        components.get(item).forEach(function(com) {
                            com.sys.postMessage(msg, args);
                        });
                    }
                    else {
                        // 发送给后台组件
                        backgroundLastMessage.set(item, [msg, args]);
                        this.loadBgComponent(item);
                    }
                }, this);
            },

            // 显示当前容器中 name 所指定的组件，并且隐藏此容器中其它组件
            show: function(name) {
                if (isLoading) {
                    preloadShow.push(name);
                    return;
                }

                if (this.has(name)) {
                    this.post(name, 'component-only-show');
                }
            },

            has: function(name) {
                return components.has(name) || backgroundComponents.has(name);
            },

            // 取某个名字下的组件实例个数
            length: function(name) {
                if (components.has(name)) {
                    return components.get(name).length;
                }
                else {
                    return 0;
                }
            },

            // 以某个函数订阅某个组件的事件
            subscribe: function(name, msg, fn, scope) {
                var func = bind(fn, scope || fn);
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
            }
        };

        return exports;
    };

    // 全局组件管理器（单例模式）
    TF.Core.ComponentMgr = TF.Core.Application.createComponentMgrInstance(true);

    // URI 路由部分
    TF.Core.Router = function() {
        var defaultChannelName = 'Home',
            defaultName = 'Home';

        var locationHash = null;

        // 额外的路由规则，不会影响系统既有路由规则
        var addtionRouter = [];

        var parse = function(hash) {
            var bits = hash.match(/tf-([^\/]+)\/?([^\/]*)\/?(.*)/);
            var name, params, channelName;
            if (bits) {
                channelName = bits[1].capitalize();
                name = bits[2] ? bits[2].camelize().capitalize() : defaultName;

                params = bits[3].split('/');
            }
            else {
                channelName = defaultChannelName;
                name = defaultName;
                params = [];
            }
//alert(bits);
            return {name: name, channelName: channelName, params: params, uri: exports.makeUri(channelName, name, params)};
        };

        var callback = function(hash){
            var result = parse(hash),
                name = result.name,
                channelName = result.channelName,
                params = result.params;

            var fullName = channelName + name;

            // 系统默认路由
            if (TF.Core.ComponentMgr.has(fullName)) {
                TF.Core.Application.publish('GlobalRoute', [result.uri, [channelName, name, params]]);
                TF.Core.ComponentMgr.post(fullName, 'component-route', params);
            }
            else {
                // 非法参数
                window.location = '#tf-' + defaultChannelName.toLowerCase() + '/' + defaultName.toLowerCase();
            }

            // 额外路由
            var reg, isMatch = false;
            addtionRouter.forEach(function(item, index) {
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
                            TF.Core.Application.publish('GlobalRoute', [result.uri, [channelName, name, params]]);
                            TF.Core.ComponentMgr.post(value, 'component-route', params);
                        }
                    }
                });
            });

        };

        var exports = {
            create: function(router, channelName, name) {
                addtionRouter = router || addtionRouter;
                defaultChannelName = channelName || defaultChannelName;
                defaultName = name || defaultName;

                TF.Core.Application.subscribe('GlobalComponentLoaded', function(){
                    locationHash = new TF.Library.LocationHash();
                    locationHash.on('hashChanged', function(e){
                        callback(e.hash);
                    });
                    locationHash.start();
                });
            },

            // 解析 hash 中的字符串，取得里面的信息
            parseUri: function(uri) {
                return parse(uri || location.hash);
            },

            makeUri: function(channelName, name, params) {
                channelName = channelName || '';
                name = name || '';
                params = params || [];

                channelName = channelName.toLowerCase();
                name = name.decamelize().slice(1);
                params = params.join('/');

                return [channelName, name, params].join('/');
            },

            go: function(uri) {
                if (locationHash) {
                    locationHash.setHash(uri);
                }
            }
        };

        return exports;
    }();


    Dom.ready(function(){
        appReady = true;
        TF.Core.Application.publish('DomReady');
        // 执行页面默认的装载完成函数
        if (TF.Ready != undefined) {
            TF.Ready();
        }
    });


    // 挂载到 QWrap 上
    QW.provide({
        TF: TF
    });

}());


// 支持窗体部分
;(function(){
    var mix = QW.ObjectH.mix,
        bind = QW.FunctionH.bind;

    TF.Core.WindowMgr = function() {
        var defaultOptions = {
            "wrapId": 'transformers_win',
            "className": "panel-t1",
            "title": "标题",
            "header": '',
            "body": '',
            "footer": '',
            "withClose":true,
            "withCorner":false,
            "withCue":false,
            "withShadow":true,
            "withBgIframe":false,
            "keyEsc":false,
            "withMask":true,
            "dragable":true,
            "resizable":false,
            "posCenter":true,
            "posAdjust":true
        };

        var windows = new TF.Library.Hash();

        var disableButton = function(id) {
            W('#' + id).query('.button').attr('disabled', 'disabled');
        };

        var enableButton = function(id) {
            W('#' + id).query('.button').removeAttr('disabled');
        };

        var windowSys = {
            clickButton: function(button) {
                if (button) {
                    this.button = button;
                }

                if (!this.disableButton || this.button == 'close') {
                    // 禁用所有按钮
                    this.disable();

                    var args = {
                        close: (this.button != 'ok'),
                        button: this.button,
                        enabled: (this.button != 'ok')
                    };

                    this.instance.sys.postMessage('click-button', args);

                    if (args.enabled) {
                        this.enable();
                    }

                    if (args.close) {
                        this.close();
                    }
                }
            },

            // 关闭按钮
            disable: function() {
                this.disableButton = true;
                disableButton(this.panel.wrapId);
            },

            // 允许按钮
            enable: function() {
                this.disableButton = false;
                enableButton(this.panel.wrapId);
            },

            close: function() {
                if (this.instance) {
                    if (this.instance.DomDestroy() === false) {
                        return;
                    }

                    this.instance.sys.cancelRequest();
                    this.instance.sys.postMessage('component_destroy');
                }

                // 清除表单验证
//                if (this.validation) {
//                    this.validation.clear();
//                }
                this.options.fn(this, this.button);
                this.instance = null;

                // 先隐藏后销毁
                if (this.panel) {
                    this.panel.hide();
                    this.panel.dispose();
                }
            }

        };

        // 构建按钮
        var makeButton = function(id, buttons, defaultButtons) {
            // 移除原有关闭按钮
            W('#' + id + ' span.close').removeNode();
            // 添加新的关闭按钮
            W('#' + id).appendChild(W('<span class="button close" data-button="close"></span>')[0]);

            var btns = new TF.Library.Hash(buttons);
            btns.combine(defaultButtons || {'ok': '确定'});
            var ft = W('#' + id + ' .ft');
            var el;
            btns.forEach(function(value, key){
                el = W('<button class="button ' + key + '" data-button="' + key + '">' + value + '</button>');
                ft.appendChild(el);
            });
        };

        var bindButtonEvent = function(id, fn) {
            W('#' + id).delegate('.button', 'click', function(e){
                var el = W(e.target);
                if (el.attr('disabled') == 'disabled') {
                    return;
                }
                fn(W(e.target).attr('data-button'));
            });
        };

        var getId = function() {
            return 'transformers_win_' + TF.Helper.Utility.random();
        };

        var exports = {
            show: function(options){
                options = options || {};
                mix(options, defaultOptions);

                options.wrapId = getId();

                var panel = new QW.BasePanel(options);

                panel.show(null, null, options.width || 300);
                // 加载组件
                options.renderTo = '#' + options.wrapId + ' .bd';
                var mgr = TF.Core.Application.createComponentMgrInstance();
                var obj = new TF.Library.ComponentLoader(options, mgr);
                obj.on('complete', function(eventObj){

                    // 借给组件一些窗体管理函数
                    eventObj.instance.win = {
                        panel: panel,
                        instance: eventObj.instance,
                        options: options
                    };
                    mix(eventObj.instance.win, windowSys, true);

                    makeButton(options.wrapId, options.buttons, {'ok': '确定', 'cancel': '取消'});
                    bindButtonEvent(options.wrapId, function(button){
                        eventObj.instance.win.clickButton(button);
                    });
                });
                obj.load();
                // 显示加载中
            },

            alert: function(title, msg, width, fn, options){
                options = options || {};
                mix(options || {}, defaultOptions);

                options.wrapId = getId();

                options.title = title;
                options.body = '<div class="content">' + msg + '</div>';

                var panel = new QW.BasePanel(options);

                makeButton(options.wrapId, options.buttons || {'ok':''});
                bindButtonEvent(options.wrapId, function(button){
                    var args = {
                        close: true,
                        enabled: true
                    };

                    if (Object.isFunction(fn)) {
                        fn(button, args, panel);
                    }

                    if (args.enabled) {
                        enableButton(options.wrapId);
                    }
                    else {
                        disableButton(options.wrapId);
                    }

                    if (args.close) {
                        panel.hide();
                        panel.dispose();
                    }
                });
                panel.show(null, null, width || 300);
            },

            confirm: function(title, msg, width, fn, options){
                options = options || {};
                options.buttons = options.buttons || {'yes':'是', 'no': '否', 'cancel':'取消'};
                this.alert(title, msg, width, fn, options);
            },

            prompt: function(title, msg, width, fn, options){
                options = options || {};
                mix(options || {}, defaultOptions);

                options.wrapId = getId();

                options.title = title;
                options.body = '<div class="prompt-content">' + msg + '</div>';

                var el;
                var tmp = W('<div></div>');

                if (options.multiline) {
                    el = W(Dom.createElement('textarea', {
                        'class': options.inputClass || ''
                    })).css({'width': options.inputCol || '100%', 'height': options.inputRow || '50px'});
                }
                else {
                    el = W(Dom.createElement('input', {
                        'type': 'text',
                        'class': options.inputClass || '',
                        'size': options.inputSize || '10'
                    })).css({'width': options.inputCol || '100%'});
                }

                tmp.appendChild(el);

                options.body += '<div class="input">' + tmp.html() + '</div>';

                var panel = new QW.BasePanel(options);

                makeButton(options.wrapId, options.buttons || {'ok':'确定', 'cancel':'取消'});
                bindButtonEvent(options.wrapId, function(button){
                    var args = {
                        close: true,
                        enabled: true
                    };

                    if (Object.isFunction(fn)) {
                        var text = '';

                        if (options.multiline) {
                            text = W('#' + options.wrapId + ' .bd textarea').val();
                        }
                        else {
                            text = W('#' + options.wrapId + ' .bd input').val();
                        }

                        fn(button, text, args, panel);
                    }

                    if (args.enabled) {
                        enableButton(options.wrapId);
                    }
                    else {
                        disableButton(options.wrapId);
                    }

                    if (args.close) {
                        panel.hide();
                        panel.dispose();
                    }
                });
                panel.show(null, null, width || 300);
            }

        };

        return exports;
    }();

}());
