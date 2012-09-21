define([
    'angular',

    'require/text!pokerface/newRoom.hbs',

    // No export
    'pokerface/filters',
    'pokerface/services',
    'pokerface/directives',
    'pokerface/controllers'
], function (angular, NewRoomTmpl) {
    'use strict';

    var app = angular.module('pokerface', [
        'pokerface.filters',
        'pokerface.services',
        'pokerface.directives',
        'pokerface.controllers'
    ]);

    app.config(function ($routeProvider) {
        $routeProvider.
            when('/', { controller: 'newRoom', template: NewRoomTmpl }).
            otherwise({ redirectTo: '/' });
    });

    return app;
});

