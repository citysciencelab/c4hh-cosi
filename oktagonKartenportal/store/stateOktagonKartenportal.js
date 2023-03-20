/**
 * User type definition
 * @typedef {Object} OktagonKartenportal
 * @property {String} id id of the OktagonKartenportal component
 * @property {Boolean} active if true, OktagonKartenportal will be rendered
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {Boolean} resizableWindow if true, window is resizable (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {Number} initialWidth Size of the sidebar when opening.
 * @property {Number} initialWidthMobile Mobile size of the sidebar when opening.
 * @property {String} backURL contains the return url to Oktagon.
 * @property {Number} zoomLevel contains the zoom level.
 * @property {String} returnURL contains the return url from the url parameter.
 * @property {String} address contains the address from the url parameter.
 * @property {String} submitURL contains the return url to Oktagon with parameters from the master portal.
 * @property {String[]} layerIds contains the layer id's to search for more parameters.
 * @property {Object} submitObject contains the parameter for the submitURL
 */
const state = {
    id: "OktagonKartenportal",
    active: false,
    name: "Georeferenzierung",
    icon: "bi-bullseye",
    renderToWindow: false,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    initialWidth: 400,
    initialWidthMobile: 300,
    backURL: "",
    zoomLevel: 9,
    returnURL: "",
    address: "",
    submitURL: "",
    layerIds: ["186", "19110"],
    submitObject: {}
};

export default state;
