import isObject from "../../../../src/shared/js/utils/isObject.js";
import store from "../../../../src/app-store/index.js";

/**
 * Registers the Observer.
 * @param {Object} vueStore The store from the component.
 * @returns {void}
 */
function register (vueStore) {
    vueStore.dispatch("Modules/SessionTool/register", {key: "Filter", getter: getFilterState, setter: setFilter});
}
/**
 * Gets the current filter state.
 * @returns {Object} The current state of the filter.
 */
function getFilterState () {
    store.dispatch("Modules/Filter/serializeState");
    const string = store.getters["Modules/Filter/serializedString"];

    return JSON.parse(string);
}
/**
 * Sets the filter state.
 * @param {Object} payload The payload.
 * @param {Object[]} payload.rulesOfFilters The array of rules for each filter.
 * @param {Object[]} payload.selectedAccordions The accordions to select.
 * @returns {void}
 */
function setFilter (payload) {
    if (!Array.isArray(payload?.rulesOfFilters) || payload?.rulesOfFilters.length === 0
        && (!isObject(payload?.geometryFeature) || Object.keys(payload.geometryFeature).length === 0)) {
        return;
    }

    store.dispatch("Modules/Filter/deserializeState", payload);
    store.dispatch("Menu/changeCurrentComponent", {type: "filter", side: "secondaryMenu", props: {name: "filter"}}, {root: true});
}

export {
    register,
    getFilterState,
    setFilter
};
