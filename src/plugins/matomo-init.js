import VueMatomo from "vue-matomo";

/**
 * Initiate Matomo via vue-matomo-package.
 * @param {Object} app Vue-app
 * @returns {void}
 */
export function initiateMatomo (app) {
    app.use(VueMatomo, Config.matomo);
}
