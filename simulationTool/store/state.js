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
 * @property {Object|null} process the current process
 * @property {Array.<Object>} processes a list of processes
 * @property {boolean} processesLoading flag indicating if processes are loading
 * @property {Array.<Object>} providers a list of providers
 * @property {boolean} providersLoading flag indicating if providers are loading
 * @property {string|null} selectedEnsembleId the selected ensemble id
 * @property {string|null} selectedJobId the selected job id
 * @property {string|null} selectedProcessId the selected process id
 * @property {String|null} simulationApiUrl The URL for the Urban Model Platform API
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
        simulationId: "",
        features: {
            building: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: []
                        },
                        properties: {
                            height: 0
                        },
                        style: {
                            fillColor: "",
                            strokeColor: "",
                            strokewidth: "",
                            opacity: ""
                        }
                    }
                ]
            },
            street: {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: []
                        },
                        properties: {
                            height: 0
                        },
                        style: {
                            fillColor: "",
                            strokeColor: "",
                            strokewidth: "",
                            opacity: ""
                        }
                    }
                ]
            }
        }
    },
    icon: "bi-sliders2",
    img: {},
    jobResultData: {},
    jobs: [],
    jobsLoading: false,
    mode: "home-panel",
    planningScenarios: [{
        "id": "Szenario1",
        "name": "Planungsszenario 1"
    },
    {
        "id": "Szenario2",
        "name": "Planungsszenario 2"
    },
    {
        "id": "Szenario3",
        "name": "Planungsszenario 3"
    },
    {
        "id": "Szenario 4",
        "name": "Planungsszenario 4"
    },
    {
        "id": "Szenario 5",
        "name": "Planungsszenario 5"
    }],
    process: null,
    processes: [],
    processesLoading: false,
    providers: [],
    providersLoading: false,
    selectedEnsembleId: null,
    selectedJobId: null,
    selectedProcessId: null,
    simulationApiUrl: null,
    simulations: [],
    userDetailsCache: {}
};

export default state;
