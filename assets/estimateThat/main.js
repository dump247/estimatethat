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
            exports: '$',
            init: function () {
                // Some patching to get bootstrap working
                if (! window.jQuery) {
                    window.jQuery = window.$;

                    if (! window.jQuery.support) {
                        window.jQuery.support = {};
                    }

                    var oldEvent = window.jQuery.Event;

                    window.jQuery.Event = function () {
                        var event = oldEvent.apply(this, arguments);
                        event.isDefaultPrevented = function () { return this.defaultPrevented; };
                        return event;
                    };
                }
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
    'estimateThat/app'
], function (document, EstimateThat) {
    'use strict';
    EstimateThat.start(document);
});

