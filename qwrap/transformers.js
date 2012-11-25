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
        'version': '0.0.1',
        'build': '20121125'
    };

    // 创建名字空间
    namespace('Helper', TF);
    //namespace('Component', TF);

    QW.provide({
        TF: TF
    });
}());


// 一些工具类
(function () {
    // 实用工具静态类，包括一些常用例程
    TF.Helper.Utility = {
        baseUrl: function(){
            return '/scripts/';
        }

        // 生成随机数字字符串
        , random: function() {
            return ((new Date()).getTime() + Math.floor(Math.random()*9999));
        },

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

    TF.Hash = function() {
        this.data = object || {};
        return this;
    };
    Object.mix(TF.Hash.prototype, {
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

        each: function(fn, bind){
            Object.map(this.data, fn, bind);
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
}());


// 组件类
(function () {
    var mix = QW.ObjectH.mix;

    var decamelize = function(s) {
        return s.replace(/[A-Z]/g, function(a) {
            return "-" + a.toLowerCase();
        }).slice(1);
    };

    // 定义 Component 类，用于加载组件
    TF.Component = function(options) {
        mix(this.options, options, true);
        this.initialize();
    };

    mix(TF.Component.prototype, {
        options: {
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
        }

        // 构造函数
        , initialize: function() {
            //if ($(this.options.renderTo).length == 0 && $(this.options.applyTo).length == 0) return;

            this._instance = null;
            this._rendered = false;
            this._instanced = false;
            this._refreshing = false;
            this._hidden = this.options.hide;

            this.name = this.options.name;

            // 注册到组件管理器
            TF.componentMgr.register(this.options.name, this);

            if (this.options.skipInit)
            {
                this.createInstance();
            }
            else if (!this.options.lazyInit)
            {
                this.preload();
            }
        }

        , preload: function() {
            var isLoad = (typeof TF.Component[this.name] == 'undefined' ? false : true);

            if (isLoad)
            {
                this.createInstance();
            }
            else
            {
                loadJs(TF.Helper.Utility.baseUrl() + 'js/components/' + decamelize(this.name) + '.js', function(){
                    if (typeof TF.Component[this.name] != 'undefined') {
                        // 加载成功
                        this.createInstance();
                    }
                    else {
                        // 加载失败
                        // 应该返回错误，或者记录日志
                    }
                });
            }
        }

        // 创建当前内容的名字空间实例
        , createInstance: function() {
            try {
                this._instance = new TF.Component[this.name](this.options);
            }
            catch(e) {
                //console.log(e);
            }

            // 组件实例化正确才加载内容
            if (this._instance) {
                this._instanced = true;

                // 实例准备就绪
                this._instance.InstanceReady(this);

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
            }
            else
            {
                //alert('组件装载出错，请刷新页面。');
                //this.fireEvent('failure', this);
            }
        }

        // Ajax 装载组件内容
        , loadContent: function() {
            if (!this._loader)
            {
                this._loader = new QW.Ajax({
                    url: this.options.url,
                    data: this.options.data,
                    onsucceed: Function.bind(this.loadComplete, this),
                    onerror: Function.bind(function() {
                        //this.loadError('4. Ajax Error!');
                    }, this)
                });
            }

            this._loader.send();
        }

        , loadComplete: function(response) {
            var temp, responseTree;

            if (Object.isString(response))
            {
                var match = response.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (match) response = match[1];
                temp = Dom.createElement('div');
                temp.innerHTML = response;
                responseTree = W(temp.childNodes);
            }
            else if (Object.isWrap(response))
            {
                responseTree = response.first();
            }

            // 如果没有装载正确，则立即返回
            if (!this._instance || !response || !responseTree)
            {
                //alert('组件装载出错，请刷新页面。');
                //this._loadError('1. Ajax Error!');
                return;
            }

            var element = responseTree;

            // 存储经过包装的元素
            this._instance.setTopElement(element);

            // 是否以隐藏的方式渲染组件
            if (this._hidden)
            {
                this.hide();
            }

            if (!this.options.applyTo)
            {
                if (!this.options.appendRender)
                {
                    W(this.options.renderTo).empty();
                }
                W(this.options.renderTo).appendChild(element);
            }

            this._instance.DomReady(this);

            // 渲染完毕
            this._rendered = true;

            return true;
        }
    });
}());

// 组件管理器
(function () {
    TF.componentMgr = {
        initialize: function() {
            this._length = 0;
            // 组件关联数组，key 为组件名，value 为组件实例
            this._components = new TF.Hash();
            // 事件订阅列表
            this._subscriptions = new TF.Hash();
            // 预装载数组
            this._preload = [];
            // 预装载时候的 Show 消息数组
            this._preloadShow = [];
            // 后台组件关联数组，key 为组件名，value 为组件创建 Options
            this._backgroundComponents = new TF.Hash();
            // 后台某组件最后收到的消息，key 为组件名，value 为消息体（消息名+消息参数的数组）
            this._backgroundLastMessage = new TF.Hash();
            // 是否正在使用进度条装载组件
            this._isLoading = false;
            // 已装载的组件名数组
            this._loadedComponents = [];
        },

        // 启动组件装载进程，默认为并行装载，暂不支持顺序加载
        startLoad: function(isSequential) {
            if (this._isLoading) return;

            this._preload.forEach(function(item) {
                new TF.Component(item);
            });
        },

        // 是否进度条还在装载中
        isLoading: function() {
            return this._isLoading;
        },

        // 组件进度条装载完成（前半部分）
        _completeProgress: function() {
            window.clearInterval(this._drawTimer);
            this._drawTimer = null;

            this._finishProgress();
        },

        // 进度条最终全部完成
        _finishProgress: function() {
            this._isProgress = false;

            window.clearInterval(this._drawTimer);
            this._drawTimer = null;

            this._complete.call(this, this._length);
            this._progress = $.empty;
            this._complete = $.empty;
            this._timeout = $.empty;

            this._preloadShow.forEach(function(item){
                this.show(item);
            }, this);
            this._preloadShow.length = 0;
        },

        // 添加组件到预装载队列，等候顺序装载或者并行装载
        add: function(object) {
            if (this._isLoading) return;

            var number = 1;

            this._length += number;
            this._preload.push(object);

            return this;
        },

        // 注册组件
        register: function(name, instance) {
            //this._length++;
            if (this._components.has(name))
            {
                // 已存在的实例
                this._components.get(name).push(instance);
            }
            else
            {
                this._components.set(name, [instance]);
            }
        },

        // 删除组件
        remove: function(name) {
            if (this._components.has(name))
            {
                // 删除已存在的实例
                this._components.erase(name);
            }
        },

        // 投递事件给具体的实例
        post: function(name, msg, args) {
            name = TF.Helper.Utility.toArray(name);

            name.forEach(function(item){
                if (this._components.has(item))
                {
                    // 处理事件订阅
                    if (this._subscriptions.has(item + msg))
                    {
                        this._subscriptions.get(item + msg).forEach(function(func) {
                            // 谁作为 this 需要考虑下
                            func.apply(func, [args, msg]);
                        }, this);
                    }

                    // 传递给组件
                    this._components.get(item).forEach(function(com) {
                        com.postMessage(msg, args);
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
            if (this._isLoading)
            {
                this._preloadShow.push(name);
                return;
            }

            if (this.has(name))
            {
                var id, el, com_name;
                this._components.get(name).forEach(function(item) {
                    el = item.getElement();
                    if (el)
                    {
                        id = el.attr('id');
                        // 先隐藏除 name 所指定的组件外的其它组件
                        //alert(el.getParent().getChildren().length);
                        el.parent().find('.TFComponent').each($.bind(function(com_el){
                            if (id != com_el.attr('id'))
                            {
                                com_name = com_el.retrieve('ComponentName');
                                if (com_name)
                                {
                                    this.post(com_name, 'component_hide');
                                }
                            }
                        }, this));

                        // 然后显示 name 所指定的组件
                        com_name = el.retrieve('ComponentName');
                        if (com_name && item.isHidden())
                        {
                            this.post(com_name, 'component_show');
                        }
                    }
                }, this);
            }
        },

        has: function(name) {
            return this._components.has(name) || this._backgroundComponents.has(name);
        },

        // 取某个名字下的组件实例个数
        length: function(name) {
            if (this._components.has(name))
            {
                return this._components.get(name).length;
            }
            else
            {
                return 0;
            }
        },

        // 以某个函数订阅某个组件的事件
        subscribe: function(name, msg, fn, bind) {
            var func = Function.bind(fn, bind || fn);
            if (this._subscriptions.has(name + msg))
            {
                // 已存在的组件订阅
                this._subscriptions.get(name + msg).push(func);
            }
            else
            {
                this._subscriptions.set(name + msg, [func]);
            }

            // 返回 subscription 句柄
            return {'key': name + msg, 'value': func};
        },

        // 取消订阅
        unsubscribe: function(handle) {
            if (this._subscriptions.has(handle.key))
            {
                this._subscriptions.get(handle.key).erase(handle.value);
            }
        }
    };

    TF.componentMgr.initialize();
}());

Dom.ready(function(){
    // 执行页面默认的装载完成函数
    if (TF.run != undefined)
    {
        TF.run();
    }
});