define([
    'module',
    'zepto'
], function (module, $) {
    var apiBaseUrl = module.config().url || '/api';

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
                    callback(null, data);
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
                    callback(null, data);
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

