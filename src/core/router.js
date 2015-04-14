
// URI 路由部分
TF.Core.Router = (function() {
    var defaultName = 'Home';

    var locationHash = new TF.Library.LocationHash();

    // 额外的路由规则，不会影响系统既有路由规则
    var additionRouter = [];

    var parse = function(hash) {
        var bits = hash.match(/tf-([^\/]*)\/?(.*)/);
        var name, params;

        if (bits) {
            name = bits[1] ? TF.Helper.Utility.toComponentName(bits[1]) : defaultName;

            params = bits[2] ? bits[2].split('/') : [];
        }
        else {
            name = defaultName;
            params = [];
        }

        return {
            name: name,
            params: params,
            uri: exports.makeUri(name, params)
        };
    };

    var callback = function(hash){
        var result = parse(hash),
            name = result.name,
            params = result.params;

        var fullName = name;

        // 系统默认路由
        if (TF.Core.ComponentMgr.has(fullName)) {
            TF.Core.Application.publish('GlobalRoute', [result.uri, [name, params]]);
            TF.Core.ComponentMgr.post(fullName, 'component-route', params);
        }
        else {
            // 非法参数
            console && console.error(TF.Helper.Utility.toComponentUriName(name) + ' uri error!');
        }

        // 额外路由
        var reg, isMatch = false;
        $.each(additionRouter, function(index, item) {
            $.map(item, function(value, key){
                key = key.replace(/:num/gi, '[0-9]+');
                key = key.replace(/:any/gi, '.*');

                reg = new RegExp('^' + key + '$');
                if (result.uri.match(reg)) {
                    if (value.indexOf('$') >= 0 && key.indexOf('(') >= 0) {
                        value = result.uri.replace(reg, value);
                    }
                    isMatch = true;
                    // 匹配上
                    if (TF.Core.ComponentMgr.has(value)) {
                        TF.Core.Application.publish('GlobalRoute', [result.uri, [name, params]]);
                        TF.Core.ComponentMgr.post(value, 'component-route', params);
                    }
                }
            });
        });

    };

    var exports = {
        create: function(name, router) {
            additionRouter = router || additionRouter;
            defaultName = name || defaultName;

            TF.Core.Application.subscribe('GlobalComponentLoaded', function(){
                addEvent(locationHash, 'hashChanged', function(param){
                    callback(param.hash);
                });
                locationHash.start();
            });
        },

        // 解析 hash 中的字符串，取得里面的信息
        parseUri: function(uri) {
            return parse(uri || locationHash.getHash());
        },

        makeUri: function(name, params) {
            name = name || '';
            params = params || [];

            name = TF.Helper.Utility.toComponentUriName(name);
            params = params.join('/');

            var result = name;

            if (params) {
                result += '/' + decodeURI(params);
            }

            return result;
        },

        go: function(uri, url, isReload) {
            if (url) {
                if (isReload && location.pathname == url && location.hash == '#tf-' + encodeURI(uri)) {
                    location.reload();
                }
                else {
                    location.href = url + '#tf-' + encodeURI(uri);
                }
            }
            else if (locationHash) {
                locationHash.setHash('tf-' + uri);
            }
        },

        setUri: function(uri) {
            if (locationHash) {
                locationHash.setHash('tf-' + uri, true);
            }
        },

        getUri: function(name) {
            return 'tf-' + this.makeUri(name);
        }
    };

    return exports;
})();
