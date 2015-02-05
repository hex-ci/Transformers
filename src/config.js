var defaultConfig = {
    baseUrl: '/',
    resourceVersion: 'ver',
    templateUriPattern: '{$name.join("-")}-view.html',
    jsUriPattern: 'resource/js/{$name.join("-")}.js?v={$ver}',
    dataUriPattern: 'data-{$name.join("-")}-{$uri}.js',
    defaultDataUri: 'model',
    debug: false,

    // 提供一些和页面展现相关的方法给框架，类似实现一些框架所需要的接口
    mentor: {}
};