define([
    'angular',
    'pokerface/newRoomCtrl'
], function (angular, NewRoomCtrl) {
    'use strict';
    return angular.module('pokerface.controllers', []).
        controller('newRoom', NewRoomCtrl);
});

