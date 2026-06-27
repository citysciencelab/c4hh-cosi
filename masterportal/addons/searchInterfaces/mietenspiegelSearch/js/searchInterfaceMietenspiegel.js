import crs from "@masterportal/masterportalapi/src/crs.js";
import SearchInterfaceElasticSearch from "../../../../src/modules/searchBar/searchInterfaces/searchInterfaceElasticSearch.js";

/**
 * The search interface to the mietenspiegel.
 * @module addons/searchInterfaces/MietenspiegelSearch/SearchInterfaceMietenspiegel
 * @name SearchInterfaceMietenspiegel
 * @param {Object} hitMap Object mapping result object attributes to keys.
 * @param {String} hitMap.coordinate Attribute value will be mapped to the attribute key.
 * @param {String} hitMap.id Attribute value will be mapped to the attribute key.
 * @param {String} hitMap.layerId Attribute value will be mapped to the attribute key.
 * @param {String} hitMap.name Attribute value will be mapped to the attribute key.
 * @param {String} hitMap.toolTip Attribute value will be mapped to the attribute key.
 * @param {String} serviceId Search service id. Resolved using the **[rest-services.json](rest-services.json.md)** file. *
 * @param {String} [epsg="EPSG:25832"] The epsg code from the result coordinates.
 * @param {String} [hitIcon="bi-list-ul"] CSS icon class of search results, shown before the result name.
 * @param {String} [hitTemplate="default"] The template for rendering the hits.
 * @param {Object} [hitType="common:modules.searchBar.type.subject"] Search result type shown in the result list after the result name.
 * @param {Object} [payload={}] Matches the customObject description.
 * @param {String} [responseEntryPath=""] Response JSON attribute path to found features.
 * @param {Object} [resultEvents] Actions that are executed when an interaction, such as hover or click, is performed with a result list item.
 * @param {String[]} [resultEvents.onClick=["addLayerToTopicTree"]] Actions that are fired when clicking on a result list item.
 * @param {String} [searchInterfaceId="elasticSearch"] The id of the service interface.
 * @param {String} [searchStringAttribute="searchString"] Search string attribute name for `payload` object.
 * @param {String} [requestType="POST"] Request type.
 * @constructs
 * @extends SearchInterfaceElasticSearch
 * @returns {void}
 */
export default function SearchInterfaceMietenspiegel ({hitMap, serviceId, epsg, hitIcon, hitTemplate, hitType, payload, responseEntryPath, resultEvents, searchInterfaceId, searchStringAttribute, requestType} = {}) {
    SearchInterfaceElasticSearch.call(this,
        {hitMap, serviceId, epsg, hitIcon, hitTemplate, hitType, payload, responseEntryPath, resultEvents, searchInterfaceId, searchStringAttribute, requestType}
    );
}

SearchInterfaceMietenspiegel.prototype = Object.create(SearchInterfaceElasticSearch.prototype);

/**
 * Creates the possible actions and fills them.
 * @override
 * @param {Object} searchResult The search result of elastic search.
 * @returns {Object} The possible actions.
 */
SearchInterfaceMietenspiegel.prototype.createPossibleActions = function (searchResult) {
    let coordinates = this.getResultByPath(searchResult, this.hitMap?.coordinate);

    if (Array.isArray(coordinates)) {
        coordinates = crs.transformToMapProjection(mapCollection.getMap("2D"), this.epsg, [parseFloat(coordinates[0]), parseFloat(coordinates[1])]);
    }

    return {
        setMarker: {
            coordinates: coordinates
        },
        zoomToResult: {
            coordinates: coordinates
        },
        "Modules/MietenspiegelFormular/setAddressCoordinate": {
            rootAction: true,
            coordinates
        }
    };
};
