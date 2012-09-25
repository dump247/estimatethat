#!/usr/bin/env nodemon

var fs = require('fs');
var express = require('express');
var crypto = require('crypto');
var url = require('url');
var _ = require('underscore');

var app = express();
var serverPort = 3000;

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use(express.bodyParser());
app.use(app.router);

// TODO replace this with a real data store
var rooms = {};

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

function create (request, response) {
    var roomType = request.body.type.toLowerCase();

    if (roomType !== 'modified-fibonacci' &&
        roomType !== 'sequence' &&
        roomType !== 'shirt-sizes') {
        response.send(400, 'Invalid room type: ' + roomType);
        return;
    }

    crypto.randomBytes(7, function (ex, buf) {
        if (ex) {
            response.send(500);
            console.log('Error generating random room id: ', ex);
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

        var room_id = buf.toString();
        var created = new Date();
        var room = {
            id: room_id,
            type: roomType,
            created: created,
            access: created,
            url: createUrl(request, request.app.get('appRoot'), room_id)
        };

        rooms[room_id] = room;
        response.send(200, room);
    });
}

if (app.get('env') === 'production') {
    // TODO
} else {
    app.set('assetsUrl', '/assets');
    app.set('appRoot', '/app/');
    app.set('apiUrl', '/api');

    app.get('/', redirect('/app/'));
    app.get('/app/', index);
    app.get('/app', redirect('/app/'));
    app.use('/assets', express['static'](__dirname + '/assets'));
    app.post('/api/create', create);
}


app.listen(serverPort);
console.log('Server is running at http://localhost:' + serverPort + ' (nodejs ' + process.version + ', ' + app.get('env') + ')');

