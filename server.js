#!/usr/bin/env nodemon

var fs = require('fs');
var express = require('express');
var crypto = require('crypto');
var url = require('url');
var _ = require('underscore');

var app = express();
var serverPort = 3000;

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
            }
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
            }
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
            }
        ]
    }
];

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

function normalizeCards (cards) {
    var prevValue = null;

    for (var i = 0; i < cards.length; i += 1) {
        var card = cards[i];
        var value;
        var label;

        if (card) {
            if (_.isString(card)) {
                if (prevValue === null) {
                    prevValue = i + 1;
                } else {
                    prevValue += 1;
                }

                value = prevValue;
                label = card;
            } else if (_.isNumber(card)) {
                prevValue = card;
                value = card;
                label = card.toString(10);
            } else {
                if (_.isNumber(card.value)) {
                    prevValue = card.value;
                    value = card.value;
                } else {
                    if (prevValue === null) {
                        prevValue = i + 1;
                    } else {
                        prevValue += 1;
                    }

                    value = prevValue;
                }

                if (_.isString(card.label)) {
                    label = card.label;
                } else {
                    label = value.toString(10);
                }
            }
        }

        cards[i] = {
            value: value,
            label: label
        };
    }
}

function create (request, response) {
    var roomType = request.body.type;
    var cards = request.body.cards;

    if (_.isArray(cards) && cards.length > 0) {
        roomType = 'custom';
        normalizeCards(cards);
    } else {
        if (! _.isString(roomType) || roomType === '') {
            roomType = 'modified-fibonacci';
        }

        cards = ROOM_TYPES[roomType];

        if (! cards) {
            response.send(400, 'Invalid room type ' + roomType);
            return;
        }
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
            cards: cards,
            created: created,
            access: created,
            url: createUrl(request, request.app.get('appRoot'), room_id)
        };

        rooms[room_id] = room;
        response.send(200, room);
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

app.api.post('create', create);

app.listen(serverPort);
console.log('Server is running at http://localhost:' + serverPort + ' (nodejs ' + process.version + ', ' + app.get('env') + ')');

