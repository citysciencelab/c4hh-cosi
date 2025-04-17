/**
 * User type definition
 * @typedef {Object} downloadDataFormat the download data format.
 * @typedef {Object} SimulationToolState
 * @property {String} currentPlanningComponent the current open component in planningScenario.
 * @property {Array.<Object>} ensembles a list of ensembles
 * @property {boolean} ensemblesLoading flag indicating if ensembles are loading
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
 * @property {Object[]} planningScenarioSelectedDrawType - The selected draw type.
 * @property {Object[]} planningScenarioSelectedDrawTypeMain - The main selected draw type.
 * @property {Object[]} planningScenarioSelectedInteraction - The selected draw interaction.
 * @property {Object[]} planningScenarioStrokeRange - The stroke range.
 * @property {Object|null} process the current process
 * @property {Array.<Object>} processes a list of processes
 * @property {boolean} processesLoading flag indicating if processes are loading
 * @property {Array.<Object>} providers a list of providers
 * @property {boolean} providersLoading flag indicating if providers are loading
 * @property {string|null} selectedEnsembleId the selected ensemble id
 * @property {string|null} selectedJobId the selected job id
 * @property {string|null} selectedProcessId the selected process id
 * @property {String|null} simulationApiUrl The URL for the Urban Model Platform API
 * @property {Object} simulationAreaStyle - The default style for the simulation area (BBOX/Extent of planning scenario)
 * @property {Object[]} simulations - A list of all available simulations.
 * @property {Object} userDetailsCache cache for user details
 */
const state = {
    ensembles: [],
    ensemblesLoading: false,
    id: "simulationTool",
    type: "simulationTool",
    name: "additional:modules.tools.simulationTool.toolName",
    currentPlanningComponent: "",
    currentPlanningScenarioId: "",
    description: "additional:modules.tools.simulationTool.toolDescription",
    downloadDataFormat: {
        buffer: 0,
        scenarioFeature: {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: []
                    },
                    style: {
                        strokeColor: "",
                        strokewidth: ""
                    }
                }
            ]
        },
        simulationId: ""
    },
    icon: "bi-sliders2",
    img: {},
    jobResultData: {},
    jobs: [],
    jobsLoading: false,
    mode: "home-panel",
    planningScenarios: [],
    planningScenarioCurrentLayout: {
        fillColor: [0, 0, 0],
        fillTransparency: 100,
        strokeColor: [0, 0, 0],
        strokeWidth: 2,
        polygonDash: [10, 10]
    },
    planningScenarioDrawIcons: {
        box: "bi-square",
        polygon: "bi-octagon"
    },
    planningScenarioDrawTypesMain: ["polygon", "box"],
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
        "fill-color": [255, 255, 255, 0],
        "stroke-color": [66, 66, 66, 1],
        "stroke-line-dash": [5, 8],
        "stroke-width": 2
    },
    simulations: [],
    userDetailsCache: {}
};

export default state;
