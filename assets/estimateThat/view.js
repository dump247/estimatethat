define([
    'handlebars',
    'backbone',
    'underscore',

    // Ignore export
    'estimateThat/helpers'
], function (Handlebars, Backbone, _) {
    return Backbone.View.extend({
        render: function () {
            if (! this._compiledTemplate) {
                if (_.isString(this.template)) {
                    this.template = $(this.template);
                }

                this._compiledTemplate = Handlebars.compile(this.template.html());
            }

            this.$el.html(this._compiledTemplate(this.context || this.options));

            return this;
        },

        dispose: function () {
            this.undelegateEvents();
        }
    });
});

