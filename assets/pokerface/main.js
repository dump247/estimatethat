require.config({
    shim: {
        'underscore': {
            exports: '_'
        },

        'zepto': {
            exports: '$'
        },

        'backbone': {
            deps: ['underscore', 'zepto'],
            exports: 'Backbone'
        },

        'handlebars': {
            exports: 'Handlebars'
        }
    }
});

require([
    'require/domReady!',
    'pokerface/app'
], function (document, Pokerface) {
    'use strict';
    Pokerface.start(document);
});

