/**
 * QuickResponseCode tool state definition.
 * @typedef {Object} SchoolRoutePlanningState
 * @property {String} id Id of the QuickResponseCode component.
 * @property {Boolean} active If true, QuickResponseCode will be rendered.
 * @property {String} name Displayed as the title.
 * @property {String} icon Icon next to the title.
 * @property {Boolean} renderToWindow If true, tool is rendered in a window, else in the sidebar.
 * @property {Boolean} resizableWindow Specifies whether the window should be resizable.
 * @property {Boolean} deactivateGFI Specifies whether the gfi should be disabled when this tool is opened.
 * @property {String} urlSchema The url schema.
 * @property {String} text Specifies the text that will be displayed in the toolwindow.
 * @property {String} projection Specifies the projection in which the coordinates are inserted into the URL.
 * @property {Number} evtCoordinate The event click coordinate.
 */
const state = {
    id: "quickResponseCode",
    active: false,
    name: "additional:modules.tools.quickResponseCode.title",
    icon: "bi-signpost",
    renderToWindow: true,
    resizableWindow: true,
    deactivateGFI: true,
    urlSchema: "https://www.google.de/maps/@{{LAT}},{{LON}}",
    text: "additional:modules.tools.quickResponseCode.text",
    projection: "EPSG:25832",
    evtCoordinate: null
};

export default state;
