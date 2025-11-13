/**
 * User type definition
 * @typedef {Object} state
 * State properties for the CombinedGfi logic:
 * @property {Boolean} alternativeGeometry Indicates if alternative geometry is used
 * @property {Object|null} alternativePolygonFeature Alternative polygon feature
 * @property {Number[]} bufferDistances Distances for buffering
 * @property {Boolean} showBuffer Indicates if buffer is shown
 * @property {String} fileName Filename for exports
 * @property {Array} columns Columns for the result table
 * @property {Array} rows Rows for the result table
 * @property {Array} gfiResults Raw GFI results
 * @property {Object|null} feature Selected feature
 * @property {Boolean} isLoading Loading indicator
 * @property {Boolean} initialized Initialization status
 * @property {Array} layersToRequest Configuration of layers to request
 * @property {Array} layerResults Results per layer
 * @property {Number} itemsPerPage Items per page (pagination)
 * @property {String|null} previousGeometry Previous geometry (as JSON string)
 * @property {Array} additionalRequests Additional requests
 * @property {Array} additionalRequestResults Additional request results
 * @property {String} currentFormat Current export format
 * @property {String[]} shownFormatList List of exportable formats
 * @property {Object|null} bufferedFeature Buffered feature
 * @property {Array} bufferedLayerResults Buffered layer results
 * @property {String} printServerUrl URL of the mapfish print server
 * @property {String} printConfigPath Path to the print configuration file
 * @property {String} printUtilsPath Path to the printUtils.js file
 */
const state = {
    // Additional state for the CombinedGfi logic
    alternativeGeometry: false,
    alternativePolygonFeature: null,
    bufferDistances: [500, 1000, 1500],
    bufferAttributes: {},
    bufferHint: "",
    showBuffer: false,
    fileName: "additional:modules.combinedGfi.defaultFileName",
    columns: [],
    rows: [],
    gfiResults: [],
    feature: null,
    isLoading: false,
    initialized: false,
    layersToRequest: [],
    layerResults: [],
    bufferedLayerResults: [],
    itemsPerPage: 5,
    previousGeometry: null,
    additionalRequests: [],
    additionalRequestResults: [],
    currentFormat: "PDF",
    shownFormatList: ["PDF", "DOC", "JSON"],
    bufferedFeature: null,
    printServerUrl: "",
    printConfigPath: "",
    printUtilsPath: ""
};

export default state;
