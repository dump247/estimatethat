define([
    'module',
    'zepto',
    'backbone',
    'underscore',
    'socket.io'
], function (module, $, Backbone, _, io) {
    var apiBaseUrl = module.config().url || '/api';

    var Room = _.extend({
        user: null,
        joined: false,
        selected: null,

        join: function (user, callback) {
            if (this.user) {
                throw Error('Room has already been joined');
            }

            if (! user) {
                throw Error('Must join with user info');
            }

            this.user = user;
            this.joined = false;

            this.socket = io.connect();

            var that = this;
            this.socket.emit('join', this.id, this.user, function (err, user) {
                if (err) {
                    that.leave();
                } else {
                    that.joined = true;

                    that.socket.on('select', function (user, value) {
                        that.trigger('user:select', user, value);
                    });

                    that.socket.on('join', function (user, value) {
                        that.socket.emit('select', that.selected);
                        that.trigger('user:join', user, value);
                    });

                    that.socket.on('leave', function (user) {
                        that.trigger('user:leave', user);
                    });

                    that.trigger('current:join', user);
                }

                if (callback) callback(err, user);
            });
        },

        select: function (value) {
            if (! this.socket) {
                return;
            }

            this.selected = value;
            this.socket.emit('select', value);
        },

        leave: function (silent) {
            if (this.socket) {
                var user = this.user;
                var joined = this.joined;

                this.socket.disconnect();
                this.socket = null;
                this.user = null;
                this.selected = null;
                this.joined = false;

                if (joined) {
                    this.trigger('current:leave', user);
                }
            }
        }
    }, Backbone.Events);

    return {
        roomTypes: function (callback) {
            var apiUrl = apiBaseUrl + '/roomTypes';

            $.ajax({
                type: 'GET',
                url: apiUrl,
                dataType: 'json',
                success: function (data) {
                    callback(null, data);
                },
                error: function (xhr, errorType, error) {
                    callback({
                        message: 'Error occurred getting list of room types.',
                        request: { url: apiUrl },
                        response: { status: xhr.status, reason: xhr.responseText }
                    });
                }
            });
        },

        get: function (room_id, callback) {
            var apiUrl = apiBaseUrl + '/room/' + room_id;

            $.ajax({
                type: 'GET',
                url: apiUrl,
                dataType: 'json',
                success: function (data) {
                    callback(null, _.extend(data, Room));
                },
                error: function (xhr, errorType, error) {
                    callback({
                        message: 'Error occurred getting room ' + room_id,
                        request: { url: apiUrl },
                        response: { status: xhr.status, reason: xhr.responseText }
                    });
                }
            });
        },

        create: function (type, callback) {
            var apiUrl = apiBaseUrl + '/create';
            var apiData = { type: type };

            $.ajax({
                type: 'POST',
                url: apiUrl,
                data: apiData,
                dataType: 'json',
                success: function (data) {
                    callback(null, _.extend(data, Room));
                },
                error: function (xhr, errorType, error) {
                    callback({
                        message: 'Error occurred creating ' + type + ' room.',
                        request: { url: apiUrl, data: apiData },
                        response: { status: xhr.status, reason: xhr.responseText }
                    });
                }
            });
        }
    };
});

