
// 创建组件
var defineComponentClass = function(data) {
    var superclass = TF.Component.Default;

    var component = function(){

        // 执行父类构造函数
        superclass.apply(this, arguments);

        // 从原型中拷贝普通变量到实例中
        for (var key in component.prototype) {
            if (component.prototype.hasOwnProperty(key)) {
                if ($.isPlainObject(component.prototype[key])) {
                    this[key] = {};
                    mix(this[key], component.prototype[key], true);
                }
            }
        }

        if ('initialize' in this) {
            this.initialize.apply(this, arguments);
        }
    };

    mix(component.prototype, data);

    var T = function(){};
    T.prototype = superclass.prototype;

    var cp = component.prototype;

    component.prototype = new T();

    //$super指向第一个父类，在构造器内可以通过arguments.callee.$super执行父类构造
    //多继承时，instance和$super只对第一个父类有效
    component.$super = superclass;

    //如果原始类型的prototype上有方法，先copy
    mix(component.prototype, cp, true);

    return component;
};


// ============================================================


// 制作组件管理器类
TF.Core.Application.createComponentMgrInstance = function(isGlobal, loadedCallback){
    var componentLength = 0,
        progressLength = 0,
        failureLength = 0,
        // 组件关联数组，key 为组件名，value 为组件实例
        components = new TF.Library.Hash(),
        // 事件订阅列表
        subscriptions = new TF.Library.Hash(),
        // 预装载关联数组，key 为组件名，value 为组件加载选项数组
        //preload =  new TF.Library.Hash(),
        // 是否正在使用进度条装载组件
        isLoading = false,
        // 组件别名关联数组
        componentAlias = new TF.Library.Hash();

    var getFullName = TF.Helper.Utility.getFullComponentName;

    var loadComplete = function(param) {
        var fullName = getFullName(param.fullName);

        if (param.instance == null) {
            $.error('Error: Component "' + fullName + '" load error! Please check Component Class Name or Define!');
        }

        var currentObj = components.get(fullName)[param.instance.options.__index || 0];

        currentObj.loaded = true;
        currentObj.instance = param.instance;

        progressLength++;

        if (progressLength >= componentLength) {
            completeProgress();
        }
    };

    var loadFailure = function(param) {
        loadComplete(param);
        failureLength++;
    };

    // 最终全部完成
    var completeProgress = function() {
        if (isGlobal) {
            // 广播一个全部组件加载完毕的消息
            TF.Core.Application.publish('GlobalComponentLoaded');
        }
        else {
            if ($.isFunction(loadedCallback)) {
                loadedCallback();
            }
        }
    };

    var renderComplete = function(param) {
        if (param.instance && !param.instance.options.lazyRender) {
            addEvent(param.instance, 'ready', loadComplete);
        }
        else {
            loadComplete(param);
        }
    };

    var loadFirstComplete = function(param) {
        loadComplete(param);

        var fullName = getFullName(param.fullName);

        $.each(components.get(fullName).slice(1), function(index, item) {
            item.options.__index = index + 1;
            var obj = new TF.Library.ComponentLoader(item.options, exports);
            addEvent(obj, 'complete', loadComplete);
            addEvent(obj, 'failure', loadComplete);
            obj.load();
        });
    };

    var renderFirstComplete = function(param) {
        if (param.instance && !param.instance.options.lazyRender) {
            addEvent(param.instance, 'ready', loadComplete);
        }
        else {
            loadComplete(param);
        }

        var fullName = getFullName(param.fullName);

        $.each(components.get(fullName).slice(1), function(index, item) {
            item.options.__index = index + 1;
            var obj = new TF.Library.ComponentLoader(item.options, exports);
            addEvent(obj, 'complete', renderComplete);
            addEvent(obj, 'failure', renderComplete);
            obj.load();
        });
    };

    // 解析组件名
    var parseName = function(name) {
        var match = /^([a-z0-9:]+)(?:\[([a-z0-9-_]+)\])?$/i.exec(name);
        var index = 0;

        if (match) {
            name = match[1];
            index = match[2];

            if (index !== undefined && isNaN(index)) {
                // 是别名
                if (!componentAlias.has(name + index)) {
                    throw 'Error: Component Alias "' + match[0] + '" not found!';
                }
                index = componentAlias.get(name + index);
            }
        }
        else {
            throw 'Error: Component name "' + name + '" invalid!';
        }

        // TODO: 如果使用的是别名，需要把别名转换为索引
        // 在添加组件的时候要设置好别名和索引的对应关系

        return {
            name: name,
            index: index
        };
    };

    var exports = {
        // 创建组件
        create: function(data) {
            return defineComponentClass(data);
        },

        // 注册组件
//            register: function(name) {
//                if (!components.has(name)) {
//                    components.set(name, []);
//                }
//            },

        // 启动组件装载进程，并行装载
        startLoad: function(withRender) {
            var me = this;

            if (isLoading) {
                return;
            }

            progressLength = 0;

            components.each(function(index, item) {
                if (item[0].async === true) {
                    return;
                }

                item[0].options.__index = 0;
                var obj = new TF.Library.ComponentLoader(item[0].options, me);
                if (item.length > 1) {
                    addEvent(obj, 'complete', (withRender ? renderFirstComplete : loadFirstComplete));
                    addEvent(obj, 'failure', (withRender ? renderFirstComplete : loadFirstComplete));
                }
                else {
                    addEvent(obj, 'complete', (withRender ? renderComplete : loadComplete));
                    addEvent(obj, 'failure', (withRender ? renderComplete : loadFailure));
                }
                obj.load();
            });
        },

        // 是否还在装载中
        isLoading: function() {
            return isLoading;
        },

        // 添加组件到预装载队列，等候装载
        add: function(options, defaultOptions) {
            if (isLoading) {
                return;
            }

            options = $.makeArray(options);

            defaultOptions = defaultOptions || {};

            var op, name, async, com;

            $.each(options, function(index, item){
                // 合并默认选项
                if ($.type(item) == 'string') {
                    op = {name: item};
                }
                else {
                    op = item;
                }
                mix(op, defaultOptions);

                name = getFullName(op.name);
                async = (op.async === true);
                com = {
                    options: op,
                    instance: null,
                    loaded: false,
                    async: async,
                    // 后台某组件最后收到的消息，value 为消息体（消息名+消息参数的数组）
                    message: null
                };

                if (!async) {
                    componentLength++;
                }

                if (components.has(name)) {
                    // 组件已存在
                    components.get(name).push(com);
                }
                else {
                    components.set(name, [com]);
                }

                // 保存别名
                if (op.alias) {
                    if (componentAlias.has(name + op.alias)) {
                        $.error('Error: Component alias "' + name + '[' + op.alias + ']" duplicate definition!');
                    }
                    componentAlias.set(name + op.alias, components.get(name).length - 1);
                }

            });

            return this;
        },

        // 装载某个后台组件
        loadBgComponent: function(com) {
            var fn = proxy(function(param) {
                var fullName = getFullName(param.fullName);

                if (param.instance == null) {
                    $.error('Error: Component "' + fullName + '" load error! Please check Component Class Name or Define!');
                }

                var currentObj = components.get(fullName)[param.instance.options.__index || 0];

                currentObj.loaded = true;
                currentObj.instance = param.instance;

                if (currentObj.message) {
                    currentObj.instance.sys.postMessage(currentObj.message[0], currentObj.message[1]);
                    currentObj.message = null;
                }
            }, this);

            // 加载组件
            var obj = new TF.Library.ComponentLoader(com.options, this);
            addEvent(obj, 'complete', fn);
            obj.load();
        },

        // 删除组件
        remove: function(name) {
            name = getFullName(name);

            var obj = parseName(name);

            if (obj.index === undefined) {
                components.erase(obj.name);
            }
            else {
                var com = components.get(obj.name)[obj.index];
                if (com) {
                    com.instance = null;
                    com.loaded = false;
                }
            }
        },

        // 投递事件给具体的实例
        post: function(name, msg, args) {
            var nameObj, com;
            var me = this;

            name = $.makeArray(name);

            $.each(name, function(index, item) {
                item = getFullName(item);

                // 处理事件订阅
                me.publish(item, msg, args);

                nameObj = parseName(item);

                if (nameObj.index === undefined) {
                    // 当前名字下的所有组件
                    com = components.get(nameObj.name);

                    if (com) {
                        // 传递给组件
                        $.each(com, function() {
                            if (this.loaded) {
                                this.instance.sys.postMessage(msg, args);
                            }
                            else {
                                // 没进行预加载的组件全部认为是异步加载
                                this.message = [msg, args];
                                me.loadBgComponent(this);
                            }
                        });
                    }
                }
                else {
                    // 当前名字下的第 index 个组件
                    com = components.get(nameObj.name)[nameObj.index];

                    if (com && com.loaded) {
                        // 传递给组件
                        com.instance.sys.postMessage(msg, args);
                    }
                    else {
                        com.message = [msg, args];
                        me.loadBgComponent(com);
                    }
                }
            });
        },

        // 显示当前容器中 name 所指定的组件，并且隐藏此容器中其它组件
        show: function(name) {
            name = getFullName(name);
            this.post(name, 'component-only-show');
        },

        has: function(name) {
            name = getFullName(name);
            var nameObj = parseName(name);
            return components.has(nameObj.name);
        },

        // 取某个名字下的组件实例个数
        length: function(name) {
            name = getFullName(name);
            var nameObj = parseName(name);
            if (components.has(nameObj.name)) {
                return components.get(nameObj.name).length;
            }
            else {
                return 0;
            }
        },

        // 以某个函数订阅某个组件的消息
        subscribe: function(name, msg, fn, scope) {
            name = getFullName(name);
            var nameObj = parseName(name);

            name = nameObj.name + (nameObj.index === undefined ? '' : '[' + nameObj.index + ']');

            var func = proxy(fn, scope || fn);
            if (subscriptions.has(name + msg)) {
                // 已存在的组件订阅
                subscriptions.get(name + msg).push(func);
            }
            else {
                subscriptions.set(name + msg, [func]);
            }

            // 返回 subscription 句柄
            return {'key': name + msg, 'value': func};
        },

        // 取消订阅
        unsubscribe: function(handle) {
            if (subscriptions.has(handle.key)) {
                subscriptions.get(handle.key).erase(handle.value);
            }
        },

        // 发布消息
        publish: function(name, msg, args) {
            name = getFullName(name);
            var nameObj = parseName(name);
            var loaded = false;

            name = nameObj.name + (nameObj.index === undefined ? '' : '[' + nameObj.index + ']');

            var com = components.get(nameObj.name);

            // 检查组件是否已加载
            if (nameObj.index === undefined) {
                // 当前名字下的所有组件
                if (com) {
                    // 判断至少有一个组件已加载
                    $.each(com, function(index, value){
                        if (value.loaded) {
                            loaded = true;
                            return false;
                        }
                    });

                    if (loaded && subscriptions.has(name + msg)) {
                        $.each(subscriptions.get(name + msg), function(i, func) {
                            // 谁作为 this 需要考虑下
                            func.apply(func, [args, msg]);
                        });
                    }
                }
            }
            else {
                // 当前名字下的第 index 个组件
                if (com && com[nameObj.index] && com[nameObj.index].loaded) {
                    if (subscriptions.has(name + msg)) {
                        $.each(subscriptions.get(name + msg), function(i, func) {
                            // 谁作为 this 需要考虑下
                            func.apply(func, [args, msg]);
                        });
                    }

                    if (subscriptions.has(nameObj.name + msg)) {
                        $.each(subscriptions.get(nameObj.name + msg), function(i, func) {
                            // 谁作为 this 需要考虑下
                            func.apply(func, [args, msg]);
                        });
                    }
                }
            }
        },

        // 获取一个组件实例的代理，只可以调用组件 Action 方法
        // TODO: 目前只支持每个组件名一个实例，未来需要考虑同一个组件加载多次的需求
        getAgent: function(name) {
            name = getFullName(name);
            var nameObj = parseName(name);

            var agentObject;
            var agentExportObject;
            var match;
            var funcName;
            var com;

            com = components.get(nameObj.name);

            if (!com) {
                return null;
            }

            var agentFunc = function(actionName) {
                return function() {
                    //console.log(this.__instance);
                    return this.__instance.sys.postMessage(decamelize(actionName), arguments[0]);
                    //return this.__instance[actionName + 'Action'].apply(this.__instance, arguments);
                };
            };

            if (nameObj.index === undefined) {
                // 返回数组
                agentExportObject = [];

                $.each(com, function(index, item){
                    if (!item.loaded) {
                        return;
                    }

                    agentObject = {};

                    mix(agentObject, {
                        __instance: item.instance
                    });

                    for (var x in item.instance) {
                        if ($.isFunction(item.instance[x])) {
                            match = /^(.+?)Action$/.exec(x);
                            if (match) {
                                funcName = $.trim(match[1]);
                                agentObject[funcName] = agentFunc(funcName);
                            }
                        }
                    }

                    agentExportObject.push(agentObject);

                });
            }
            else {
                if (com[nameObj.index] && com[nameObj.index].loaded) {
                    agentObject = com[nameObj.index].instance;
                    agentExportObject = {};

                    mix(agentExportObject, {
                        __instance: agentObject
                    });

                    for (var x in agentObject) {
                        if ($.isFunction(agentObject[x])) {
                            match = /^(.+?)Action$/.exec(x);
                            if (match) {
                                funcName = $.trim(match[1]);
                                agentExportObject[funcName] = agentFunc(funcName);
                            }
                        }
                    }
                }
                else {
                    agentExportObject = null;
                }
            }

            return agentExportObject;
        }
    };

    return exports;
};

// 全局组件管理器（单例模式）
TF.Core.ComponentMgr = TF.Core.Application.createComponentMgrInstance(true);

