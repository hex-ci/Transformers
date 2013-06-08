// 测试
TF.Component.Home = TF.Core.ComponentMgr.create({
    // 需要 load 完成事件，请重载此函数！
    DomReady: function() {
        console.log('ready!');
    },

    testAction: function(args) {
        console.log('test!');
        this.sys.renderTemplate('content', {fn: this.renderReady});
    },

    renderReady: function(result) {
        console.log('request result:');
        console.log(result);
    }
});