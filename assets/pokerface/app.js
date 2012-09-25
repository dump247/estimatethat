/*globals console location*/

define([
    'module',
    'underscore',
    'backbone',
    'zepto',
    'handlebars',

    'pokerface/service'
], function (module, _, Backbone, $, Handlebars, Pokerface) {
    'use strict';

    var appRoot = module.config().root;

    Handlebars.registerHelper('join', function (arr, separator, options) {
        if (options.inverse && !arr.length) {
            return options.inverse(this);
        }

        return arr.map(function (item) {
            return options.fn(item);
        }).join(separator);
    });

    var NewRoomView = Backbone.View.extend({
        events: {
            'click button.new-room': 'newRoom'
        },

        render: function () {
            var template = Handlebars.compile($('#new-room-tmpl').html());
            this.$el.html(template({ rooms: this.options.rooms }));
        },

        newRoom: function (evt) {
            Pokerface.create(evt.currentTarget.id, function (err, room) {
                if (err) {
                    console.error(err);
                    return;
                }

                PokerfaceApp.openRoom(room);
            });
        }
    });

    var PokerfaceRouter = Backbone.Router.extend({
        routes: {
            '':           'index',
            ':room_id':   'room'
        },

        index: function () {
            Pokerface.roomTypes(function (err, rooms) {
                if (err) {
                    console.error(err);
                    return;
                }

                new NewRoomView({
                    el: 'body',
                    rooms: rooms
                }).render();
            });
        },

        room: function (room_id) {
            PokerfaceApp.openRoom(room_id);
        }
    });

    var PokerfaceApp = {
        running: false,
        router: null,

        openRoom: function (room) {
            if (this.running) {
                if (_.isString(room)) {
                    // TODO load room via service api
                    room = {
                        id: room
                    };
                }

                this.router.navigate(room.id);
            }
        },

        start: function () {
            if (! this.running) {
                this.running = true;
                this.router = new PokerfaceRouter();

                Backbone.history.start({
                    pushState: true,
                    root: appRoot
                });
            }
        }
    };

    return PokerfaceApp;
});

