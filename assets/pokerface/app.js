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
                    console.error(err.message, err);
                    return;
                }

                PokerfaceApp.openRoom(room);
            });
        }
    });

    var RoomView = Backbone.View.extend({
        render: function () {
            var template = Handlebars.compile($('#room-tmpl').html());
            this.$el.html(template({ room: this.options.room }));
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

        _renderRoom: function (room) {
            new RoomView({
                el: 'body',
                room: room
            }).render();
        },

        openRoom: function (room) {
            var app = this;

            if (this.running) {
                if (_.isString(room)) {
                    Pokerface.get(room, function (err, room) {
                        if (err) {
                            console.error(err.message, err);
                            return;
                        }

                        app.router.navigate(room.id);
                        app._renderRoom(room);
                    });
                } else {
                    app.router.navigate(room.id);
                    app._renderRoom(room);
                }
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

