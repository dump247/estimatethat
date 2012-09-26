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
                    //var oldData = window.jQuery.fn.data;
                    //window.jQuery.fn.data = function (name, value) {
                        //if (typeof name === 'undefined') {
                            //var data = {};
                            //var attributes = this[0].attributes;

                            //for (var i = 0; i < attributes.length; i += 1) {
                                //var attr = attributes[i];
                                //var attrName = attr.nodeName;

                                //if (attrName.substr(0, 5) === 'data-') {
                                    //data[attrName.substr(5)] = attr.nodeValue;
                                //}
                            //}

                            //return data;
                        //}

                        //return oldData.apply(this, arguments);
                    //};

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

