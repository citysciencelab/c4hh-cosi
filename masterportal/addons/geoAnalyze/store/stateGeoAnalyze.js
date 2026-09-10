/**
 * User type definition
 * @typedef {object} GeoAnalyse
 * @property {string} id id of the GeoAnalyse component
 * @property {Boolean} [hasMouseMapInteractions=true] If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {string} name displayed as title (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {string} The url of the AIS GeoAnalyze API.
 */
const state = {
    id: "geometryAnalyse",
    hasMouseMapInteractions: true,
    // defaults for config.json parameters
    name: "Geometrie Analyse",
    icon: "bi-list-task",
    apiUrl: ""
};

export default state;
