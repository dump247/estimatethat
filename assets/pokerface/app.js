/*globals console location localStorage*/

define([
    'module',
    'underscore',
    'backbone',
    'zepto',
    'handlebars',

    'pokerface/service',

    // No module
    'bootstrap'
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
        events: {
            'click .cards .card': 'selectCard'
        },

        initialize: function (options) {
            var view = this;

            function updateUser (user, card) {
                var userTemplate = Handlebars.compile($('#user-tmpl').html());
                var userContent = userTemplate({ user: user, card: card });
                var $user = $('#user_' + user.id, view.el);

                if ($user.length > 0) {
                    $user.replaceWith(userContent);
                } else {
                    $('#users', view.el).append(userContent);
                }

                view._updateStats();
            }


            options.room.on('user:join', function (user, card) {
                updateUser(user, card);
            });

            options.room.on('user:leave', function (user) {
                $('#user_' + user.id, view.el).remove();
                view._updateStats();
            });

            options.room.on('user:select', function (user, card) {
                updateUser(user, card);
            });
        },

        render: function () {
            var template = Handlebars.compile($('#room-tmpl').html());
            this.$el.html(template({ room: this.options.room }));
        },

        selectCard: function (evt) {
            var $card = $(evt.currentTarget);

            if ($card.hasClass('selected')) {
                $card.removeClass('selected');
                this.options.room.select(null);
            } else {
                $('.cards .card', this.el).removeClass('selected');
                $card.addClass('selected');
                this.options.room.select({
                    value: $card.data('value'),
                    label: $card.data('label')
                });
            }

            this._updateStats();
        },

        _getCard: function (value) {
            return _.find(this.options.room.type.cards, function (c) { return c.value.toString() === value; });
        },

        _updateStats: function () {
            var view = this;
            var $users = $('#users .user');

            $('.card .count').hide();

            if ($users.length === 0) {
                $('#stats').hide();
            } else {
                $('#stats').show();

                var average = {
                    count: 0,
                    total: 0,
                    infinity: false,
                    value: function () {
                        if (this.infinity) {
                            return Infinity;
                        }

                        return this.total === 0 ? 0 : this.total / this.count;
                    }
                };

                var totals = {
                };

                $('.card.selected', this.el).each(function () {
                    var card = view._getCard($(this).data('value'));

                    if (card) {
                        var total = totals[card.value.toString()] || 0;
                        totals[card.value.toString()] = total + 1;

                        if (_.isNumber(card.value)) {
                            if (card.value === Number.MAX_VALUE) {
                                average.infinity = true;
                            } else {
                                average.count += 1;
                                average.total += card.value;
                            }
                        }
                    }
                });

                $('#stat-average .stat-value').text(average.value().toFixed(2));
                $('.card .count').each(function () {
                    var $count = $(this);
                    var cardValue = $count.parent().data('value');

                    if (totals[cardValue]) {
                        $count.text(totals[cardValue]).show();
                    }
                });
            }
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
                    el: '#content',
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
        room: null,
        roomView: null,

        currentUser: function (callback) {
            var user = localStorage.getItem('user');

            if (! user) {
                $('#name-modal').modal('show').one('hide', function () {
                    var user_name = $('#name-modal').data('user_name');
                    localStorage.setItem('user', user_name);
                    callback(user_name);
                });
            } else {
                callback(user);
            }
        },

        _renderRoom: function (room) {
            var oldRoom = this.room;

            this.room = room;

            if (this.roomView) {
                this.roomView.change(this.room);
            } else {
                this.roomView = new RoomView({
                    el: '#content',
                    room: room
                });

                this.roomView.render();
            }

            if (oldRoom) {
                oldRoom.leave();
            }

            this.currentUser(function (user) {
                if (user) {
                    room.join(user, function (err) {
                        if (err) {
                            console.error('Error joining room ' + room.id, err);
                            return;
                        }
                    });
                }
            });
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

                $('#name-modal').on('hidden', function () {
                    $('#name-modal').data('user_name', '');
                    $('#input-name').val('');
                });

                $('#name-modal').on('shown', function () {
                    $('#input-name')[0].focus();
                });

                $('#name-modal')[0].onsubmit = function () {
                    var user_name = $('#input-name').val();

                    if (user_name.length > 0) {
                        $('#name-modal').data('user_name', user_name);
                        $('#name-modal').modal('hide');
                    }

                    return false;
                };
            }
        }
    };

    return PokerfaceApp;
});

