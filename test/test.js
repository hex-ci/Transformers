describe('Transformers', function(){
    describe('定义组件', function(){
        it('应该定义一个名为 Home 的组件', function(){
            var cls = TF.define('Home', {
                DomReady: function() {
                }
            });

            expect(typeof cls).to.equal('function');
        });
    });
});