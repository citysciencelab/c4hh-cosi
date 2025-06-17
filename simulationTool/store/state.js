/**
 * User type definition
 * @typedef {Object} SimulationToolState
 * @property {string} currentEditableInput - The current editable input (e.g. buildings)
 * @property {string} currentInputName the current input name
 * @property {String} currentPlanningComponent the current open component in planningScenario.
 * @property {Object[]} dataSources - Array of data source configurations.
 * @property {Object[]} drawTypeLabels - the array of type and labels.
 * @property {Array.<Object>} ensembles a list of ensembles
 * @property {boolean} ensemblesLoading flag indicating if ensembles are loading
 * @property {Boolean} [hasMouseMapInteractions=true] If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String[]} hiddenSideMenus the side menu which should be hidden.
 * @property {string} id the ID of the simulation tool
 * @property {string} type the type of the simulation tool
 * @property {Object} img object containing keys and links to images
 * @property {Object} jobResultData data of the job result
 * @property {Array.<Object>} jobs a list of jobs
 * @property {boolean} jobsLoading flag indicating if jobs are loading
 * @property {string} mode the current view: 'processes', 'process', 'job' or 'map'
 * @property {Object[]} planningScenarios - The list of planning scenarios.
 * @property {Object[]} planningScenarioCurrentLayout - The current layout object as style.
 * @property {Object[]} planningScenarioDrawIcons - The draw icons.
 * @property {Object[]} planningScenarioDrawTypesMain - The main draw types.
 * @property {Object[]} planningScenarioHighlightFeatureStyle - The highlight feature style.
 * @property {ol/interaction/Select} planningScenarioSelectInteraction - The current select interactions.
 * @property {Object[]} planningScenarioSelectedDrawType - The selected draw type.
 * @property {Object[]} planningScenarioSelectedDrawTypeMain - The main selected draw type.
 * @property {Object[]} planningScenarioSelectedInteraction - The selected interaction.
 * @property {Object[]} planningScenarioStrokeRange - The stroke range.
 * @property {String} landuseActiveTab - The active tab in the landuse panel (existing or created).
 * @property {Object[]} landuseCurrentLayout - The current layout object as style for buildings or roads.
 * @property {Object[]} landuseRoadDrawIcons - The draw icons for roads.
 * @property {Object[]} landuseRoadDrawTypesMain - The main draw types for roads.
 * @property {number} onJobStatusChange - Counter for job status changes, used to trigger updates.
 * @property {Object|null} process the current process
 * @property {Array.<Object>} processes a list of processes
 * @property {boolean} processesLoading flag indicating if processes are loading
 * @property {Array.<Object>} providers a list of providers
 * @property {boolean} providersLoading flag indicating if providers are loading
 * @property {string|null} selectedEnsembleId the selected ensemble id
 * @property {string|null} selectedJobId the selected job id
 * @property {string|null} selectedProcessId the selected process id
 * @property {String} simulationIdForResults The Id of the simulation that is currently displayed in simulationResult component.
 * @property {Object[]} simulations - A list of all available simulations.
 * @property {String|null} simulationApiUrl The URL for the Urban Model Platform API
 * @property {Object} simulationAreaStyle - The default style for the simulation area (BBOX/Extent of planning scenario)
 * @property {Object} userDetailsCache cache for user details
 */
const state = {
    ensembles: [],
    ensemblesLoading: false,
    id: "simulationTool",
    type: "simulationTool",
    name: "additional:modules.tools.simulationTool.toolName",
    currentEditableInput: "",
    currentPlanningComponent: "",
    currentPlanningScenarioId: "",
    currentInputName: "",
    dataSources: [],
    description: "additional:modules.tools.simulationTool.toolDescription",
    hasMouseMapInteractions: true,
    hiddenSideMenus: [],
    icon: "bi-sliders2",
    img: {},
    jobResultData: {},
    jobs: [],
    jobsLoading: false,
    landuseActiveTab: "existing",
    landuseCurrentLayout: {
        fillColor: [60, 95, 148],
        fillTransparency: 0,
        strokeColor: [0, 0, 0],
        strokeWidth: 2
    },
    landuseRoadDrawIcons: {
        line: "bi-slash-lg"
    },
    landuseRoadDrawTypesMain: ["line"],
    mode: "home-panel",
    onJobStatusChange: 0,
    planningScenarios: [],
    planningScenarioCurrentLayout: {
        fillColor: [0, 0, 0],
        fillTransparency: 100,
        strokeColor: [0, 0, 0],
        strokeWidth: 2
    },
    planningScenarioDrawIcons: {
        box: "bi-square",
        polygon: "bi-octagon"
    },
    planningScenarioDrawTypesMain: ["polygon", "box"],
    planningScenarioHighlightFeatureStyle: {
        fillColor: [0, 0, 0],
        fillTransparency: 100,
        strokeColor: [60, 95, 148, 1],
        strokeWidth: 4
    },
    planningScenarioSelectInteraction: null,
    drawTypeLabels: [{type: "polygon", label: "additional:modules.tools.simulationTool.freeForm"}, {type: "box", label: "additional:modules.tools.simulationTool.rectangle"}, {type: "line", label: "additional:modules.tools.simulationTool.line"}],
    planningScenarioSelectedDrawType: "",
    planningScenarioSelectedDrawTypeMain: "",
    planningScenarioSelectedInteraction: null,
    planningScenarioStrokeRange: [1, 16],
    previousComponentOfSimulation: "home-panel",
    process: null,
    processes: [],
    processesLoading: false,
    providers: [],
    providersLoading: false,
    selectedEnsembleId: null,
    selectedJobId: null,
    selectedProcessId: null,
    simulationApiUrl: null,
    simulationAreaStyle: {
        fillColor: [255, 255, 255, 0],
        strokeColor: [66, 66, 66, 1],
        strokeLineDash: [5, 8],
        strokeWidth: 2
    },
    simulationAreaStyleInvalid: {
        fillColor: [255, 255, 255, 0],
        strokeColor: [225, 0, 25, 1],
        strokeLineDash: [5, 8],
        strokeWidth: 4,
        zIndex: Number.POSITIVE_INFINITY
    },
    simulationIdForResults: "",
    simulations: [],
    userDetailsCache: {}
};

export default state;
