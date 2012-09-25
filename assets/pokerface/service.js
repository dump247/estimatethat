define([
    'module',
    'zepto'
], function (module, $) {
    var apiBaseUrl = module.config().url || '/api';

    return {
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

