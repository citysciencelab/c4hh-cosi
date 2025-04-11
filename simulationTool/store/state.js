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
        "name": "Planungsszenario 1",
        "features": {
            "building": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "id": "DEHHALKA10007tqf-piece",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [[566691.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566691.619, 5934737.624]]
                            ]
                        },
                        "properties": {
                            "id": 117244,
                            "building_height": 30.352
                        }
                    },
                    {
                        "type": "Feature",
                        "id": "EHHALKA10007tqf-piece",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [[566691.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566691.619, 5934737.624]]
                            ]
                        },
                        "properties": {
                            "id": 117245,
                            "building_height": 30.352
                        }
                    },
                    {
                        "type": "Feature",
                        "id": "DEHHALKA10007tqf-piece2",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [[566692.619, 5934737.624], [566678.396, 5934719.947], [566678.335, 5934719.865], [566692.619, 5934737.624]]
                            ]
                        },
                        "properties": {
                            "id": 117244,
                            "building_height": 20.352,
                            "created": true
                        }
                    }
                ]
            },
            "street": {}
        }
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
    planningScenarioCurrentLayout: {
        fillColor: [0, 0, 0],
        fillTransparency: 100,
        strokeColor: [0, 0, 0],
        strokeWidth: 2,
        polygonDash: [10, 10]
    },
    planningScenarioDrawIcons: {
        box: "bi-square",
        circle: "bi-circle",
        delete: "bi-eraser-fill",
        deleteAll: "bi-trash",
        doubleCircle: "bi-record-circle",
        geometries: "bi-hexagon-fill",
        line: "bi-slash-lg",
        modify: "bi-tools",
        pen: "bi-pencil-fill",
        point: "bi-circle-fill",
        polygon: "bi-octagon",
        redo: "bi-arrow-right",
        symbols: "bi-circle-square",
        undo: "bi-arrow-left"
    },
    planningScenarioDrawTypesGeometrie: ["line", "box", "polygon", "circle", "doubleCircle"],
    planningScenarioDrawTypesMain: ["polygon", "box"],
    planningScenarioSelectedDrawType: "",
    planningScenarioSelectedDrawTypeMain: "",
    planningScenarioStrokeRange: [1, 16],
    selectedInteraction: "draw",
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
