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
            exports: function () {
                if (! window.jQuery) {
                    window.jQuery = window.$;
                    window.jQuery.support = {};

                    var oldEvent = window.jQuery.Event;

                    window.jQuery.Event = function () {
                        var event = oldEvent.apply(this, arguments);
                        event.isDefaultPrevented = function () { return false; };
                        return event;
                    };
                }
                return window.$;
            }
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
        },

        'bootstrap': {
            depends: ['zepto'],
            exports: '$.fn.modal'
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

