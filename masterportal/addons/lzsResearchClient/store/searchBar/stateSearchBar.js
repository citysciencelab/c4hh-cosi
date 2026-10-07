/**
 * Defines the initial state for the searchBar module.
 * @module modules/searchBar/store/stateSearchBar
 *
 * @property {String[]} configPaths Array of config file paths to check; first match is applied.
 * @property {String} [currentSide="secondaryMenu"] Specifies which menu side in which the searchBar is integrated.
 * @property {Number} [minCharacters=3] Minimum number of characters before a search is triggered.
 * @property {String} [placeholder="common:modules.searchBar.placeholder.address"] Placeholder text displayed in the input field when empty.
 * @property {Array} [searchInterfaces=[]] List of search interface configurations.
 * @property {Number} [suggestionListLength=5] Upper limit for entries shown in the suggestion dropdown.
 * @property {Number} [timeout=5000] Maximum wait time in milliseconds for a search interface response.
 * @property {Number} [zoomLevel=8] Map zoom level applied when jumping to a search result.
 * @property {String} [currentAvailableCategories=""] Currently available search categories.
 * @property {String} [currentActionEvent=""] Most recently triggered action event name, e.g. "showLayerInfo".
 * @property {String} [searchInput=""] Raw search input string.
 * @property {Object[]} [searchInterfaceInstances=[]] Instantiated search interface objects.
 * @property {Object[]} [searchSuggestions=[]] Aggregated suggestions returned by search interfaces.
 * @property {Object[]} [searchResults=[]] Aggregated results returned by search interfaces.
 * @property {Boolean} [showAllResults=false] Whether the full result list is displayed.
 * @property {Array} [showAllResultsSearchInterfaceInstances=["elasticSearch", "gazetteer"]] Search Interface instances.
 * @property {Boolean} [searchResultsActive=true] Whether the results panel is currently active.
 * @property {Object} [iconsByActions={setMarker: "bi-geo-alt-fill", zoomToResult: "bi-zoom-in"}] Maps action names to their corresponding icon classes.
 * @property {Number[]|undefined} [addressSearchCoordinates=undefined] Coordinates derived from an address search.
 * @property {String} [alkisBaseUrl=""] Base URL used for ALKIS service requests.
 */
const state = {
    configPaths: [],
    currentSide: "secondaryMenu",
    minCharacters: 3,
    placeholder: "common:modules.searchBar.placeholder.address",
    searchInterfaces: [],
    suggestionListLength: 5,
    timeout: 5000,
    zoomLevel: 8,
    currentAvailableCategories: "",
    currentActionEvent: "",
    searchInput: "",
    searchInterfaceInstances: [],
    searchSuggestions: [],
    searchResults: [],
    showAllResults: false,
    showAllResultsSearchInterfaceInstances: ["elasticSearch", "gazetteer"],
    searchResultsActive: true,
    iconsByActions: {
        setMarker: "bi-geo-alt-fill",
        zoomToResult: "bi-zoom-in"
    },
    addressSearchCoordinates: undefined,
    alkisBaseUrl: ""
};

export default state;
