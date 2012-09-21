require.config({
    shim: {
        'angular': {
            exports: 'angular'
        }
    }
});

define([
    'angular',

    // No export
    'pokerface/filters',
    'pokerface/services',
    'pokerface/directives',
    'pokerface/controllers'
], function (angular) {
    'use strict';

    angular.module('pokerface', ['pokerface.filters', 'pokerface.services', 'pokerface.directives', 'pokerface.controllers']).
        config(function ($routeProvider) {
        });
});

