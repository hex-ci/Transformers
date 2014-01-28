// 名为 Home 的组件
TF.Component.Home = TF.Core.ComponentMgr.create({
    // 组件 DOM 准备就绪会调用 DomReady 方法
    DomReady: function() {
        console.log('ready!');
    },

    // Action 是组件对外的接口
    testAction: function(args) {
        console.log('test!');

        // 渲染动态模板，会加载模板的数据接口
        // 本例是 data/home-model.js 文件
        this.sys.renderTemplate('content', {
            fn: this.renderReady
        });
    },

    // 组件私有方法，外人无法访问
    renderReady: function(result) {
        console.log('request result:');
        console.log(result);
    }
});