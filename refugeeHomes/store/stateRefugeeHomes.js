/**
 * User type definition
 * @typedef {Object} RefugeeHomesState
 * @property {Boolean} active if true, viewer will rendered
 * @property {String} id id of the viewer component
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {Boolean} resizableWindow if true, window is resizable (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {Number} initialWidth initial width of the sidebar
 * @property {Array} layerIds ids of the refugee homes related layers
 * @property {Array} featureAttributes attributes that are shown in the table
 * @property {Array} features all refugee homes
 * @property {Array} filteredFeatures refugee homes of a district
 * @property {Array} ranking ranking used for sorting
 */

const state = {
    active: false,
    id: "refugeehomes",
    name: "additional:menu.tools.refugeehomes",
    icon: "house-fill",
    renderToWindow: false,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    initialWidth: 600,
    layerIds: ["4553", "4554", "10964", "10965", "4556", "4557", "9097", "23737"],
    featureAttributes: ["bemerkung", "bezirk", "platzzahl", "stadtteil", "bezeichnung", "geplante_inbetriebnahme", "pfad", "geom"],
    features: [],
    filteredFeatures: [],
    ranking: [
        "zea_bestehend",
        "nur_ea_bestehend",
        "oeru_bestehend",
        "oeru_geplant",
        "perspektive_wohnen_bestehend",
        "perspektive_wohnen_geplant",
        "standorte_schutzsuchende_ukraine"]
};

export default state;
