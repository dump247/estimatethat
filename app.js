#!/usr/bin/env nodemon

var fs = require('fs');
var express = require('express');
var crypto = require('crypto');
var url = require('url');
var _ = require('underscore');
var socket = require('socket.io');
var http = require('http');
var packageInfo = require('./package.json');

var rooms = require('./lib/rooms');

var app = express();
var server = http.createServer(app);

var serverPort = process.env.VMC_APP_PORT || 3000;

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

        callback(null, buf.toString('base64'));
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
    app.set('assetsUrl', '/assets/' + packageInfo.version);
    app.set('appRoot', '/');

    var oneYear = 31557600000;

    app.get('/', index);
    app.use(app.get('assetsUrl'), express['static'](__dirname + '/assets', { maxAge: oneYear }));
    app.get('/:room_id', index);
    app.get('/:room_id/vote', index);
} else {
    app.set('assetsUrl', '/assets');
    app.set('appRoot', '/app/');

    app.get('/', redirect('/app/'));
    app.get('/app/', index);
    app.get('/app/:room_id', index);
    app.get('/app/:room_id/vote', index);
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
    response.send(200, rooms);
});

app.api.get('room/:room_id', function (request, response) {
    var room_id = request.params.room_id;

    if (! room_id || room_id.length !== 8) {
        response.send(400, 'Invalid room id: ' + room_id);
        return;
    }

    var room_type = getRoomType(room_id[0]);

    if (room_type) {
        response.send(200, {
            id: room_id,
            url: createUrl(request, app.get('appRoot'), room_id),
            type: room_type
        });
    } else {
        response.send(404, 'Room not found: ' + room_id);
    }
});

app.api.post('create', function (request, response) {
    var room = {
       type: getRoomType(request.body.type)
    };

    if (! room.type) {
        response.send(400, 'Unknown room type: ' + request.body.type);
        return;
    }

    generateSafeId(7, function (err, room_id) {
        if (err) {
            console.log('Error generating room id', err);
            response.send(500, 'Error creating room');
            return;
        }

        room.id = room.type.code + room_id;
        room.url = createUrl(request, app.get('appRoot'), room.id);
        response.send(200, room);
    });
});

server.listen(serverPort);

function getRoomType (id) {
    return _.find(rooms, function (r) { return r.id === id || r.code === id; });
}

io = socket.listen(server);
io.sockets.on('connection', function (socket) {
    socket.on('join', function (room_id, user_name, fn) {
        if (! _.isString(room_id) || room_id.length !== 8) {
            fn('Invalid room id');
            return;
        }

        room_id = room_id.toLowerCase();

        if (! getRoomType(room_id[0])) {
            fn('Invalid room id');
            return;
        }

        if (! _.isString(user_name)) {
            fn('Invalid user name');
            return;
        }

        user_name = user_name.replace(/^\s+|\s+$/g, '');

        if (user_name.length === 0) {
            fn('Invalid user name');
            return;
        }

        var registration = {
            user: {
                name: user_name,
                id: socket.id
            },

            room: {
                id: room_id
            }
        };

        socket.set('registration', registration, function (err) {
            if (err) {
                if (fn) fn('Error joining room');
                return;
            }

            socket.join(room_id);
            socket.broadcast.to(room_id).emit('join', registration.user);

            if (fn) fn(null, registration.user);
        });
    });

    socket.on('select', function (value) {
        socket.get('registration', function (err, registration) {
            if (err || ! registration) {
                return;
            }

            socket.broadcast.to(registration.room.id).emit('select', registration.user, value);
        });
    });

    socket.on('disconnect', function () {
        socket.get('registration', function (err, registration) {
            if (err || ! registration) {
                return;
            }

            socket.broadcast.to(registration.room.id).emit('leave', registration.user);
        });
    });
});

console.log('Server is running at http://localhost:' + serverPort + ' (nodejs ' + process.version + ', ' + app.get('env') + ')');

