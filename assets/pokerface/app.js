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

    var NewRoomView = Backbone.View.extend({
        events: {
            'click button.new-room': 'newRoom'
        },

        render: function () {
            var template = Handlebars.compile($('#new-room-tmpl').html());
            this.$el.html(template());
        },

        newRoom: function (evt) {
            Pokerface.create(evt.currentTarget.id, function (err, room) {
                console.log(err, room);
            });
        }
    });

    var PokerfaceRouter = Backbone.Router.extend({
        routes: {
            '':           'index',
            ':room_id':   'room'
        },

        index: function () {
            new NewRoomView({
                el: 'body'
            }).render();
            console.log('index');
        },

        room: function (room_id) {
            console.log('room ' + room_id);
        }
    });

    return {
        running: false,
        router: null,

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
});

