/**
 * User type definition
 * @typedef {Object} DistrictFinderState
 * @property {Boolean} [active=false] - Is activated (will be rendered) or not (config-param).
 * @property {Object} [chartColors= conditionFalse: "rgb(220, 226, 243, 1)", conditionTrue: "rgb(0, 67, 122, 1)"] - Colors for the diagram depending on whether a condition is true or false
 * @property {Number} [choroplethDebounceDelay=300] - Delay in ms for which choropleth rendering is withhold to wait for further user input. Can be adjusted according to user feedback.
 * @property {Boolean} [deactivateGFI=false] - Deactivates the gfi if true (config-param).
 * @property {ol/Layer} filteredLayer - The layer for filtered features.
 * @property {String[]} groupBlacklist - The blacklist of groups which will not be sent for the first district request.
 * @property {String} [icon="bi-folder2-open"] - Bootstrap icon class (config-param).
 * @property {String} id - The id of the district finder component.
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Object} [mapColors= conditionFalse: "rgb(220, 226, 243, 0.5)", conditionTrue: "rgb(0, 67, 122, 0.5)"] - Colors for map if there are districts in selected districts matched the conditions.
 * @property {Object} [mapping=[]] - Mapping array defining the available categories. Distinct from mapping from DistrictSelector, which may be changed according to template selection.
 * @property {String} [referenceLineColor="rgba(255, 0, 0, 0.5)"] Color of the line that indicates the reference value in the chart.
 * @property {String} [name="additional:modules.tools.cosi.districtFinder.title"] - The name of the tool (config-param).
 * @property {Boolean} [renderToWindow=true] - Renders tool in a window if true, otherwise in the sidebar (config-param).
 * @property {Boolean} [resizableWindow=false] - If True, window is resizable (config-param).
 * @property {Number} [numberOfSelectableLevels=2] - The number of possible selectable district levels. Starts at the lowest level.
 * @property {String} [selectedLevelId=""] - The id of the selected level.
 * @property {Object[]} [selectedDistricts=[]] - The districts on which the screening is executed.
 */
const state = {
    active: false,
    description: "additional:modules.cosi.districtFinder.description",
    chartColors: {
        conditionFalse: "rgb(220, 226, 243, 1)",
        conditionTrue: "rgb(0, 67, 122, 1)"
    },
    cardList: [],
    choroplethDebounceDelay: 300,
    conditionDate: "",
    conditionTitle: "",
    deactivateGFI: true,
    filteredLayer: undefined,
    groupBlacklist: [],
    icon: "bi-search",
    id: "districtFinder",
    isVisibleInMenu: true,
    mapColors: {
        "conditionFalse": "rgba(220, 226, 243, 0.8)",
        "conditionTrue": "rgba(0, 67, 122, 0.8)"
    },
    mapping: [],
    name: "additional:modules.tools.cosi.districtFinder.title",
    readmeUrl: {
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/025_GebieteScreening.md"
    },
    referenceLineColor: "rgba(255, 0, 0, 0.5)",
    renderToWindow: true,
    resizableWindow: false,
    selectedLevelId: "",
    selectedDistricts: [],
    subLevelSelection: [],
    topLevelSelection: []
};

export default state;
