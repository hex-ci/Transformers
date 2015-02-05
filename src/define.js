
TF.define = function(name, options) {
    var appName;

    if ($.type(name) == 'string') {
        appName = TF.Helper.Utility.getApplicationName(name);
        name = TF.Helper.Utility.getComponentName(name);

        TF.Component[appName] = TF.Component[appName] || {};

        TF.Component[appName][name] = defineComponentClass(options);

        return TF.Component[appName][name];
    }
    else {
        return defineComponentClass(name);
    }
};