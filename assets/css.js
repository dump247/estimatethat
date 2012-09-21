define([], function () {
    return {
        load: function (name, parentRequire, load, config) {
            var url = parentRequire.toUrl(name + '.css');

            var linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href = url;

            var headEl = document.getElementsByTagName('head')[0];
            headEl.appendChild(linkEl);

            load({ element: linkEl, href: url });
        }
    };
});

