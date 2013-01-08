/*

Transformers for QWrap 核心库

*/

/**
 * 声明 Transformers 包
 * @author: Hex
 */

(function () {
    var TF,
        Transformers = TF = Transformers || {
        'version': '0.0.2',
        'build': '20121125'
    };

    var mix = QW.ObjectH.mix,
        bind = QW.FunctionH.bind;

    // 创建名字空间
    namespace('Core', TF);
    namespace('Component', TF);
    namespace('Library', TF);
    namespace('Helper', TF);

    TF.Core.config = {
        name: '',
        baseUrl: '/scripts/'
    };

    // 一些工具类

    // 实用工具静态类，包括一些常用例程
    TF.Helper.utility = {
        baseUrl: function(){
            return TF.Core.config.baseUrl;
        }

        , siteUrl: function(uri){
            return TF.Core.config.baseUrl + uri;
        }

        , getApplicationPath: function() {
            return TF.Core.config.name ? TF.Core.config.name.toLowerCase() + '/' : '';
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

        each: function(fn, scope){
            Object.map(this.data, fn, scope);
        },

        extend: function(properties){
            Object.mix(this.data, properties || {});

            return this;
        },

        combine: function(properties){
            Object.map(properties || {}, function(key, value){
                this.include(key, value);
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
            if (this.data[key] == undefined) {
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


    // 组件类

    var decamelize = function(s) {
        return s.replace(/[A-Z]/g, function(a) {
            return '_' + a.toLowerCase();
        }).slice(1);
    };

    TF.Library.ComponentLoader = function(options) {
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
            data: '',               // URL 参数
        };
        mix(this.options, options, true);
        CustEvent.createEvents(this, ['beforeswitch', 'afterswitch']);
        return this;
    };
    mix(TF.Library.ComponentLoader.prototype, {
        load: function(options) {
            mix(this.options, options || {}, true);

            //if ($(this.options.renderTo).length == 0 && $(this.options.applyTo).length == 0) return;

            this._instance = null;
            this._rendered = false;
            this._instanced = false;
            this._refreshing = false;
            this._hidden = this.options.hide;
            this.fullName = this.options.name;

            var name = decamelize(this.options.name).split('_');
            this.channelName = name[0].capitalize();
            name[0] = '';
            this.name = name.join('-').camelize().capitalize();

            this.preload();
        }

        , preload: function() {
            // 创建组件所需的名字空间
            namespace(this.channelName, TF.Component);

            var isLoad = (typeof TF.Component[this.channelName][this.name] == 'undefined' ? false : true);

            if (isLoad)
            {
                this.createInstance();
            }
            else
            {
                loadJs(TF.Helper.utility.baseUrl() + 'resource/js/' + TF.Helper.utility.getApplicationPath() + this.channelName.toLowerCase() + '/components/' + decamelize(this.name) + '.js', bind(function(){
                    if (typeof TF.Component[this.channelName][this.name] != 'undefined') {
                        // 加载成功
                        this.createInstance();
                    }
                    else {
                        // 加载失败
                        // 应该返回错误，或者记录日志
                        this.fireEvent('failure', {instance: null, fullName: this.fullName, name: this.name, channelName: this.channelName});
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

                mix(this._instance.options, this.options, true);

                // 实例准备就绪
                this._instance.InstanceReady(this);

                this.fire('complete', {instance: this._instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
            }
            else
            {
                //alert('组件装载出错，请刷新页面。');
                this.fire('failure', {instance: null, fullName: this.fullName, name: this.name, channelName: this.channelName});
            }
        }

    });




    //TF.Component.create = function(){};
    //TF.Component.load = function(){};
    //TF.Core.ComponentLoader;
    //TF.Core.componentMgr;
    //TF.Core.Window;
    //TF.Core.windowMgr;


    // 组件系统内部方法
    var sys = {
        render: function() {
            //console.log(this);
            if (!this.options.lazyRender) {
                if (this.options.applyTo) {
                    //直接渲染
                    this.loadComplete(W(this.options.applyTo));
                }
                else if (this.options.contentEl) {
                    //直接渲染
                    this.loadComplete(W(this.options.contentEl).cloneNode(true));
                }
                else {
                    this.loadContent();
                }
            }
        },

        // Ajax 装载组件内容
        loadContent: function() {
            if (this.options.url == '')
            {
                this.options.url = TF.Helper.utility.getApplicationPath() + this.channelName.toLowerCase() + '/components/' + decamelize(this.name) + '/view';
            }

            if (this.options.url.indexOf("http://") < 0)
            {
                this.options.url = TF.Helper.utility.siteUrl(this.options.url);
            }

            if (!this._loader)
            {
                this._loader = new QW.Ajax({
                    url: this.options.url,
                    data: this.options.data,
                    onsucceed: bind(this.loadComplete, this),
                    onerror: bind(function() {
                        //this.loadError('4. Ajax Error!');
                    }, this)
                });
            }

            this._loader.send();
        },

        loadComplete: function(ajaxEvent) {
            var response, responseTree;

            response = ajaxEvent.target.requester.responseText;

            if (Object.isString(response))
            {
                responseTree = W(Dom.createElement('div')).html(response).query('.TFComponent');
            }
            else if (Object.isWrap(response))
            {
                responseTree = response.first();
            }
            else {
                // error
                return;
            }


            // 如果没有装载正确，则立即返回
            if (!this._instance || responseTree.length == 0)
            {
                //alert('组件装载出错，请刷新页面。');
                //this._loadError('1. Ajax Error!');
                return;
            }

            var element = responseTree;

            // 存储经过包装的元素
            this._instance.sys.setTopElement(element);

            // 是否以隐藏的方式渲染组件
            if (this._hidden)
            {
                this._instance.hide();
            }

            // 放入 DOM 树中
            if (!this._refreshing)
            {
                if (!this.options.applyTo)
                {
                    if (!this.options.appendRender)
                    {
                        W(this.options.renderTo).empty();
                    }
                    W(this.options.renderTo).appendChild(element);
                }
            }

            if (this._instance.sys.query('.js-component-error').length == 0)
            {
                this._instance.sys.query().attr('data-tf-component', this.fullName);

                // 判断是否是客户端渲染
                var template = this._instance.sys.query('script[class~=TFTemplate]');
                var data = this._instance.sys.query('script[class~=TFData]');

                if (template.length > 0 && data.length > 0)
                {
                    // 是客户端渲染，执行模板操作
                    var obj = null;
                    try {
                        obj = QW.JSON.parse(data.html());
                    } catch (e) {}
                    this._instance.getElement().html(baidu.template(template.html(), {'ComponentData': obj}));
                }

                if (!this._refreshing)
                {
                    // 从 component 实例继承的 options
                    this._instance.options = this.options;
                }

                // 自动提取页面中的 options 值
                var options = this._instance.getElement('[class~=options]');
                var name, tag;
                options.forEach(function(e){
                    name = e.attr('name');
                    tag = e.attr('tagName').toLowerCase();
                    if (tag == 'input' || tag == 'textarea')
                    {
                        this._instance.options[name] = e.attr('value');
                    }
                    else
                    {
                        this._instance.options[name] = e.attr('text');
                    }
                }, this);

                this.fire('complete', {instance: this._instance, fullName: this.fullName, name: this.name, channelName: this.channelName});

                // 页面全部装载完成！
                if (this._refreshing)
                {
                    this._instance.DomRefreshReady(this);
                    this.fire('refreshReady', {instance: this._instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
                }
                else
                {
                    this._instance.DomReady(this);
                    this.fire('ready', {instance: this._instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
                }
            }
            else
            {
                this.fire('failure', {instance: this._instance, fullName: this.fullName, name: this.name, channelName: this.channelName});
            }

            // 渲染完毕
            this._rendered = true;

            return true;
        },

        query: function(selector) {
            return this._topElement.query(selector);
        },

        setTopElement: function(el, prefix) {
            prefix = prefix || 'transformers_gen';
            this._topElement = W(el).attr('id', prefix + '_' + TF.Helper.utility.random());
        },
        unsetTopElement: function() {
            if (this._topElement && this._topElement.length > 0)
            {
                this._topElement.parentNode().empty();
                this._topElement = null;
            }
        },
        setName: function(name, realname) {
            //this._name = T.string.hyphenate(name).replace(/-/g, '_').slice(1);
            //this._real_name = T.string.hyphenate(realname).replace(/-/g, '_').slice(1);
        },
        setAppName: function(name, realname) {
            //this._channelName = name.toLowerCase();
            //this._realChannelName = realname.toLowerCase();
        },
        // 取自己的组件名，有别名取别名，否则取真名
        getComponentName: function() {
            //return T.string.capitalize(this._channelName) + T.string.capitalize(T.string.camelCase(this._name.replace(/_/g, '-')));
        },
        setLoadingMsg: function(msg) {
            //if (this._isLoadingMsg) return;
            //this._isLoadingMsg = true;
            //TF.Singleton.page.setLoadingMsg(msg);
        },

        // 显示组件
        show: function() {
            this._topElement.show();
            this._hidden = false;
        },

        // 隐藏组件
        hide: function() {
            this._topElement.show();
            this._hidden = true;
        },

        isHidden: function() {
            return this._hidden;
        }
    };

    TF.Component.Default = function(options) {
        this._name = ''; // 可能是别名，或者是真名，小写字母
        this._channelName = '';  // 组件 栏目 名称，可能是别名，小写字母
        this._hidden = false;
        this.options = {};
        this.sys = {
            instance: this
        };
        mix(this.sys, TF.Component.Default.prototype.sys);

        mix(this.options, options, true);
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
            ComponentObject._loadContent();
        },
        // 默认渲染错误回调函数
        RenderError: function(result) {
            //window.location = '#';
            //TF.Singleton.page.unsetLoadingMsg();
            //TF.Singleton.page.setErrorMsg(result.error);
            this._loaded();
        }
    });

    // 组件管理器
    TF.Core.componentMgr = function(){
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
            loadedComponents.push(e.fullName);

            if (components.has(e.fullName)) {
                components.set(e.fullName, [e.instance]);
            }

            // 判断是否立即渲染，暂时只支持立即渲染
            console.log(e.instance.sys);
            e.instance.sys.render();

            if (loadedComponents.length >= length)
            {
                completeProgress();
            }
        };

        // 最终全部完成
        var completeProgress = function() {
            //this._complete.call(this, this._length);

            preloadShow.forEach(function(item){
                this.show(item);
            }, exports);
            preloadShow.length = 0;
        };

        // 投递事件给控制器实例
        var postMessage = function(instance, msg, args) {
            //if (!this._rendered) return;

            //if (!$defined(args)) args = {};

            // before 用于处理消息返回值，表示是否继续传递消息
            var is_continue = true,
                funcName = msg.camelize();

            if (instance && Object.isFunction(instance[funcName + 'ActionBefore']))
            {
                is_continue = instance[funcName + 'ActionBefore'].call(instance, args);
            }

            if (is_continue === false)
            {
                return;
            }

            // 系统事件处理
            switch (msg)
            {
                case 'component-render':
                    instance.sys.render();
                    break;

                case 'component-refresh':
                    instance.sys.refresh();
                    break;

                case 'component-destroy':
                    instance.sys.destroy();
                    break;

                case 'component-show':
                    instance.sys.show();
                    break;

                case 'component-hide':
                    instance.sys.hide();
                    break;
            }

            // 把消息派发到组件实例中
            if (instance && Object.isFunction(instance[funcName + 'Action']))
            {
                instance[funcName + 'Action'].call(instance, args);
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

            // 启动组件装载进程，并行装载
            startLoad: function() {
                if (isLoading) return;

                preload.forEach(function(item) {
                    var loader = new TF.Library.ComponentLoader(item);
                    loader.on('complete', bind(loadComplete, this));
                    loader.load();
                });
            },

            // 是否进度条还在装载中
            isLoading: function() {
                return isLoading;
            },

            // 添加组件到预装载队列，等候装载
            add: function(object) {
                if (isLoading) return;

                var number = 1;

                length += number;
                preload.push(object);

                // 注册到组件管理器
                if (!components.has(object.name)) {
                    components.set(object.name, []);
                }

                return this;
            },

            // 删除组件
            remove: function(name) {
                if (components.has(name))
                {
                    // 删除已存在的实例
                    components.erase(name);
                }
            },

            // 投递事件给具体的实例
            post: function(name, msg, args) {
                name = TF.Helper.utility.toArray(name);

                name.forEach(function(item){
                    if (components.has(item))
                    {
                        // 处理事件订阅
                        if (subscriptions.has(item + msg))
                        {
                            subscriptions.get(item + msg).forEach(function(func) {
                                // 谁作为 this 需要考虑下
                                func.apply(func, [args, msg]);
                            }, this);
                        }

                        // 传递给组件
                        components.get(item).forEach(function(com) {
                            postMessage(item, msg, args);
                        });
                    }
                    else
                    {
                        // 发送给后台组件
                        //this._backgroundLastMessage.set(item, [msg, args]);
                        //this.loadBackgroundComponent(item);
                    }
                }, this);
            },

            // 显示当前容器中 name 所指定的组件，并且隐藏此容器中其它组件
            show: function(name) {
                if (isLoading)
                {
                    preloadShow.push(name);
                    return;
                }

                if (this.has(name))
                {
                    var id, el, comName, comEl;
                    components.get(name).forEach(function(item) {
                        el = item.getElement();
                        if (el.length > 0)
                        {
                            id = el.attr('id');
                            // 先隐藏除 name 所指定的组件外的其它组件
                            //alert(el.getParent().getChildren().length);
                            el.parentNode().query('.TFComponent').forEach(function(comEl){
                                comEl = W(comEl);console.log(id);
                                if (id != comEl.attr('id'))
                                {
                                    comName = comEl.attr('data-tf-component');

                                    if (comName)
                                    {
                                        this.post(comName, 'component_hide');
                                    }
                                }
                            }, this);

                            // 然后显示 name 所指定的组件
                            comName = el.attr('data-tf-component');
                            if (comName && item.sys.isHidden())
                            {
                                this.post(comName, 'component_show');
                            }
                        }
                    }, this);
                }
            },

            has: function(name) {
                return components.has(name) || backgroundComponents.has(name);
            },

            // 取某个名字下的组件实例个数
            length: function(name) {
                if (components.has(name))
                {
                    return components.get(name).length;
                }
                else
                {
                    return 0;
                }
            },

            // 以某个函数订阅某个组件的事件
            subscribe: function(name, msg, fn, scope) {
                var func = bind(fn, scope || fn);
                if (subscriptions.has(name + msg))
                {
                    // 已存在的组件订阅
                    subscriptions.get(name + msg).push(func);
                }
                else
                {
                    subscriptions.set(name + msg, [func]);
                }

                // 返回 subscription 句柄
                return {'key': name + msg, 'value': func};
            },

            // 取消订阅
            unsubscribe: function(handle) {
                if (subscriptions.has(handle.key))
                {
                    subscriptions.get(handle.key).erase(handle.value);
                }
            }
        };

        return exports;
    }();

    TF.Core.application = {
        create: function(config) {
            mix(TF.Core.config, config, true);
        }
    };



    // 挂载到 QWrap 上
    QW.provide({
        TF: TF
    });

}());

Dom.ready(function(){
    // 执行页面默认的装载完成函数
    if (TF.ready != undefined)
    {
        TF.ready();
    }
});