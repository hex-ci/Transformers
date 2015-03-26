
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
            $.getScript(TF.Helper.Utility.getComponentJsUrl(this.appName, this.name))
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
                console && console.error(exception.message);
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
                $.getScript(TF.Helper.Utility.getComponentJsUrl(appName, name), function(){
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
