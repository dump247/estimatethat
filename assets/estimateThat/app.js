/*globals console location localStorage sessionStorage*/

define([
    'module',
    'underscore',
    'backbone',
    'zepto',
    'handlebars',

    'estimateThat/service',
    'estimateThat/view',

    // No module
    'bootstrap'
], function (module, _, Backbone, $, Handlebars, EstimateThat, EstimateThatView) {
    'use strict';

    var appRoot = module.config().root;

    var ModalView = EstimateThatView.extend({
        className: 'modal hide fade',

        _dialogEvents: _.extend({}, Backbone.Events),

        initialize: function () {
            var view = this;

            this.$el.on('hidden', function () {
                view.undelegateEvents();
                view.remove();

                var result = view._result || 'cancel';
                view._result = null;
                view._dialogEvents.trigger('closed', { result: result });
            });
        },

        cancel: function () {
            this.close('cancel');
        },

        close: function (result) {
            this._result = result;
            this.$el.modal('hide');
        },

        show: function () {
            this.render();
            $('body').append(this.el);
            this.$el.modal('show');
        },

        on: function (event, callback, context) {
            this._dialogEvents.on(event, callback, context || this);
            return this;
        },

        one: function (event, callback, context) {
            var handler = function () {
                this._dialogEvents.off(event, handler);
                callback.apply(context || this, arguments);
            };

            this._dialogEvents.on(event, handler, this);
            return this;
        }
    });

    var EditUserModal = ModalView.extend({
        template: '#edit-user-tmpl',

        events: {
            'submit form': function () { return false; },

            'click #edit-user-cancel-btn': 'cancel',

            'click #edit-user-accept-btn': function () {
                this.options.user = this.options.user || {};
                this.options.user.name = $('#edit-user-name-input').val();
                this.close('accept');
            }
        }
    });

    var NewRoomView = EstimateThatView.extend({
        template: '#new-room-tmpl',

        events: {
            'click button.new-room': function (evt) {
                EstimateThatApp.navigate.newRoom(evt.currentTarget.id);
            }
        }
    });

    var VoteView = EstimateThatView.extend({
        template: '#vote-tmpl',

        events: {
            'click .cards .card': function (evt) {
            }
        }
    });

    var RoomView = EstimateThatView.extend({
        template: '#room-tmpl',

        events: {
            'click .cards .card': 'selectCard',
            'click .vote-btn': 'vote'
        },

        vote: function () {
            EstimateThatApp.navigate.roomVote(this.options.room.id);
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

    var EstimateThatRouter = Backbone.Router.extend({
        routes: {
            '':              'index',
            ':room_id':      'room',
            ':room_id/vote': 'vote'
        },

        index: function () {
            EstimateThatApp.navigate.index();
        },

        vote: function (room_id) {
            EstimateThatApp.navigate.roomVote(room_id);
        },

        room: function (room_id) {
            EstimateThatApp.navigate.room(room_id);
        }
    });

    var EstimateThatApp = {
        running: false,
        router: null,
        room: null,
        roomView: null,

        navigate: {
            room: function (room_id) {
                var app = EstimateThatApp;

                app.router.navigate(room_id);

                app._loadRoom(room_id, function (err, room) {
                    if (err) {
                        console.error(err);
                        app.navigate.index();
                        return;
                    }

                    app._renderContentView(RoomView, { room: room });
                    app._switchRoom(room);
                });
            },

            roomVote: function (room_id) {
                var app = EstimateThatApp;

                app.router.navigate(room_id + '/vote');

                app._loadRoom(room_id, function (err, room) {
                    if (err) {
                        console.error(err);
                        app.navigate.index();
                        return;
                    }

                    app._renderContentView(VoteView, { room: room });
                    app._switchRoom(room);

                    app.login(function (err, user) {
                        if (err) {
                            app.navigate.room(room_id);
                            return;
                        }

                        // TODO room.join
                    });
                });
            },

            newRoom: function (type) {
                var app = EstimateThatApp;

                EstimateThat.create(type, function (err, room) {
                    if (err) {
                        console.error(err);
                        app.navigate.index();
                        return;
                    }

                    app.router.navigate(room.id);
                    app._renderContentView(RoomView, { room: room });
                    app._switchRoom(room);
                });
            },

            index: function () {
                var app = EstimateThatApp;

                EstimateThat.roomTypes(function (err, rooms) {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    app.router.navigate();
                    app._renderContentView(NewRoomView, { rooms: rooms });
                    app._switchRoom(null);
                });
            }
        },

        _loadRoom: function (room_id, callback) {
            if (this.room && this.room.id === room_id) {
                callback(null, this.room);
            } else {
                EstimateThat.get(room_id, callback);
            }
        },

        login: function (callback) {
            var user = {
                name: localStorage.getItem('user.name'),
                incognito: sessionStorage.getItem('user.incognito') === 'true'
            };

            if (user.name && ! user.incognito) {
                callback(null, user);
                return;
            }

            new EditUserModal({ user: user }).
                one('closed', function (evt) {
                    if (evt.result === 'accept') {
                        localStorage.setItem('user.name', user.name);
                        sessionStorage.removeItem('user.incognito');
                        callback(null, user);
                    } else {
                        callback('User canceled');
                    }
                }).
                show();
        },

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

        _renderContentView: function (ViewType, options) {
            if (this._contentView) {
                this._contentView.dispose();
                this._contentView = null;
            }

            this._contentView = new ViewType(_.extend({ el: '#content' }, options));
            this._contentView.render();
        },

        _switchRoom: function (newRoom) {
            if (this.room && (! newRoom || this.room.id !== newRoom.id)) {
                this.room.leave();
            }

            this.room = newRoom;
        },

        start: function () {
            if (! this.running) {
                this.running = true;
                this.router = new EstimateThatRouter();

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

    return EstimateThatApp;
});

