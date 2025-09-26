/**
 * User type definition
 * @typedef {Object} DashboardState
 * @property {Boolean} [active=false] - Is activated (will rendered) or not (config-param).
 * @property {Object} columnHeader - The column header object
 * @property {Boolean} [deactivateGFI=true] - Deactivates the gfi if true (config-param).
 * @property {Boolean} fixedHeader - Renders a fixed columns if true.
 * @property {String} [icon="bi-speedometer"] - Bootstrap icon class (config-param).
 * @property {String} id - The id of the district selector component.
 * @property {String} [name="Dashboard"] - The name of the tool (config-param).
 * @property {String} prefixExportFilename - The prefix of exported file name.
 * @property {Boolean} [renderToWindow=true] - Renders tool in a window if true, otherwise in the sidebar (config-param).
 * @property {Boolean} [resizableWindow=false] - If True, window is resizable (config-param).
 * @property {object} toolBridgeIn: {settings: {}, type: "", outputCallback: ()=>{}} accepts settings from toolBridge (must have a *watcher*)
 * @property {object} toolBridgeOut: {}  pass current settings to toolBridge (must have a *getter*)
 * @property {String|String[]} trendColors - The trend color of arrows.
 */
const state = {
    active: false,
    calculations: [],
    columnHeader: {},
    deactivateGFI: false,
    excludedPropsForExport: ["visualized", "expanded", "years", "groupIndex"],
    exportGrouped: false,
    fixedHeader: false,
    icon: "bi-speedometer",
    id: "dashboard",
    ignoreColumnsByExport: false,
    isVisibleInMenu: true,
    items: [],
    name: "Dashboard",
    prefixExportFilename: "CoSI",
    readmeUrl: {
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/016statistischedatenuebersicht.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/016statistischedatenuebersicht.md"
    },
    renderToWindow: false,
    resizableWindow: true,
    reportTemplateMode: null,
    statsFeatureFilter: [],
    // these two variables are required to make this addon compatible with the toolBridge addon (for details see toolBridge documentation)
    toolBridgeIn: {settings: {}, type: "", outputCallback: null}, // accepts settings from toolBridge - must have a *watcher*
    toolBridgeOut: {}, // pass current settings to toolBridge - must have a *getter*,
    trendColors: ""
};

export default state;
