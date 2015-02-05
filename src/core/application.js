
// 应用程序部分
var appReady = false;
var appSubscriptions = new TF.Library.Hash();
var defaultApplicationName = '';

TF.Core.Application = {
    // 创建应用
    create: function(name, config) {
        var appName = 'Transformers';
        var appConfig;

        if ($.type(name) == 'string') {
            appName = name;
            appConfig = config;
        }
        else {
            appConfig = name;
        }

        TF.Config[appName] = mix({}, defaultConfig, true);
        mix(TF.Config[appName], appConfig, true);

        // 首次创建的应用为默认应用
        if (!defaultApplicationName) {
            defaultApplicationName = appName;
        }
    },

    isReady: function() {
        return appReady;
    },

    // 订阅主题
    subscribe: function(name, fn, scope) {
        var key = TF.Helper.Utility.random();

        if (!appSubscriptions.has(name)) {
            appSubscriptions.set(name, new TF.Library.Hash());
        }

        appSubscriptions.get(name).set(key, {'fn': fn, 'scope': scope});

        // 返回 subscription 句柄
        return {'key': name, 'value': key};
    },

    // 取消订阅
    unsubscribe: function(handle) {
        if (handle && appSubscriptions.has(handle.key)) {
            appSubscriptions.get(handle.key).erase(handle.value);
        }
    },

    // 发布主题
    publish: function(name, args) {
        if (appSubscriptions.has(name)) {
            appSubscriptions.get(name).each(function(i, item) {
                if (item.fn) {
                    item.fn.apply(item.scope, args || []);
                }
            });
        }
    },

    // 自动加载页面中的组件
    bootstrap: function(element, componentMgr) {
        element = $(element).length > 0 ? $(element) : $('body');
        componentMgr = componentMgr || TF.Core.ComponentMgr;

        var components = element.find('*').filter(function(index, el){
            return el.tagName.toLowerCase().indexOf('tf:') === 0;
        });

        if (components.length > 0) {
            var args;
            var name;
            var attributes;
            var exclude = ['id', 'class', 'style'];

            components.each(function(index, el) {
                el = $(el);

                args = {};

                name = TF.Helper.Utility.toComponentName(el.prop('tagName').toLowerCase().slice(3));

                // 把自定义标签的内容存储成 Document Fragment
                var fragment;
                var fragmentElement = null;
                if (el.children().length > 0) {
                    fragment = document.createDocumentFragment();
                    fragment.appendChild($('<div></div>')[0]);
                    fragmentElement = fragment.childNodes[0];
                    fragmentElement.innerHTML = el.html();
                }

                attributes = $.makeArray(el[0].attributes);

                $.each(attributes, function(i, item){
                    if ($.inArray(item.name, exclude) < 0) {
                        args[$.camelCase(item.name)] = ((item.name == item.value || item.value === '') ? true : item.value);
                    }
                });

                args.name = name;
                args.replaceRender = true;
                args.renderTo = el;
                args.__element = fragmentElement;

                componentMgr.add(args);
            });
        }

        componentMgr.startLoad();
    }
};
