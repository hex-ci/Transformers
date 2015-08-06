// 实用工具静态类，包括一些常用例程
TF.Helper.Utility = {
    baseUrl: function(appName) {
        appName = appName || defaultApplicationName;

        return TF.Config[appName].baseUrl;
    },

    siteUrl: function(appName, uri){
        appName = appName || defaultApplicationName;

        if (uri.indexOf('http://') === 0 || uri.indexOf('https://') === 0) {
            return uri;
        }
        else {
            return TF.Config[appName].baseUrl + uri;
        }
    },

    // 根据组件名取得 Application Name
    getApplicationName: function(name) {
        var appName;

        // 分析组件名中是否有 Application Name
        if (name.indexOf(':') > 0) {
            appName = name.split(':')[0];
        }
        else {
            appName = defaultApplicationName;
        }

        return capitalize(appName);
    },

    getComponentUrl: function(appName, uri, name) {
        var cfg = TF.Config[appName];

        // 通过 Application Name 得到相应的配置信息
        var names = TF.Helper.Utility.splitComponentName(name);

        var pattern = cfg.dataUriPattern;
        var str;

        if ($.isFunction(pattern)) {
            str = pattern(names, uri, cfg.resourceVersion);
        }
        else {
            str = this.template(pattern, {
                name: names,
                uri: uri,
                ver: cfg.resourceVersion
            });
        }

        return cfg.baseUrl + str;
    },

    getComponentViewUrl: function(appName, name) {
        var cfg = TF.Config[appName];

        // 通过 Application Name 得到相应的配置信息
        var names = TF.Helper.Utility.splitComponentName(name);

        var pattern = cfg.templateUriPattern;
        var str;

        if ($.isFunction(pattern)) {
            str = pattern(names, cfg.resourceVersion);
        }
        else {
            str = this.template(pattern, {
                name: names,
                ver: cfg.resourceVersion
            });
        }

        return cfg.baseUrl + str;
    },

    getComponentJsUrl: function(appName, name) {
        var cfg = TF.Config[appName];

        // 通过 Application Name 得到相应的配置信息
        var names = TF.Helper.Utility.splitComponentName(name);

        var pattern = cfg.jsUriPattern;
        var str;

        if ($.isFunction(pattern)) {
            str = pattern(names, cfg.resourceVersion);
        }
        else {
            str = this.template(pattern, {
                name: names,
                ver: cfg.resourceVersion
            });
        }

        return cfg.baseUrl + str;
    },

    getDefaultDataUri: function(appName) {
        return TF.Config[appName].defaultDataUri;
    },

    // 生成随机数字字符串
    random: function() {
        return ((new Date()).getTime() + Math.floor(Math.random()*9999));
    },

    // 转成大小写形式的组件名
    // hulk:abc-def 转换成 Hulk:AbcDef
    toComponentName: function(uriName) {
        var appName;
        var name;
        var tmp;

        // 分析组件名中是否有 Application Name
        if (uriName.indexOf(':') > 0) {
            tmp = uriName.split(':');

            appName = tmp[0];
            name = tmp[1];

            return capitalize(appName) + ':' + capitalize($.camelCase(name));
        }
        else {
            return capitalize($.camelCase(uriName));
        }
    },

    // 转成小写分隔符形式的组件名
    // Hulk:AbcDef 转换成 hulk:abc-def
    toComponentUriName: function(name, sep) {
        var appName;
        var tmp;
        var result = '';

        sep = sep || '-';

        // 分析组件名中是否有 Application Name
        if (name.indexOf(':') > 0) {
            tmp = name.split(':');

            appName = tmp[0];
            name = tmp[1];

            result = appName.toLowerCase() + ':';
        }

        result += name.replace(/[A-Z]/g, function(a) {
            return sep + a.toLowerCase();
        }).slice(1);

        return result;
    },

    splitComponentName: function(name) {
        var result = [];
        name.replace(/([A-Z][a-z]*)/g, function(a) {
            result.push(a.toLowerCase());
        });
        return result;
    },

    // 从组件全名取得组件详细名称
    getComponentName: function(name) {
        // 分析组件名中是否有 Application Name
        if (name.indexOf(':') > 0) {
            name = name.split(':')[1];
        }

        return name;
    },

    getFullComponentName: function(name) {
        return TF.Helper.Utility.getApplicationName(name) + ':' + TF.Helper.Utility.getComponentName(name);
    },

    /**
     * 字符串模板
     * @method template
     * @static
     * @param {String} sTmpl 字符串模板，其中变量以{$aaa}表示。模板语法：
     分隔符为{xxx}，"}"之前没有空格字符。
     js表达式/js语句里的'}', 需使用' }'，即前面有空格字符
     模板里的字符{用##7b表示
     模板里的实体}用##7d表示
     模板里的实体#可以用##23表示。例如（模板真的需要输出"##7d"，则需要这么写“##23#7d”）
     {strip}...{/strip}里的所有\r\n打头的空白都会被清除掉
     {}里只能使用表达式，不能使用语句，除非使用以下标签
     {js ...}       －－任意js语句, 里面如果需要输出到模板，用print("aaa");
     {if(...)}      －－if语句，写法为{if($a>1)},需要自带括号
     {elseif(...)}  －－elseif语句，写法为{elseif($a>1)},需要自带括号
     {else}         －－else语句，写法为{else}
     {/if}          －－endif语句，写法为{/if}
     {for(...)}     －－for语句，写法为{for(var i=0;i<1;i++)}，需要自带括号
     {/for}         －－endfor语句，写法为{/for}
     {while(...)}   －－while语句,写法为{while(i-->0)},需要自带括号
     {/while}       －－endwhile语句, 写法为{/while}
     * @param {Object} opts (Optional) 模板参数
     * @return {String|Function}  如果调用时传了opts参数，则返回字符串；如果没传，则返回一个function（相当于把sTmpl转化成一个函数）

     * @example alert(template("{$a} love {$b}.",{a:"I",b:"you"}));
     * @example alert(template("{js print('I')} love {$b}.",{b:"you"}));
     */
    template: (function() {
        /*
        sArrName 拼接字符串的变量名。
        */
        var sArrName = "sArrCMX",
            sLeft = sArrName + '.push("';
        /*
            tag:模板标签,各属性含义：
            tagG: tag系列
            isBgn: 是开始类型的标签
            isEnd: 是结束类型的标签
            cond: 标签条件
            rlt: 标签结果
            sBgn: 开始字符串
            sEnd: 结束字符串
        */
        var tags = {
            'js': {
                tagG: 'js',
                isBgn: 1,
                isEnd: 1,
                sBgn: '");',
                sEnd: ';' + sLeft
            },
            //任意js语句, 里面如果需要输出到模板，用print("aaa");
            'if': {
                tagG: 'if',
                isBgn: 1,
                rlt: 1,
                sBgn: '");if',
                sEnd: '{' + sLeft
            },
            //if语句，写法为{if($a>1)},需要自带括号
            'elseif': {
                tagG: 'if',
                cond: 1,
                rlt: 1,
                sBgn: '");} else if',
                sEnd: '{' + sLeft
            },
            //if语句，写法为{elseif($a>1)},需要自带括号
            'else': {
                tagG: 'if',
                cond: 1,
                rlt: 2,
                sEnd: '");}else{' + sLeft
            },
            //else语句，写法为{else}
            '/if': {
                tagG: 'if',
                isEnd: 1,
                sEnd: '");}' + sLeft
            },
            //endif语句，写法为{/if}
            'for': {
                tagG: 'for',
                isBgn: 1,
                rlt: 1,
                sBgn: '");for',
                sEnd: '{' + sLeft
            },
            //for语句，写法为{for(var i=0;i<1;i++)},需要自带括号
            '/for': {
                tagG: 'for',
                isEnd: 1,
                sEnd: '");}' + sLeft
            },
            //endfor语句，写法为{/for}
            'while': {
                tagG: 'while',
                isBgn: 1,
                rlt: 1,
                sBgn: '");while',
                sEnd: '{' + sLeft
            },
            //while语句,写法为{while(i-->0)},需要自带括号
            '/while': {
                tagG: 'while',
                isEnd: 1,
                sEnd: '");}' + sLeft
            } //endwhile语句, 写法为{/while}
        };

        return function(sTmpl, opts) {
            var N = -1,
                NStat = []; //语句堆栈;
            var ss = [
                [/\{strip\}([\s\S]*?)\{\/strip\}/g, function(a, b) {
                    return b.replace(/[\r\n]\s*\}/g, " }").replace(/[\r\n]\s*/g, "");
                }],
                [/\\/g, '\\\\'],
                [/"/g, '\\"'],
                [/\r/g, '\\r'],
                [/\n/g, '\\n'], //为js作转码.
                [
                    /\{[\s\S]*?\S\}/g, //js里使用}时，前面要加空格。
                    function(a) {
                        var stat;
                        a = a.substr(1, a.length - 2);
                        for (var i = 0; i < ss2.length; i++) {a = a.replace(ss2[i][0], ss2[i][1]); }
                        var tagName = a;
                        if (/^(.\w+)\W/.test(tagName)) {tagName = RegExp.$1; }
                        var tag = tags[tagName];
                        if (tag) {
                            if (tag.isBgn) {
                                stat = NStat[++N] = {
                                    tagG: tag.tagG,
                                    rlt: tag.rlt
                                };
                            }
                            if (tag.isEnd) {
                                if (N < 0) {throw new Error("Unexpected Tag: " + a); }
                                stat = NStat[N--];
                                if (stat.tagG != tag.tagG) {throw new Error("Unmatch Tags: " + stat.tagG + "--" + tagName); }
                            } else if (!tag.isBgn) {
                                if (N < 0) {throw new Error("Unexpected Tag:" + a); }
                                stat = NStat[N];
                                if (stat.tagG != tag.tagG) {throw new Error("Unmatch Tags: " + stat.tagG + "--" + tagName); }
                                if (tag.cond && !(tag.cond & stat.rlt)) {throw new Error("Unexpected Tag: " + tagName); }
                                stat.rlt = tag.rlt;
                            }
                            return (tag.sBgn || '') + a.substr(tagName.length) + (tag.sEnd || '');
                        } else {
                            return '",(' + a + '),"';
                        }
                    }
                ]
            ];
            var ss2 = [
                [/\\n/g, '\n'],
                [/\\r/g, '\r'],
                [/\\"/g, '"'],
                [/\\\\/g, '\\'],
                [/\$(\w+)/g, 'opts["$1"]'],
                [/print\(/g, sArrName + '.push(']
            ];
            for (var i = 0; i < ss.length; i++) {
                sTmpl = sTmpl.replace(ss[i][0], ss[i][1]);
            }
            if (N >= 0) {throw new Error("Lose end Tag: " + NStat[N].tagG); }

            sTmpl = sTmpl.replace(/##7b/g,'{').replace(/##7d/g,'}').replace(/##23/g,'#'); //替换特殊符号{}#
            sTmpl = 'var ' + sArrName + '=[];' + sLeft + sTmpl + '");return ' + sArrName + '.join("");';

            //alert('转化结果\n'+sTmpl);
            /*jslint evil: true */
            var fun = new Function('opts', sTmpl);
            if (arguments.length > 1) {return fun(opts); }
            return fun;
        };
    }())

};