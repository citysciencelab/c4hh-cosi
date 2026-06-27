/**
 * User type definition
 * @typedef {Object} MietenspiegelFormularState
 * @property {Boolean} active - If true, MietenspiegelFormular will rendered.
 * @property {String} id - Id of the MietenspiegelFormular component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Boolean} renderToWindow - If true, tool is rendered in a window, else in sidebar.
 * @property {Boolean} resizableWindow - If true, window is resizable.
 * @property {Boolean} isVisibleInMenu - If true, tool is selectable in menu.
 */
const state = {
    id: "mietenspiegelFormular",
    type: "mietenspiegelFormular",
    hasMouseMapInteractions: true,
    addressCoordinate: undefined,
    // defaults for config.json parameters
    name: "additional:modules.tools.mietenspiegelFormular.title",
    icon: "bi-bar-chart-line-fill",
    layerIdMetadata: null,
    rentIndexLayerId: "2834",
    layerIdCalculation: null,
    collectionStatus: "01.04.2023",
    noticePdf: {
        "text": "Hamburger Mietenspiegel 2023",
        "link": "https://www.hamburg.de/resource/blob/155620/596874783e3150e5129db165a01c3147/d-mietenspiegel-broschuere-2023-data.pdf"
    }
};

export default state;
