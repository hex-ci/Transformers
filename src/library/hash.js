// Hash 类库
TF.Library.Hash = function(object) {
    this.data = object || {};
    return this;
};
mix(TF.Library.Hash.prototype, {
    has: function(key) {
        return this.data[key] != undefined;
    },

    keyOf: function(value){
        for (var key in this.data){
            if (this.data.hasOwnProperty(key) && this.data[key] === value) {
                return key;
            }
        }
        return null;
    },

    hasValue: function(value){
        return (this.keyOf(value) !== null);
    },

    each: function(fn){
        $.each(this.data, fn);

        return this;
    },

    combine: function(properties, override){
        mix(this.data, properties || {}, override);

        return this;
    },

    erase: function(key){
        if (this.data.hasOwnProperty(key)) {
            delete this.data[key];
        }

        return this;
    },

    get: function(key){
        return ((this.data.hasOwnProperty(key)) ? this.data[key] : null);
    },

    set: function(key, value){
        if (!this.data[key] || this.data.hasOwnProperty(key)) {
            this.data[key] = value;
        }

        return this;
    },

    empty: function(){
        var me = this;

        $.each(this.data, function(key, value){
            delete me.data[key];
        });

        return this;
    },

    include: function(key, value){
        if (this.data[key] != undefined) {
            this.data[key] = value;
        }

        return this;
    },

    getKeys: function(){
        var keys = [];

        $.each(this.data, function(key){
            keys.push(key);
        });

        return keys;
    },

    getValues: function(){
        var values = [];

        $.each(this.data, function(key, value){
            values.push(value);
        });

        return values;
    },

    toQueryString: function(){
        var s = [];

        for ( var p in this.data ) {
            if (this.data[p]==null) {
                continue;
            }
            if (this.data[p] instanceof Array) {
                for (var i=0; i<this.data[p].length; i++) {
                    s.push( encodeURIComponent(p) + '[]=' + encodeURIComponent(this.data[p][i]));
                }
            }
            else {
                s.push( encodeURIComponent(p) + '=' + encodeURIComponent(this.data[p]));
            }
        }

        return s.join('&');
    }
});