import Ember from 'ember';
import config from 'ember-get-config';
import Analytics from 'ember-osf/mixins/analytics';
import OSFAgnosticAuthRouteMixin from 'ember-osf/mixins/osf-agnostic-auth-route';
import buildProviderAssetPath from '../utils/build-provider-asset-path';

/**
 * @module ember-preprints
 * @submodule routes
 */

/**
 * @class Application Route Handler
 */
export default Ember.Route.extend(Analytics, OSFAgnosticAuthRouteMixin, {
    i18n: Ember.inject.service(),
    store: Ember.inject.service(),
    theme: Ember.inject.service(),
    headTagsService: Ember.inject.service('head-tags'),
    headTags: function() {
        return [{
            type: 'link',
            attrs: {
                rel: 'shortcut icon',
                href: buildProviderAssetPath(config, this.get('theme.id'), 'favicon.ico', window.isProviderDomain)
            }
        }]
    },
    themeObserver: Ember.observer('theme.id', function() {
        this.get('headTagsService').collectHeadTags();
    }),
    beforeModel: function () {
        let detectBrandedDomain = () => {
            // Set the provider ID from the current origin
            if (window.isProviderDomain) {
                return this.get('store').query(
                    'preprint-provider',
                    {
                        filter: {
                            domain: `${window.location.origin}/`,
                        }
                    }
                ).then(providers => {
                    if (providers.length) {
                        this.set('theme.id', providers.objectAt(0).get('id'));
                    }
                });
            }
        };
        let parentResult = this._super(...arguments);
        // Chain on to parent's promise if parent returns a promise.
        return parentResult instanceof Promise ? parentResult.then(detectBrandedDomain) : detectBrandedDomain();
    },

    afterModel: function() {
        const availableLocales = this.get('i18n.locales').toArray();
        let locale;

        // Works in Chrome and Firefox (editable in settings)
        if (navigator.languages && navigator.languages.length) {
            for (let lang of navigator.languages) {
                if (availableLocales.includes(lang)) {
                    locale = lang;
                    break;
                }
            }
        }
        // Backup for Safari (uses system settings)
        else if (navigator.language && availableLocales.includes(navigator.language)) {
            locale = navigator.language;
        }

        if (locale)
            this.set('i18n.locale', locale);
    }
});
