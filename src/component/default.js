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
            console && console.error('Component [' + this.sys.getComponentName() + '] load error! Please refresh!');
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