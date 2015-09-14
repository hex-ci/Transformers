
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
        this._preload(proxy(this._analyseMentor, this));
    },

    _preload: function(callback, fullName) {
        var me = this;
        var appName;
        var name;

        if (fullName) {
            appName = TF.Helper.Utility.getApplicationName(fullName);
            name = TF.Helper.Utility.getComponentName(fullName);
        }
        else {
            appName = this.appName;
            name = this.name;
        }

        // Application Name 不存在则创建
        TF.Component[appName] = TF.Component[appName] || {};

        var isLoad = (typeof TF.Component[appName][name] !== 'undefined');

        if (isLoad) {
            if (TF.Component[appName][name].prototype.Mentor) {
                this._preload(callback, TF.Component[appName][name].prototype.Mentor.name);
            }
            else {
                callback();
            }
        }
        else {
            $.ajax({
                type: 'GET',
                url: TF.Helper.Utility.getComponentJsUrl(appName, name),
                dataType: 'script',
                cache: true
            })
            .done(function(){
                if (typeof TF.Component[appName][name] !== 'undefined') {
                    // 加载成功，然后分析依赖
                    if (TF.Component[appName][name].prototype.Mentor) {
                        me._preload(callback, TF.Component[appName][name].prototype.Mentor.name);
                    }
                    else {
                        callback();
                    }
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

    // 依赖分析
    _analyseMentor: function() {
        this._loadMentor(proxy(this._createInstance, this), TF.Component[this.appName][this.name]);
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

        // 设置是否使用借用组件的视图
        var mentor = this._instance.Mentor;
        if (mentor) {
            if (mentor.__view) {
                this._instance.sys.viewName = mentor.__view;
            }

            if (mentor.viewData) {
                this._instance.sys.options.data = this._instance.sys.options.data || {};
                mix(this._instance.sys.options.data, mentor.viewData, true);
            }
        }

        this._initInstance();
    },

    _loadMentor: function(callback, myClass) {
        var me = this;

        var mentor;
        var appName;
        var name;

        mentor = myClass.prototype.Mentor;

        if (mentor && mentor.name) {
            appName = TF.Helper.Utility.getApplicationName(mentor.name);
            name = TF.Helper.Utility.getComponentName(mentor.name);

            this._loadMentor(function(){
                me._initMentor(myClass, TF.Component[appName][name]);
                callback();
            }, TF.Component[appName][name]);
        }
        else {
            callback();
        }
    },

    // 初始化继承的组件
    _initMentor: function(sourClass, mentorClass) {
        var sourPrototype = sourClass.prototype;
        var mentorPrototype = mentorClass.prototype;

        // 把父类方法放入子类或当前实例
        mix(sourPrototype, mentorPrototype, function(des, src, key){
            if (key == 'Mentor' || sourPrototype.hasOwnProperty(key)) {
                // 如果子类重载了父类的方法，则增加一个 _super 方法到当前实例中
                // _super 方法参考了 http://ejohn.org/blog/simple-javascript-inheritance
                if ($.isFunction(src) && $.isFunction(des) && /\b_super\b/.test(des)) {
                    return (function(name, fn){
                        return function() {
                            var tmp = this._super;

                            // Add a new ._super() method that is the same method
                            // but on the super-class
                            this._super = mentorPrototype[name];

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

        // 设置是否使用借用组件的视图
        if (sourPrototype.Mentor.useView) {
            if (mentorPrototype.Mentor && mentorPrototype.Mentor.useView) {
                sourPrototype.Mentor.__view = mentorPrototype.Mentor.__view;
            }
            else {
                sourPrototype.Mentor.__view = sourPrototype.Mentor.name;
            }
        }

        if (mentorPrototype.Mentor) {
            mix(sourPrototype.Mentor.viewData, mentorPrototype.Mentor.viewData, true);

            if (mentorPrototype.Mentor.__path) {
                sourPrototype.Mentor.__path = mentorPrototype.Mentor.__path;
            }
            else {
                sourPrototype.Mentor.__path = [];
            }
        }
        else {
            sourPrototype.Mentor.__path = [];
        }

        sourPrototype.Mentor.__path.push(sourPrototype.Mentor.name);
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
