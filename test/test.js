var expect = chai.expect

describe('Transformers', function(){
    describe('初始化', function(){
        it('TF 对象应该存在 version 属性', function(){
            expect(TF).to.have.ownProperty('version');
        });

        it('TF 对象应该存在 Core 名字空间', function(){
            expect(TF).to.have.ownProperty('Core');
        });

        it('TF 对象应该存在 Component 名字空间', function(){
            expect(TF).to.have.ownProperty('Component');
        });

        it('TF 对象应该存在 Config 名字空间', function(){
            expect(TF).to.have.ownProperty('Config');
        });

        it('TF 对象应该存在 Library 名字空间', function(){
            expect(TF).to.have.ownProperty('Library');
        });

        it('TF 对象应该存在 Helper 名字空间', function(){
            expect(TF).to.have.ownProperty('Helper');
        });
    });

    describe('组件', function(){
        it('应该定义一个名为 Home 的组件并放入容器中', function(done){
            TF.Core.Application.create({
                baseUrl: "./"
            });

            var cls = TF.define('Home', {
                DomReady: function() {
                    done();
                },

                // Action 是组件对外的接口
                testAction: function(args) {
                    // 渲染静态模板
                    this.sys.renderStaticTemplate('content');

                    this.renderOk();
                },

                // 组件私有方法，外部无法访问
                renderOk: function() {
                }
            });

            expect(typeof cls).to.equal('function');

            TF.Core.ComponentMgr.add([{
                name: 'Home',
                appendRender: false,
                lazyRender: false,
                hide: false,
                applyTo: '#content'
            }]);

            TF.Core.Application.bootstrap();
        });

        it('获取组件代理对象', function(){
            var obj = TF.Core.ComponentMgr.getAgent('Home[0]');

            expect(obj).to.have.ownProperty('test');
        });

        it('调用组件 Action 方法，并渲染视图', function() {
            var obj = TF.Core.ComponentMgr.getAgent('Home[0]');

            obj.test();

            expect($('.TFTarget-content').html()).to.have.string('你好！世界！');
        });

        it('测试组件事件', function() {
            $('.TFTarget-content').html('')

            $('.js-test').trigger('click');

            expect($('.TFTarget-content').html()).to.have.string('你好！世界！');
        });
    });

});