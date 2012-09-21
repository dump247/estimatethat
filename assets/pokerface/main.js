require.config({
    deps: ['css!bootstrap/bootstrap', 'css!pokerface/app'],

    shim: {
        'angular': {
            exports: 'angular'
        }
    }
});

require([
    'require/domReady!',
    'angular',

    // Ignore export
    'pokerface/app'
], function (document, angular) {
    'use strict';
    angular.bootstrap(document, ['pokerface']);
});

