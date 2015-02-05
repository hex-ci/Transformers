// URI hash 管理，主要就是实现 hashchange 事件
TF.Library.LocationHash = function(options) {
    this.options = {
        /*jshint scripturl:true*/
        blank_page: 'javascript:0',
        start: false
    };
    this.prefix = '#';
    this.iframe = null;
    this.handle = false;
    this.useIframe = (TF.Helper.Browser.ie && (typeof(document.documentMode)=='undefined' || document.documentMode < 8));
    this.state = null;
    this.supports = (('onhashchange' in window) && (typeof(document.documentMode) == 'undefined' || document.documentMode > 7));
    this.noFireOnce = false;

    mix(this.options, options, true);

    //CustEvent.createEvents(this, ['hashChanged']);

    this.initialize();

    return this;
};
mix(TF.Library.LocationHash.prototype, {
    initialize: function(){
        var self = this;

        // Disable Opera's fast back/forward navigation mode
        if (TF.Helper.Browser.opera && window.history.navigationMode) {
            window.history.navigationMode = 'compatible';
        }

        // IE8 in IE7 mode defines window.onhashchange, but never fires it...
        if (this.supports) {
            // The HTML5 way of handling DHTML history...
            $(window).on('hashchange', function() {
                if (self.noFireOnce) {
                    self.noFireOnce = false;
                    return;
                }
                triggerEvent('hashChanged', {hash: self.getHash()}, self);
            });
        }
        else {
            if (this.useIframe) {
                this.initializeHistoryIframe();
            }
        }

        if (this.options.start) {
            this.start();
        }
    },

    initializeHistoryIframe: function() {
        var hash = this.getHash(), doc;
        this.iframe = this.getIframe();

        this.istate = null;

        doc = (this.iframe.contentDocument) ? this.iframe.contentDocument  : this.iframe.contentWindow.document;
        doc.open();
        doc.write('<html><head><title>' + document.title + '</title></head><body id="state">' + hash + '</body></html>');
        doc.close();
        this.istateOld = false;
    },

    checkHash: function(){
        var state = this.getState();

        if (this.state == state) {
            return;
        }
        if (TF.Helper.Browser.ie && (this.state !== null)) {
            this.setState(state, true);
        }
        else {
            this.state = state;
        }

        triggerEvent('hashChanged', {hash: state}, this);
    },

    getHash: function() {
        var href = decodeURI(top.location.href);
        var pos = href.indexOf(this.prefix) + 1;
        return (pos) ? href.substr(pos) : '';
    },

    // 不带#号
    setHash: function(hash, noFire) {
        if (this.getHash() == hash) {
            // 如果hash没有变化 则不引发任何事件
            return;
        }

        hash = encodeURI(hash);

        if (this.supports) {
            if (noFire) {
                this.noFireOnce = true;
            }
            top.location.hash = this.prefix + hash || this.prefix;
            return;
        }

        this.setState(hash);

        if (noFire) {
            return;
        }

        triggerEvent('hashChanged', {hash: hash}, this);
    },

    pick: function() {
        for (var i = 0, l = arguments.length; i < l; i++) {
            if (arguments[i] != undefined) {
                return arguments[i];
            }
        }
        return null;
    },

    getState: function() {
        var state = this.getHash();
        if (this.iframe) {
            var doc = this.iframe.contentWindow.document;
            if (doc && doc.body.id == 'state') {
                var istate = decodeURI(doc.body.innerText);
                if (this.state == state) {
                    return istate;
                }
                this.istateOld = true;
            }
            else {
                return this.istate;
            }
        }

        return state;
    },

    setState: function(state, fix) {
        state = this.pick(state, '');
        top.location.hash = this.prefix + state || this.prefix;

        if (TF.Helper.Browser.ie && (!fix || this.istateOld)) {
            if (!this.iframe) {
                this.iframe = this.getIframe();

                this.istate = this.state;
            }

            var doc = (this.iframe.contentDocument) ? this.iframe.contentDocumnet  : this.iframe.contentWindow.document;
            doc.open();
            doc.write('<html><head><title>' + document.title + '</title></head><body id="state">' + state + '</body></html>');
            doc.close();
            this.istateOld = false;
        }

        this.state = state;
    },

    clear: function(timer) {
        clearTimeout(timer);
        clearInterval(timer);
        return null;
    },

    start: function() {
        if (this.supports) {
            triggerEvent('hashChanged', {hash: this.getHash()}, this);
            return;
        }

        this.handle = setInterval(proxy(this.checkHash, this), 200);
        this.started = true;

        return this;
    },

    stop: function() {
        this.clear(this.handle);
    },

    getIframe: function() {
        return $('<iframe src="' + this.options.blank_page + '"></iframe>').css({
            'position'  : 'absolute',
            'top'       : 0,
            'left'      : 0,
            'width'     : '1px',
            'height'    : '1px',
            'visibility': 'hidden'
        }).appendTo(document.body)[0];
    }
});