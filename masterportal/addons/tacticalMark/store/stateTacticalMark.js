/**
 * User type definition
 * @typedef {Object} TacticalMarkState
 * @property {Boolean} active if true, tacticalMark will rendered
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} hasMouseMapInteractions flag if tool should have mouse map interactions (config-param)
 */
const state = {
    active: false,
    id: "tacticalMark",
    // defaults for config.json parameters
    name: "additional:modules.tools.tacticalMark.title",
    icon: "bi-geo-fill",
    isVisibleInMenu: true,
    hasMouseMapInteractions: true
};

export default state;
