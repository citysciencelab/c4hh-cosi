import SearchInterface from "../../../../src/modules/searchBar/searchInterfaces/searchInterface.js";

/**
 * The example search interface as addon.
 * @constructs
 * @extends SearchInterface
 * @param {String} [hitTemplate="default"] The template for rendering the hits.
 * @param {Object} [resultEvents] Actions that are executed when an interaction, such as hover or click, is performed with a result list item.
 * @param {String[]} [resultEvents.onClick=["setMarker", "zoomToFeature"]] Actions that are fired when clicking on a result list item.
 * @param {String[]} [resultEvents.onHover=["setMarker"]] Actions that are fired when hovering on a result list item.
 * @param {String} [searchInterfaceId="exampleSearch"] The id of the service interface.
 * @returns {void}
 */
export default function SearchInterfaceExampleSearch ({hitTemplate, resultEvents, searchInterfaceId} = {}) {
    SearchInterface.call(this,
        "client",
        searchInterfaceId || "exampleSearch",
        resultEvents || {
            onClick: ["setMarker", "zoomToResult"],
            onHover: ["setMarker"]
        },
        hitTemplate
    );
}

SearchInterfaceExampleSearch.prototype = Object.create(SearchInterface.prototype);

/**
 * Search in location finder search interface.
 * @override
 * @param {String} searchInput The search input.
 * @returns {void}
 */
SearchInterfaceExampleSearch.prototype.search = async function (searchInput) {
    this.pushHitsToSearchResults([
        {
            events: this.normalizeResultEvents(this.resultEvents, {coordinates: [566601.20, 5928101.43]}),
            category: "example",
            id: "exampleSearch_1",
            icon: "bi-signpost-2",
            name: "Example Search: " + searchInput
        }
    ]);

    return this.searchResults;
};


/**
 * Creates the possible actions and fills them.
 * @param {Object} searchResult The search result of locationFinder.
 * @param {Object} extendedData Extended data for searchInterface location finder.
 * @param {Object} extendedData.classDefinition Contains class definitions to use for search result.
 * @param {Number} extendedData.epsgCode The EPSG-code of the coordinate reference system.
 * @returns {Object} The possible actions.
 */
SearchInterfaceExampleSearch.prototype.createPossibleActions = function (searchResult) {
    return {
        setMarker: {
            coordinates: searchResult.coordinates
        },
        zoomToResult: {
            coordinates: searchResult.coordinates
        }
    };
};
