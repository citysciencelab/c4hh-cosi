import stateSearchBar from "./searchBar/stateSearchBar.js";

/**
 * Masterportal state
 * @typedef {Object} MapState
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the component
 * @property {String} id - id of component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 * @property {Boolean} standAlonePortal - flag if tool is used in a standalone portal, then titles are removed via CSS (config-param)
 * @property {String} apiBasePath - Base url for api requests to gis portal
 * @property {String} placeholderJsonPath - Path placeholder.json file in portalconfigs.
 * @property {Object} placeholderDataClassList - Placeholder data class list from placeholder.json
 * @property {Number} minScaleValue - minimal scale value for search in map extent (e.g. 5000 for 1 : 5.000)
 * @property {Number} maxGeometryArea - maximum area allowed for polygons in geometric search (in squaremeter, default 16 km² = 16000000 m²)
 * @property {String} zipFileName - name part of the created zip file name, will be extended by '.zip'
 * @property {Number} maxDownloadMB - maximal allowed size of files to select for download in MB (default 500, set -1 to skip max size check)
 * @property {Number} maxResultValueCount - maximal number of results to be requested from server in attributive search (default 25)
 * @property {String} menuWidthOnStart - percentage of width for sidebar when opening this addon initially (default '40%')

 * Addon state
 * @property {Boolean} showLoadingSpinner - Show loading spinner or not
 * @property {Object|null} globalError - Global error message, {type: "", message: ""}
 * @property {String|null} dispatchRequestUrl - Url for dispatch requests to gis portal
 * @property {String|null} requestToken - Token for requests to gis portal
 * @property {Number|null} requestTokenExpireTime - Expire time of request token
 * @property {Array} dataClassList - List of data classes (see fetchDataClassList) used in tab search
 * @property {Array} archiveList - List of archives to use in TabSearch
 * @property {Object} archiveYears - Map of archive IDs to year data { [archiveId]: { year: "2022", archiveName: ["xyz", "abc"] } }
 * @property {Object[]} searchAttributeResponse - List of dataclass objects from the search response
 * @property {String} selectedDetail - Object containing the selected instanceId and primaryDataId to show details for
 * @property {String} errorMessage - message text for errors from backend or while zipping download
 * @property {AbortController|null} downloadAbortController - AbortController for the download request, null if no download is running
 * @property {String} progressPhase - current phase of the progress modal ("start"|"fetch"|"dossier"|"download"|"zip"|"done"|"error")
 * @property {Number} progressCurrent - current progress value for zipping and downloading files
 * @property {Number} progressTotal - total progress value for zipping and downloading files
 * @property {Number} progressNow - percentage of progress in zipping and downloading files, -1 to hide progressbar
 * @property {Object|null} parcelSourceData - JSON data for the parcel search, containing the parcel districts and their respective names and ids
 * @property {String|null} parcelSearchSelectSource - URL to fetch the list of parcel districts for the parcel search
 * @property {Set<String>} pendingPrimaryDataFetches - The instance ids of pending primary data fetches, used to avoid duplicate fetches and for the progress bar
 *
 * Draw state
 * @property {Object} lzsCurrentLayout - Current layout settings for the drawn features in the draw component
 * @property {Object} lzsDrawIcons - Icons used in the draw component
 * @property {String[]} lzsDrawTypes - Draw types available in the draw component
 * @property {Object} lzsGeomLayout - Layout settings for the shown geometry feature in the map, also used for indication in the table
 */

const state = {
    ...stateSearchBar,
    // Masterportal state
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "lzsResearchClient",
    id: "lzsResearchClient",
    name: "additional:modules.lzsResearchClient.name",
    description: "additional:modules.lzsResearchClient.description",
    icon: "bi-database-down",
    isVisibleInMenu: true,
    deactivateGFI: true,
    standAlonePortal: false,
    hasMouseMapInteractions: true,
    apiBasePath: "",
    minScaleValue: 5000,
    maxGeometryArea: 16000000,
    zipFileName: "GeoDataDepot-Download",
    maxDownloadMB: 500,
    maxResultValueCount: 25,
    menuWidthOnStart: "40%",

    // Addon state
    showLoadingSpinner: false,
    globalError: null,
    dispatchRequestUrl: null,
    requestToken: null,
    requestTokenExpireTime: null,
    dataClassList: [],
    searchAttributeResponse: [],
    placeholderDataClassList: {},
    placeholderJsonPath: "",
    archiveYears: {},
    archiveList: [],
    selectedDetail: {
        instanceId: null,
        primaryDataId: null
    },
    errorMessage: "",
    downloadAbortController: null,
    progressPhase: "",
    progressCurrent: 0,
    progressTotal: 0,
    progressNow: -1,
    parcelSourceData: null,
    parcelSearchSelectSource: null,
    pendingPrimaryDataFetches: new Set(),

    // Draw component
    lzsCurrentLayout: {
        fillColor: [148, 10, 65, 0.2],
        strokeColor: [148, 10, 65],
        strokeWidth: 3,
        circleStrokeColor: [148, 10, 65]
    },
    lzsDrawIcons: {
        box: "bi-square",
        deleteAll: "bi-trash",
        pen: "bi-pencil",
        point: "bi-dot",
        polygon: "bi-hexagon"
    },
    lzsDrawTypes: ["box", "polygon", "pen", "point"],
    lzsSelectedDrawType: "",
    lzsSelectedInteraction: null,
    lzsDrawEdits: ["deleteAll"],
    lzsGeomLayout: {
        fillColor: [50, 168, 149, 0.3],
        strokeColor: [50, 168, 149],
        strokeWidth: 2,
        circleFillColor: [50, 168, 149, 0.5],
        circleStrokeColor: [50, 168, 149],
        circleRadius: 10
    }
};

export default state;
