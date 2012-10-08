define([
    'handlebars'
], function (Handlebars) {
    Handlebars.registerHelper('join', function (arr, separator, options) {
        if (options.inverse && !arr.length) {
            return options.inverse(this);
        }

        return arr.map(function (item) {
            return options.fn(item);
        }).join(separator);
    });
});

