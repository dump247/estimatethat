#!/usr/bin/env nodemon

var fs = require('fs');
var express = require('express');
var crypto = require('crypto');
var url = require('url');
var _ = require('underscore');
var socket = require('socket.io');
var http = require('http');

var app = express();
var server = http.createServer(app);

var serverPort = 3000;

var INFINITY_CARD = {
    value: Number.MAX_VALUE,
    label: "\u221E"
};

var QUESTION_CARD = {
    label: '?'
};

var BREAK_CARD = {
    label: "\u2615"
};

var ROOM_TYPES = [
    {
        id: 'shirt-sizes',
        title: 'Shirt Sizes',
        code: 'a',
        cards: [
            {
                value: 1,
                label: 'XS'
            }, {
                value: 2,
                label: 'S'
            }, {
                value: 3,
                label: 'M'
            }, {
                value: 4,
                label: 'L'
            }, {
                value: 5,
                label: 'XL'
            },
            INFINITY_CARD,
            QUESTION_CARD,
            BREAK_CARD
        ]
    },

    {
        id: 'sequence',
        title: 'Sequence',
        code: 'b',
        cards: [
            {
                value: 0,
                label: '0'
            }, {
                value: 1,
                label: '1'
            }, {
                value: 2,
                label: '2'
            }, {
                value: 3,
                label: '3'
            }, {
                value: 4,
                label: '4'
            }, {
                value: 5,
                label: '5'
            }, {
                value: 6,
                label: '6'
            }, {
                value: 7,
                label: '7'
            }, {
                value: 8,
                label: '8'
            }, {
                value: 9,
                label: '9'
            }, {
                value: 10,
                label: '10'
            },
            INFINITY_CARD,
            QUESTION_CARD,
            BREAK_CARD
        ]
    },

    {
        id: 'modified-fibonacci',
        title: 'Modified Fibonacci',
        code: 'c',
        cards: [
            {
                value: 0,
                label: '0'
            }, {
                value: 0.5,
                label: "\u00BD"
            }, {
                value: 1,
                label: '1'
            }, {
                value: 2,
                label: '2'
            }, {
                value: 3,
                label: '3'
            }, {
                value: 5,
                label: '5'
            }, {
                value: 8,
                label: '8'
            }, {
                value: 13,
                label: '13'
            }, {
                value: 20,
                label: '20'
            }, {
                value: 40,
                label: '40'
            }, {
                value: 100,
                label: '100'
            },
            INFINITY_CARD,
            QUESTION_CARD,
            BREAK_CARD
        ]
    }
];

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use(express.bodyParser());
app.use(app.router);

function createUrl (request) {
    return url.format({
        protocol: request.protocol,
        hostname: request.host,
        port: serverPort,
        pathname: _.toArray(arguments).slice(1).join('/').replace('//', '/')
    });
}

function redirect (url) {
    return function (request, response) {
        response.redirect(301, url);
    };
}

function index (request, response) {
    response.render('index', {
        assetsUrl: app.get('assetsUrl'),
        apiUrl: app.get('apiUrl'),
        appRoot: app.get('appRoot')
    });
}

function generateId (len, callback) {
    crypto.randomBytes(len, function (ex, buf) {
        if (ex) {
            callback(ex);
            return;
        }

        callback(null, buf.toString());
    });
}

function generateSafeId (len, callback) {
    crypto.randomBytes(len, function (ex, buf) {
        if (ex) {
            callback(ex);
            return;
        }

        for (var i = 0; i < buf.length; i += 1) {
            var val = buf[i] % 36;

            if (val === 0) {
                // Map 0 to o to reduce typos since they look similar
                buf[i] = 111;
            } else if (val === 1) {
                // Map 1 to l to reduce typos since they look similar
                buf[i] = 108;
            } else if (val <= 9) {
                buf[i] = val + 48;
            } else {
                buf[i] = val + 97 - 10;
            }
        }

        callback(null, buf.toString());
    });
}

if (app.get('env') === 'production') {
    // TODO assetsUrl
    app.set('appRoot', '/');

    app.get('/', index);
    app.get('/:room_id', index);
} else {
    app.set('assetsUrl', '/assets');
    app.set('appRoot', '/app/');

    app.get('/', redirect('/app/'));
    app.get('/app/', index);
    app.get('/app/:room_id', index);
    app.get('/app', redirect('/app/'));
    app.use('/assets', express['static'](__dirname + '/assets'));
}

app.api = {
    root: app.get('appRoot') + 'api',

    get: function (path, callback) {
        app.get(this.root + '/' + path, callback);
    },

    post: function (path, callback) {
        app.post(this.root + '/' + path, callback);
    }
};

app.set('apiUrl', app.api.root);

app.api.get('roomTypes', function (request, response) {
    response.send(200, ROOM_TYPES);
});

server.listen(serverPort);

function getRoomType (id) {
    id = id.toLowerCase();
    return _.find(ROOM_TYPES, function (r) { return r.id === id; });
}

function initUser (user, callback) {
    if (user) {
        if (_.isObject(user)) {
            user = {
                name: user.name,
                id: user.id
            };
        } else {
            user = {
                name: user.toString()
            };
        }
    } else {
        user = {};
    }

    if (user.id) {
        callback(null, user);
    } else {
        generateId(36, function (err, user_id) {
            if (err) {
                callback(err);
                return;
            }

            user.id = user_id;
            callback(null, user);
        });
    }
}

socket.listen(server).sockets.on('connection', function (socket) {
    socket.on('create', function (room_type_id, user, fn) {
        var room = {
            type: getRoomType(room_type_id)
        };

        if (! room.type) {
            fn('Unknown room type: ' + room_type_id);
            return;
        }

        initUser (user, function (err, user) {
            if (err) {
                fn('Error creating room');
                return;
            }

            generateSafeId(7, function (err, room_id) {
                if (err) {
                    fn('Error creating room');
                    return;
                }

                room.id = room.type.code + room_id;
                socket.join(room_id);

                fn(null, { user: user, room: room });
            });
        });
    });
});

console.log('Server is running at http://localhost:' + serverPort + ' (nodejs ' + process.version + ', ' + app.get('env') + ')');

