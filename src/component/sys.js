
// 组件已加载的资源
var loadedResource = {};

// 组件系统内部方法
var componentSys = {
    // 组件消息处理中心
    postMessage: function(msg, args) {
        var returnValue;

        // 如果组件还未渲染，则等待组件完成渲染，再传递最后一个消息
        if (!this.rendered) {
            // 系统事件预处理
            switch (msg) {
                case 'component-show':
                    this.hidden = false;
                    break;

                case 'component-only-show':
                    this.hidden = false;
                    break;

                case 'component-hide':
                    this.hidden = true;
                    break;
            }

            if (msg == 'component-route') {
                this.lastRouterMessage = {msg: msg, args: args};
            }
            else {
                this.lastMessage = {msg: msg, args: args};
            }
            if (!this.rendering) {
                this.render();
            }

            return;
        }
        //if (!$defined(args)) args = {};

        // before 用于处理消息返回值，表示是否继续传递消息
        var is_continue = true;
        var funcName = $.camelCase(msg);

        // 传递处理过的参数给 Action
        var filteredArgs = args;
        switch (msg) {
            case 'component-route':
                filteredArgs = this._filterRouterArgs(args);
                break;
        }

        if (this.instance && $.isFunction(this.instance[funcName + 'ActionBefore'])) {
            is_continue = this.instance[funcName + 'ActionBefore'].call(this.instance, filteredArgs, args);
        }

        if (is_continue === false) {
            return;
        }

        // 系统事件处理
        switch (msg) {
            case 'component-route':
                this.route(args);
                break;

            case 'component-render':
                this.render(args);
                break;

            case 'component-refresh':
                this.refresh(args);
                break;

            case 'component-destroy':
                this.destroy(args);
                break;

            case 'component-show':
                this.show(args);
                break;

            case 'component-only-show':
                this.onlyShow(args);
                break;

            case 'component-hide':
                this.hide(args);
                break;
        }

        // 把消息派发到组件实例中
        if (this.instance && $.isFunction(this.instance[funcName + 'Action'])) {
            returnValue = this.instance[funcName + 'Action'].call(this.instance, filteredArgs, args);
        }

        this.parentComponentMgr.publish(this.name + '[' + this.index + ']', msg, args);

        return returnValue;
    },

    // 系统路由处理函数
    route: function(args) {
        var me = this;

        // 如果现在路由到其他组件了，则不显示组件
        if (TF.Helper.Utility.getFullComponentName(TF.Core.Router.parseUri().name) == TF.Helper.Utility.getFullComponentName(this.fullName)) {
            this.postMessage('component-only-show');
        }

        $.each(TF.Mentor._routeBefore, function(){
            args = this.call(me, args);
        });

        $.each(TF.Mentor._routeAfter, function(){
            args = this.call(me, args);
        });
    },

    _filterRouterArgs: function(args) {
        var me = this;

        $.each(TF.Mentor._routeFilteringBefore, function(){
            args = this.call(me, args);
        });

        $.each(TF.Mentor._routeFilteringAfter, function(){
            args = this.call(me, args);
        });

        return args;
    },

    // 渲染组件
    render: function() {
        var me = this;

        if (this.rendering) {
            return;
        }

        this.rendering = true;

        if (!this.instance || this.rendered) {
            return;
        }

        this._loadResource(function(){
            if (me.options.applyTo) {
                //直接渲染
                me._loadComplete($(me.options.applyTo));
            }
            else if (me.options.contentEl) {
                //直接渲染
                me._loadComplete($(me.options.contentEl).clone());
            }
            else {
                me._loadContent();
            }
        });
    },

    // 刷新组件内容
    refresh: function(data) {
        if (!this.rendered) {
            return;
        }

        if ($.isPlainObject(data)) {
            this.options.data = data;
            this.loader.data = data;
        }

        this.refreshing = true;
        this._loadContent();
    },

    // 装载资源文件
    _loadResource: function(callback) {
        var me = this;
        var resource = this.instance.RequireResource;
        var sources;
        var counter, loaded, url;

        if (!resource) {
            callback();
            return;
        }

        if (resource.js) {
            sources = $.makeArray(resource.js);

            counter = 0;
            loaded = 0;

            $.each(sources, function(i, source) {
                url = this;

                if (url.indexOf("http://") !== 0) {
                    url = TF.Helper.Utility.baseUrl(me.appName) + url;
                }

                if (!loadedResource[url]) {
                    $.getScript(url)
                        .always(function(){
                            counter++;
                            if ((counter + loaded) == sources.length) {
                                callback();
                            }
                        });

                    loadedResource[url] = true;
                }
                else {
                    loaded++;
                }
            });

            // 如果所有的都已经装载过，也要发出完成事件！！
            if (loaded == sources.length && counter != sources.length) {
                callback();
            }
        }
    },

    // 装载组件模板
    _loadContent: function() {
        if (this.options.url == '') {
            this.options.url = (this.viewName ?
                                TF.Helper.Utility.getComponentViewUrl(TF.Helper.Utility.getApplicationName(this.viewName),
                                TF.Helper.Utility.getComponentName(this.viewName)) : TF.Helper.Utility.getComponentViewUrl(this.appName, this.name));
        }
        else if (this.options.url.indexOf("http://") < 0) {
            this.options.url = TF.Helper.Utility.siteUrl(this.appName, this.options.url);
        }

        if (!this.options.hasCache) {
            this.options.data = this.options.data || {};
            if ($.isString(this.options.data)) {
                this.options.data = unserialize(this.options.data);
            }
            this.options.data['_reqno'] = TF.Helper.Utility.random();
        }

        this.loader = $.ajax(this.options.url, {
            data: this.options.data || '',
            type: 'GET',
            timeout: 10000,
            dataType: 'text',
            xhrFields: {
                'withCredentials': true
            },
            success: proxy(this._loadComplete, this),
            error: proxy(function() {
                //this.loadError('4. Ajax Error!');
                //this.unsetLoadingMsg();
            }, this)
        });

        //this.setLoadingMsg();
    },

    _loadComplete: function(responseText, textStatus, jqXHR) {
        var me = this;

        // 如果是取消的请求，则什么也不做，我们只关心真正请求回来的数据，而不关心请求的状态
        if (jqXHR && jqXHR.statusText == 'abort') {
            return;
        }

        if (!this.instance) {
            return;
        }

        var response, responseTree;

        response = responseText;

        if ($.type(response) == 'string') {
            // 解决 IE 下 innerHTML 不能直接设置 script 的问题
            if (TF.Helper.Browser.ie) {
                response = response.replace(/(<div\s+class="TFComponent"\s*>)/ig, '$1<div style="display:none">tf</div>');
            }

            responseTree = $('<div></div>').html(response).find('.TFComponent');
        }
        else if (response && response.length > 0) {
            responseTree = response.first();
        }
        else {
            // error
            return;
        }

        // 如果没有装载正确，则立即返回
        if (responseTree.length == 0) {
            if (response) {
                this._loadError('DEBUG: ' + response);
            }
            return;
        }

        var element = responseTree;

        if (this.refreshing) {
            this.topElement.html(element.html());
        }
        else {
            // 存储经过包装的元素
            this._setTopElement(element);
        }

        // 是否以隐藏的方式渲染组件
        if (this.hidden) {
            this.topElement.hide();
        }

        var renderTo = $(this.options.renderTo);

        // 放入 DOM 树中
        if (!this.refreshing) {
            if (!this.options.applyTo) {
                if (!this.options.appendRender && !this.options.replaceRender) {
                    renderTo.empty();
                }

                if (this.options.replaceRender) {
                    // 要把元素属性复制过去
                    // 复制 class
                    var cls = renderTo[0].attributes.getNamedItem('class');
                    if (cls) {
                        $.each(cls.value.split(' '), function(i, v){
                            element.addClass(v);
                        });
                    }

                    // 复制 style
                    var style = renderTo[0].attributes.getNamedItem('style');
                    if (style) {
                        var namedItem = document.createAttribute("style");
                        namedItem.value = style.value;
                        element[0].attributes.setNamedItem(namedItem);
                    }

                    renderTo.replaceWith(element);
                }
                else {
                    renderTo.append(element);
                }
            }
        }

        if (this.find('.tf-component-error').length == 0) {
            this.find().attr('data-tf-component', this.fullName);

            // 判断是否是客户端渲染
            var template = this.find('script.TFTemplate');
            var data = this.find('script.TFData');

            var obj = null;

            if (data.length > 0) {
                try {
                    obj = $.parseJSON(data.html());
                } catch (e) {}
            }

            if (obj && template.length > 0) {
                // 是客户端渲染，执行模板操作
                this.find().html(mentor.Template.render(this.appName, template.html(), {'ComponentData': obj}, template));
            }

            this.instance.options['TFData'] = obj;

            // 自动提取页面中的 options 值
            var options = this.find('.tf-options');
            var name, tag;
            $.each(options, function(i, e){
                e = $(e);
                name = e.attr('name');

                if (!name) {
                    return;
                }

                tag = e.prop('tagName').toLowerCase();
                if (tag == 'input' || tag == 'textarea') {
                    me.instance.options[name] = e.val();
                }
                else {
                    me.instance.options[name] = e.html();
                }
            });

            triggerEvent('complete', this._getEventObject(), this.instance);

            // 页面全部装载完成！
            if (this.refreshing) {
                // TODO:
                // 应该和加载一样需要做一些处理
                // 例如可能需要重新加载子组件

                this._setDefaultSubmit();

                // 先加载子组件，加载完毕后才是 DomRefreshReady
                // 如果没有子组件，直接执行 DomRefreshReady
                this._loadSubComponents(proxy(function(){

                    this.instance.DomRefreshReady();

                    this._setDefaultFocus();

                    this.rendering = false;

                    // 刷新完毕
                    this.refreshing = false;

                    triggerEvent('refreshReady', this._getEventObject(), this.instance);

                }, this));

            }
            else {
                // 处理事件委托绑定
                this._delegateJsEvent();
                this._delegateJsAction();

                this._delegateEvent(this.instance.Events);
                this._setDefaultSubmit();

                // 先加载子组件，加载完毕后才是 DomReady
                // 如果没有子组件，直接执行 DomReady
                this._loadSubComponents(proxy(function(){

                    this.instance.DomReady();

                    this._setDefaultFocus();

                    // 渲染完毕
                    this.rendered = true;

                    this.rendering = false;

                    // 刷新完毕
                    this.refreshing = false;

                    // 渲染完毕后要处理未渲染时的最后一条消息
                    if (this.lastRouterMessage) {
                        this.postMessage(this.lastRouterMessage.msg, this.lastRouterMessage.args);
                        this.lastRouterMessage = null;
                    }
                    if (this.lastMessage) {
                        this.postMessage(this.lastMessage.msg, this.lastMessage.args);
                        this.lastMessage = null;
                    }

                    triggerEvent('ready', this._getEventObject(), this.instance);

                }, this));

            }
        }
        else {
            this.rendering = false;

            // 刷新完毕
            this.refreshing = false;

            triggerEvent('failure', this._getEventObject(), this.instance);

            if (TF.Config[this.appName].debug) {
                console && console.error('Component [' + this.getComponentName() + '] load error!');
            }

            this.instance.LoadError();
        }

        return true;
    },

    _getEventObject: function() {
        return {
            instance: this.instance,
            fullName: this.fullName,
            name: this.name,
            appName: this.appName
        };
    },

    _loadError: function(msg) {
        console && console.error(msg);
    },

    _delegateEvent: function(configs){
        if (!configs) {
            return;
        }
        var value;
        var me = this;

        var eventFunc = function(type){
            var func = value[type];

            if ($.type(func) == 'string') {
                func = me.instance[func];
            }

            return function(ev) {
                ev.stopPropagation();
                return func.call(me.instance, ev, this);
            };
        };

        for (var key in configs) {
            value = configs[key];
            if ($.isFunction(value)) {
                value = {"click": value};
            }
            for (var type in value) {
                this.topElement.delegate(key, type, eventFunc(type));
            }
        }
    },

    // 获取视图里绑定的数据
    _getBindingData: function(element) {
        var el = $(element);
        var bindingElement = el.hasClass('tf-bind') ? el : el.parents('.tf-bind');
        var data = {};
        var binding = '';
        var targetElement;
        var targetName = '';
        var me = this;

        //console.log(bindingElement);
        //console.log($(this).parents('.tf-bind'));

        if (bindingElement.length > 0) {
            // 这里可以通过自动查找 target name 实现无需在 data-bind 里填写模版名
            targetElement = el.parents('[class*=TFTarget]');

            if (targetElement.length > 0) {
                // 解析 Target 名称
                var match = /TFTarget-(\S+)/.exec(targetElement.attr('class'));
                if (match) {
                    targetName = match[1];
                }

                if (targetName) {
                    targetName = '["' + targetName + '"]';
                }
            }

            //console.log(targetName);

            // 找到了绑定数据的DOM节点
            // 解析绑定数据
            binding = bindingElement.data('bind') || 'null';
            //console.log(this.templateData);
            //console.log('opts' + targetName + '.' + binding);
            binding = binding.split(',');

            if (binding.length > 1) {
                data = [];
                $.each(binding, function(index, item){
                    data.push(evalExp('opts' + targetName + '.' + $.trim(item), me.templateData));
                });
            }
            else {
                data = evalExp('opts' + targetName + '.' + $.trim(binding[0]), this.templateData);
            }

        }

        return data;
    },

    _delegateJsAction: function(){
        var me = this;

        this.topElement.delegate('[tf-action-click]', 'click', function(e) {
            e.stopPropagation();

            if (this.tagName.toLowerCase() == 'a') {
                e.preventDefault();
            }
            var args = {};
            var action = $(this).attr('tf-action-click') || '';

            // 解析参数
            var match = /(.*?)\((.*)\)/.exec(action);
            if (match) {
                action = $.trim(match[1]);
                if (match[2] != '') {
                    args = evalExp(match[2]);
                }
            }

            if ($.isPlainObject(args)) {
                args.__event = e;
                args.__data = me._getBindingData(this);
            }

            me.postMessage(action, args);
        });
    },

    _delegateJsEvent: function(){
        var me = this;

        this.topElement.delegate('[tf-event-click]', 'click', function(e) {
            e.stopPropagation();

            if (this.tagName.toLowerCase() == 'a') {
                e.preventDefault();
            }
            // 由于单击label标签事件会冒泡两次，所以过滤掉label产生的事件
            // <div><label><input ...></label>test</div>
            // TODO: 这里可能不需要太智能的帮用户过滤
            if (e.target.tagName.toLowerCase() == 'label') {
                return;
            }

            e.__data = me._getBindingData(this);

            var eventName = $.camelCase($(this).attr('tf-event-click'));
            if (me.instance && $.isFunction(me.instance[eventName + 'Event'])) {
                return me.instance[eventName + 'Event'].call(me.instance, e, this);
            }
        });

        this.topElement.delegate('[tf-event-change]', 'change', function(e) {
            e.stopPropagation();

            e.__data = me._getBindingData(this);

            var eventName = $(this).attr('tf-event-change');
            if (eventName) {
                eventName = $.camelCase(eventName);
                if (me.instance && $.isFunction(me.instance[eventName + 'Event'])) {
                    return me.instance[eventName + 'Event'].call(me.instance, e, this);
                }
            }
        });
    },

    // 设置默认按钮
    _setDefaultSubmit: function() {
        var form = this.find('form.tf-button');
        var el;

        form.each(function(){
            el = $(this);
            if (el.length > 0) {
                el.off('submit');
                el.on('submit', function(e) {
                    e.preventDefault();
//                        var f = $(e.target).find('button.tf-default').first();
//                        if (f) {
//                            f.trigger('click');
//                        }
                });

                el.find('button.tf-default').attr('type', 'submit');

                // 如果没有 type=submit 的按钮则添加一个
//                    if (el.find('button[type=submit]').length == 0) {
//                        el.append($('<div style="position:absolute;left:-9999px;top:-9999px;"><button type="submit"></button></div>'));
//                    }
            }
        });
    },

    _setDefaultFocus: function() {
        if (this.isHidden()) {
            return;
        }

        var form = this.find('form.tf-focus');
        if (form.length > 0) {
            var first = null;
            var el, tag;
            for (var i = 0, len = form[0].elements.length; i < len; i++) {
                el = $(form[0].elements[i]);
                tag = el.prop('tagName').toLowerCase();

                if (tag == 'input' && el.attr('type') != 'hidden' && !el[0].readOnly && el.is(':visible')) {
                    first = el;
                    break;
                }
                else if (tag == 'textarea' && !el[0].readOnly && el.is(':visible')) {
                    first = el;
                    break;
                }
            }

            if (first && first.length > 0) {
                first.attr('autocomplete', 'off');
                this.setFocus(first);
            }
        }
    },

    // 加载子组件
    _loadSubComponents: function(callback) {
        var me = this;

        this.componentMgr = this.createComponentMgr(function(){
            me.instance.ComponentsReady();
            callback && callback();
        });

        // 兼容方式获取子组件元素
        var components1 = this.topElement.find('.tf-component');
        // 新式获取子组件元素
        var components2 = this.topElement.find('*').filter(function(){
            return this.tagName.toLowerCase().indexOf('tf:') === 0;
        });

        if (components1.length == 0 && components2.length == 0) {
            callback && callback();
            return;
        }

        var args;
        var name;
        var attributes;
        var exclude = ['id', 'class', 'style'];
        var match;

        $.each(components1, function(i, el){
            el = $(el);

            args = {};
            name = el.attr('tf-component-name') || '';

            // 解析参数
            match = /(.*?)\((.*)\)/.exec(name);
            if (match) {
                name = $.trim(match[1]);
                if (match[2] != '') {
                    args = evalExp(match[2]);
                }
            }

            args.name = name;
            args.renderTo = el;

            me.componentMgr.add(args);
        });

        // 组件名计数器
        var componentNames = {};

        $.each(components2, function(index, el){
            el = $(el);

            args = {};

            name = TF.Helper.Utility.toComponentName(el.prop('tagName').toLowerCase().slice(3));

            if (typeof componentNames[name] == 'undefined') {
                componentNames[name] = 0;
            }
            else {
                componentNames[name]++;
            }

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
                    if (item.name.indexOf('data-view-') === 0) {
                        args.data = args.data || {};
                        args.data[item.name.substr(10)] = ((item.name == item.value || item.value === '') ? true : item.value);
                    }
                    else if (item.name.indexOf('tf-on-') === 0) {
                        var actionName = $.camelCase(item.value);
                        if (me.instance && $.isFunction(me.instance[actionName])) {
                            me.componentMgr.subscribe(name + '[' + componentNames[name] + ']', item.name.substr(6), (function(){
                                var newName = name + '[' + componentNames[name] + ']';
                                return function(args) {
                                    this[actionName]({
                                        target: newName,
                                        args: args
                                    });
                                };
                            })(), me.instance);
                        }
                    }
                    else {
                        args[$.camelCase(item.name)] = ((item.name == item.value || item.value === '') ? true : item.value);
                    }
                }
            });

            args.name = name;
            args.replaceRender = true;
            args.renderTo = el;
            args.__element = fragmentElement;

            me.componentMgr.add(args);
        });

        this.componentMgr.startLoad(true);
    },

    setFocus: function(el) {
        if (!el) {
            this._setDefaultFocus();
            return;
        }

        el = $(el);
        setTimeout(function(){
            try {
                if (el.length > 0) {
                    el[0].focus();
                }
            }
            catch(e){}
        }, 200);
    },

    find: function(selector) {
        if (this.topElement) {
            return selector ? this.topElement.find(selector) : this.topElement;
        }
        else {
            return $();
        }
    },

    _setTopElement: function(el, prefix) {
        prefix = prefix || 'transformers_id';
        this.topElement = $(el).attr('id', prefix + '_' + TF.Helper.Utility.random())
                          .addClass('g-tf-' + TF.Helper.Utility.toComponentUriName(this.fullName).replace(':', '-'));

        if (this.instance.Mentor && this.instance.Mentor.__path) {
            var path = this.instance.Mentor.__path;

            for (var i = path.length - 1; i >= 0; i--) {
                this.topElement.addClass('g-tf-' + TF.Helper.Utility.toComponentUriName(path[i]).replace(':', '-'));
            }
        }
    },
    _unsetTopElement: function() {
        if (this.topElement && this.topElement.length > 0)
        {
            this.topElement.parent().empty();
            this.topElement = null;
        }
    },
    // 取自己的组件名
    getComponentName: function() {
        return this.name;
    },
    setLoadingMsg: function(msg) {
        //if (this._isLoadingMsg) return;
        //this._isLoadingMsg = true;
        mentor.Status.setLoadingMsg(this.appName, msg, this.instance);
    },
    unsetLoadingMsg: function() {
        //if (this._isLoadingMsg) return;
        //this._isLoadingMsg = true;
        mentor.Status.unsetLoadingMsg(this.appName, this.instance);
    },
    setSuccMsg: function(msg) {
        mentor.Status.setSuccMsg(this.appName, msg, this.instance, {});
    },
    setFailMsg: function(msg) {
        mentor.Status.setFailMsg(this.appName, msg, this.instance, {});
    },

    getUrl: function(uri) {
        return TF.Helper.Utility.getComponentUrl(this.appName, uri || '', this.name);
    },

    // 封装组件内容 Request
    send: function(url, options) {
        if (url.indexOf("/") < 0) {
            url = this.getUrl(url);
        }
        else {
            url = TF.Helper.Utility.siteUrl(this.appName, url.slice(1));
        }

        var ajaxOptions = {
            url: url,
            type: 'GET',
            timeout: 10000,
            dataType: 'text',
            xhrFields: {
                'withCredentials': true
            },
            context: {
                instance: this.instance
            },
            complete: this._sendComplete
        };
        options = options || {};
        if ($.isFunction(options.fn)) {
            options.__TFCallback = options.fn;
            delete options.fn;
        }
        mix(ajaxOptions, options, true);

        if ($.type(ajaxOptions.data) == 'object') {
            var el = $(ajaxOptions.data);
            var tagName = el.prop('tagName');

            if (tagName && tagName.toLowerCase() == 'form') {
                ajaxOptions.data = el.serialize();
            }
        }

        if (!ajaxOptions.hasCache && ajaxOptions.type == 'GET') {
            ajaxOptions.data = ajaxOptions.data || {};
            if ($.isString(ajaxOptions.data)) {
                ajaxOptions.data = unserialize(ajaxOptions.data);
            }
            ajaxOptions.data['_reqno'] = TF.Helper.Utility.random();
        }

        // 如果已经发送请求，则取消上一个请求
        var requestName = url;
        var currentRequester = this.sendRequester.get(requestName);
        if (currentRequester) {
            currentRequester.abort();
        }

        ajaxOptions.context.options = ajaxOptions;

        currentRequester = $.ajax(ajaxOptions);

        this.sendRequester.set(requestName, currentRequester);

        if (options.loadingMsg !== false) {
            this.setLoadingMsg(options.loadingMsg);
        }

        return currentRequester;
    },

    // 装载完成
    // 注意这里的 this 已经换成 ajax context 所指对象
    _sendComplete: function(jqXHR) {
        var me = this.instance;

        me.sys.sendRequester.erase(this.options.url);

        if (this.options.loadingMsg !== false) {
            me.sys.unsetLoadingMsg();
        }

        // 如果是取消的请求，则什么也不做，我们只关心真正请求回来的数据，而不关心请求的状态
        if (jqXHR.statusText == 'abort') {
            return;
        }

        var response = jqXHR.responseText;
        var result = null;

        try {
            result = $.parseJSON(response);
        } catch (e) {}

        if (!result) {
            if (jqXHR.statusText == 'timeout') {
                result = {'errno': 998, 'errmsg': 'Request timeout', data: []}; // 超时错误
            }
            else {
                result = {'errno': 999, 'errmsg': 'Error!', data: []}; // 内部错误
            }
        }

        // 输出调试信息
        if (TF.Config[me.sys.appName].debug) {
            var param = this.options.data && ($.type(this.options.data) == 'string' ? this.options.data : $.param(this.options.data));
            console && console.debug('url: ' + this.options.url + (param ? '?' + param : ''));
        }

        var isError = !mentor.Ajax.validation(me.sys.appName, result);
        var args;

        if (isError){
            args = mix(result, {
                message: result.errmsg,
                code: result.errno
            }, true);
        }
        else{
            args = mix(result, {
                message: '',
                code: 0
            }, true);
        }

        if ($.isFunction(this.options.__TFCallback)) {
            this.options.__TFCallback.call(me, !isError, args);
        }

        if (isError) {
            // 显示错误消息
            mentor.Status.setFailMsg(me.sys.appName, args.message, me, args);
        }
        else {
            if ($.type(args.message) == 'string') {
                // 显示成功消息
                mentor.Status.setSuccMsg(me.sys.appName, args.message, me, args);
            }
        }
    },

    // 静态渲染模板
    renderStaticTemplate: function(name, args) {
        var html, el;
        var me = this;

        args = args || {};

        // 支持渲染一批模板
        name = $.makeArray(name);

        $.each(name, function(index, item){
            // 根据不同情况取 Target 名
            if ($.type(item) == 'string') {
                el = me.find('.TFTemplate-' + item);
                html = el.html();
                me.find('.TFTarget-' + item).html(mentor.Template.render(me.appName, html, args, el));
                me.templateData[item] = args;
            }
            else if ($.isPlainObject(item)) {
                el = me.find('.TFTemplate-' + item.template);
                html = el.html();

                if ($.type(item.target) == 'string') {
                    me.find('.TFTarget-' + item.target).html(mentor.Template.render(me.appName, html, args, el));
                }
                else {
                    var targetElement = $(item.target);
                    var match = /TFTarget-(\S+)/.exec(targetElement.attr('class'));
                    var className;
                    if (match) {
                        className = match[1];
                        $(item.target).html(mentor.Template.render(me.appName, html, args, el));
                    }
                    else {
                        className = 'gen-' + TF.Helper.Utility.random();
                        $(item.target).addClass('TFTarget-' + className);
                        $(item.target).html(mentor.Template.render(me.appName, html, args, el));
                    }

                    item.target = className;
                }

                me.templateData[item.template] = args;
                me.templateData[item.target] = args;
            }
        });
    },

    // 取得渲染后的模板内容
    getRenderedTemplate: function(name, args) {
        var el = this.find('.TFTemplate-' + name);

        return mentor.Template.render(this.appName, el.html(), args || {}, el);
    },

    // 动态渲染模板，支持自动分页
    renderTemplate: function(name, args, actionName) {
        var me = this;

        if (!name) {
            return;
        }

        //{'template':'xxx', 'target':'xxxx'}
        if (!args) {
            args = {};
        }

        if (args.loadingMsg !== false) {
            this.setLoadingMsg(args.loadingMsg);
        }

        var url = this.getUrl(actionName || TF.Helper.Utility.getDefaultDataUri(this.appName));

        name = $.makeArray(name);

        args.callback = function(result) {
            $.each(TF.Mentor._templateRenderAfter, function(){
                this.call(me, name, args);
            });

            if ($.isFunction(args.fn)) {
                args.fn.call(me.instance, result);
            }

            if (args.loadingMsg !== false) {
                me.unsetLoadingMsg();
            }
        };

        $.each(TF.Mentor._templateRenderBefore, function(){
            this.call(me, name, args);
        });

        var template = [], target = [], templateName = [], targetName = [];

        // 支持渲染一批模板
        $.each(name, function(index, item){
            if ($.type(item) == 'string') {
                template.push(me.find('.TFTemplate-' + item));
                target.push(me.find('.TFTarget-' + item));
                templateName.push(item);
                targetName.push(item);
            }
            else if ($.isPlainObject(item)) {
                template.push(me.find('.TFTemplate-' + item.template));

                if ($.type(item.target) == 'string') {
                    target.push(me.find('.TFTarget-' + item.target));
                }
                else {
                    var targetElement = $(item.target);
                    var className;
                    var match = /TFTarget-(\S+)/.exec(targetElement.attr('class'));
                    if (match) {
                        className = match[1];
                    }
                    else {
                        className = 'gen-' + TF.Helper.Utility.random();
                        targetElement.addClass('TFTarget-' + className);
                    }

                    item.target = className;
                    target.push(targetElement);
                }

                templateName.push(item.template);
                targetName.push(item.target);
            }
        });

        mix(args, {
            errorFunc: proxy(function(resultData){
                if (args.loadingMsg !== false) {
                    this.sys.unsetLoadingMsg();
                }
                this.RenderError(resultData);
            }, me.instance)
        });

        // ajax 模版渲染
        //console.info(name);
        //var waiter = [];
        var object;

//            if (url.indexOf("http://") < 0 && url.indexOf('/') != 0) {
//                url = TF.Helper.Utility.siteUrl(url);
//            }

        var requestName = $.map(name, function(item){
            if ($.isPlainObject(item)) {
                return $.param(item);
            }
            else {
                return item;
            }
        });

        var ajaxOptions = {
            url: url,
            type: 'GET',
            dataType: 'text',
            xhrFields: {
                'withCredentials': true
            },
            complete: function(jqXHR, textStatus) {
                me.templateRequester.erase(requestName.join());

                if (args.loadingMsg !== false) {
                    me.unsetLoadingMsg();
                }
            },
            success: function(responseText, textStatus, jqXHR) {
                me.templateRequester.erase(requestName.join());

                // 输出调试信息
                if (TF.Config[me.appName].debug) {
                    var param = this.data && ($.type(this.data) == 'string' ? this.data : $.param(this.data));
                    console && console.debug('url: ' + this.url + (param ? '?' + param : ''));
                }

                var response = responseText;
                var result = null;

                try {
                    result = $.parseJSON(response);
                } catch (e) {}

                // 如果是空对象，则强制为 null
                if (result && $.isEmptyObject(result)) {
                    result = null;
                }

                // 数据过滤器，在这里可以进行一些显示前的处理。
                if (result && typeof(args) != 'undefined' && $.isFunction(args.filter)) {
                    var temp = args.filter.call(me.instance, result);

                    if ($.isPlainObject(temp)) {
                        mix(result, temp, true);
                    }
                }

                if (!result) {
                    // 清理
                    //ajax = null;
                    result = {};
                    //return;
                }

                // 如果有附加数据 addition，则添加到 result 对象中
                if (args.addition) {
                    mix(result, args.addition, true);
                }

                // 插入一些特殊系统对象
                mix(result, {
                    __TF: {}
                }, true);

                if (mentor.Ajax.validation(me.appName, result)) {
                    // 执行成功
                    $.each(template, function(i, t) {
                        result.__TF.template = templateName[i];
                        result.__TF.target = targetName[i];
                        object = $(target[i]);
                        try {
                            object.html(mentor.Template.render(me.appName, t.html(), result, t));
                        }
                        catch(e) {
                            object.html(e);
                        }
                    });

                    if (typeof(args) != 'undefined') {
                        args.callback(result);
                    }
                }
                else {
                    // 执行失败
                    if (typeof(args) != 'undefined') {
                        args.errorFunc(result);
                    }
                    else {
                        $.each(template, function(i, t){
                            result.__TF.template = templateName[i];
                            result.__TF.target = targetName[i];
                            $(target[i]).html(result.toString() || '');
                        });
                    }
                }

                $.each(template, function(i, t){
                    me.templateData[templateName[i]] = result;
                    me.templateData[targetName[i]] = result;
                });

                //ajax = null;
            }
        };
        mix(ajaxOptions, args, true);

        if (!ajaxOptions.hasCache && ajaxOptions.type == 'GET') {
            ajaxOptions.data = ajaxOptions.data || {};
            if ($.isString(ajaxOptions.data)) {
                ajaxOptions.data = unserialize(ajaxOptions.data);
            }
            ajaxOptions.data['_reqno'] = TF.Helper.Utility.random();
        }

        // 如果已经发送请求，则取消上一个请求
        var currentRequester = this.templateRequester.get(requestName.join());
        if (currentRequester) {
            currentRequester.abort();
        }

        currentRequester = $.ajax(ajaxOptions);

        this.templateRequester.set(name.join(), currentRequester);
    },

    // 显示组件
    show: function() {
        this.hidden = false;
        if (!this.rendered) {
            return;
        }
        this.topElement.show();
        this._setDefaultFocus();
    },

    // 在当前容器下只显示自己
    onlyShow: function() {
        this.hidden = false;

        if (!this.rendered) {
            return;
        }

        var el = this.topElement;
        var id;
        var comName;
        var me = this;
        if (el.length > 0) {
            id = el.attr('id');
            // 先隐藏除 name 所指定的组件外的其它组件
            el.parent().find('.TFComponent').each(function(index, comEl){
                comEl = $(comEl);
                if (id != comEl.attr('id')) {
                    comName = comEl.data('tf-component');

                    if (comName) {
                        me.parentComponentMgr.post(comName, 'component-hide');
                    }
                }
            });
        }

        this.show();
    },

    // 隐藏组件
    hide: function() {
        this.hidden = true;
        if (!this.rendered) {
            return;
        }
        this.topElement.hide();
    },

    isHidden: function() {
        return this.hidden;
    },

    isRendered: function() {
        return this.rendered;
    },

    createComponentMgr: function(callback) {
        return TF.Core.Application.createComponentMgrInstance(false, proxy(callback, this.instance));
    },

    cancelRequest: function() {
        this.sendRequester.each(function(index, item){
            if (item) {
                item.abort();
                //mentor.Status.unsetLoadingMsg(this.instance);
            }
        });
    },

    cancelRender: function() {
        if (this.loader) {
            this.loader.abort();
        }
    },

    destroy: function() {
        if (this.instance) {
            if (this.instance.DomDestroy(this.instance) === false) {
                return;
            }
        }

        // 从组件管理器中删除自己
        this.parentComponentMgr.remove(this.fullName);

        try {
            this.cancelRender();
            this.cancelRequest();

            // 清除表单验证对象
            //this.clearValidation();

            this._unsetTopElement();

            this.instance = null;
        }
        catch (e) {
        }
    },

    // 用于设置前进后退的 URI
    // args 是参数数组
    // name 是组件名，默认不写则是当前组件
    setRouterArgs: function(args, name) {
        var uri = [];
        uri.push(TF.Helper.Utility.toComponentUriName(name || this.fullName));
        args = $.makeArray(args);
        if (args.length > 0) {
            uri.push(args.filter(function(item){
                return item != '';
            }).join('/'));
        }

        this.lastArgs = args;

        // 组成一个可用的URI
        //appName:name/params

        TF.Core.Router.setUri(uri.join('/'));

        TF.Core.Application.publish('GlobalRoute', [uri.join('/'), [this.name, args]]);
    },

    // 验证组件表单
    validate: function(element) {
        var el = element ? $(element) : this.find('form.tf-validation');

        if (el.length > 0) {
            return mentor.Form.validation(this.appName, el);
        }
        else {
            return true;
        }
    }
};

