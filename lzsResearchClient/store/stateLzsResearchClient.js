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
 * @property {String} zipFileName - name part of the created zip file name, will be extended by '.zip'
 * @property {Number} maxDownloadMB - maximal allowed size of files to select for download in MB (default 500, set -1 to skip max size check)
 * @property {Number} maxResultValueCount - maximal number of results to be requested from server in attributive search (default 25)

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
 * @property {Object[]} attributesToDownload - List of dataclass objects to download from all search responses, used in TabDownload
 * @property {String} selectedInstanceId - instance id of the selected primary object to watch details for
 * @property {String} errorMessage - message text for errors from backend or while ziping download
 * @property {String} currentProgressValue - message for current progress for ziping the files for download
 * @property {Number} progressNow - percentage of progress in ziping and downloading files, -1 to hide progressbar
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
    zipFileName: "GeoDataDepot-Download",
    maxDownloadMB: 500,
    maxResultValueCount: 25,

    // Addon state
    showLoadingSpinner: false,
    globalError: null,
    dispatchRequestUrl: null,
    requestToken: null,
    requestTokenExpireTime: null,
    dataClassList: [],
    searchAttributeResponse: [],
    attributesToDownload: [],
    placeholderDataClassList: {},
    placeholderJsonPath: "",
    archiveYears: {},
    archiveList: [],
    selectedInstanceId: null,
    errorMessage: "",
    currentProgressValue: "",
    progressNow: -1,

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
