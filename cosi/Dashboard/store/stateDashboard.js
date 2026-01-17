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
 * @property {String|String[]} trendColors - The trend color of arrows.
 * @property {object} toolBridgeOut: {}  pass current settings to toolBridge (must have a *getter*)
 * @property {String|String[]} trendColors - The trend color of arrows.
 */
const state = {
    active: false,
    aggregateColumns: [
        {
            get text () {
                return i18next.t("additional:modules.tools.cosi.dashboard.totalCol");
            },
            value: "total",
            align: "end",
            sortable: false,
            groupable: false,
            selected: false,
            isAggregation: true
        },
        {
            get text () {
                return i18next.t("additional:modules.tools.cosi.dashboard.avgCol");
            },
            value: "average",
            align: "end",
            sortable: false,
            groupable: false,
            selected: false,
            isAggregation: true
        }
    ],
    calculations: [],
    columnHeader: {},
    deactivateGFI: false,
    districtColumns: [],
    excludedPropsForExport: ["visualized", "expanded", "years", "groupIndex"],
    exportGrouped: false,
    fixedHeader: false,
    icon: "bi-speedometer",
    id: "dashboard",
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
    rows: [],
    statsFeatureFilter: [],
    timestamps: [],
    timestampsFiltered: [],
    timestampPrefix: "jahr_",
    trendColors: ""
};

export default state;
