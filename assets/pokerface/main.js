require.config({
    map: {
        '*': {
            'socket.io': '/socket.io/socket.io.js'
        }
    },

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
        },

        '/socket.io/socket.io.js': {
            exports: 'io'
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

