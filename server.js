#!/usr/bin/env nodemon

var fs = require('fs');
var express = require('express');

var app = express();

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use(app.router);

function redirect (url) {
    return function (request, response) {
        response.redirect(301, url);
    };
}

function index (request, response) {
    response.render('index', {
        assetsUrl: app.get('assetsUrl')
    });
}

if (app.get('env') === 'production') {
    // TODO
} else {
    app.set('assetsUrl', '/assets');
    app.set('appRoot', '/app');

    app.get('/', redirect('/app'));
    app.get('/app', index);
    app.use('/assets', express['static'](__dirname + '/assets'));
}


app.listen(3000);
console.log('Server is running at http://localhost:3000 (nodejs ' + process.version + ', ' + app.get('env') + ')');

