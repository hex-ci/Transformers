
$(document).ready(function(){
    appReady = true;
    TF.Core.Application.publish('DomReady');
    // 执行页面默认的装载完成函数
    if (TF.ready != undefined) {
        TF.ready();
    }
});


return TF;

}));