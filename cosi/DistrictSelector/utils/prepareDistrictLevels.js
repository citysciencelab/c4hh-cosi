import {describeFeatureType, getFeatureDescription} from "../../../../src/shared/js/api/wfs/describeFeatureType.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import {getContainingDistrictForExtent} from "../../utils/geomUtils.js";
import isObject from "../../../../src/shared/js/utils/isObject.js";

/**
 * Prepares the district level objects for the district selector.
 * Each district level is assigned its layer, the districts, the reference level (the next higher) and a list of all district names.
 * Will no longer be executed once all district levels have their layer.
 * @param {Object[]} districtLevels - All avaiable district level objects.
 * @param {module:ol/layer[]} layerList - An array of layers.
 * @returns {void}
 */
export async function prepareDistrictLevels (districtLevels, layerList) {
    const filteredDistrictLevels = getAllDistrictsWithoutLayer(districtLevels).reverse();

    if (filteredDistrictLevels.length > 0) {
        filteredDistrictLevels.forEach(async (districtLevel, index) => {
            districtLevel.selectedValues = [];
            // the reference level, null if there is none reference level
            districtLevel.referenceLevel = index > 0 ? filteredDistrictLevels[index - 1] : null;
            // the subLevel, null if there is none sublevel
            districtLevel.subLevel = index < filteredDistrictLevels.length - 1 ? filteredDistrictLevels[index + 1] : null;
            // // the stats layer for the district level
            districtLevel.stats.layers = getRawLayersById(districtLevel.stats.layerIds);
            // the layer for the district level
            districtLevel.layer = getLayerById(layerList, districtLevel.layerId);
            // property names for the WFS GetFeature request for the stats features, without geometry
            if (!districtLevel.propertyNameList &&
                typeof districtLevel?.layer?.get === "function" &&
                (districtLevel.layer.get("typ") === "WFS" || districtLevel.layer.get("typ") === "OAF")) {
                const propertyNameList = await getPropertyNameList(districtLevel.stats.layers);

                if (!districtLevel.propertyNameList && Array.isArray(propertyNameList) && propertyNameList.length > 0) {
                    districtLevel.propertyNameList = propertyNameList;
                }
            }
        });

        checkIfFeaturesLoaded(filteredDistrictLevels[0]);
    }
}

/**
 * Checks whether the features are already loaded or not. Runs through the districts recursively and gets required data.
 * @param {Object} districtLevel - The level starting with the top level district.
 * @returns {void}
 */
function checkIfFeaturesLoaded (districtLevel) {
    if (districtLevel.layer.getSource().getFeatures().length) {
        // all districts at this level
        districtLevel.districts = getDistricts(districtLevel);
        // the names of all avaible districts
        districtLevel.nameList = getNameList(districtLevel.layer, districtLevel.keyOfAttrName);
        districtLevel.filterableValues = districtLevel.nameList;
        if (districtLevel.subLevel !== null) {
            checkIfFeaturesLoaded(districtLevel.subLevel);
        }
    }
    districtLevel.layer.getSource().on("featuresloadend", () => {
        // all districts at this level
        districtLevel.districts = getDistricts(districtLevel);
        // the names of all avaible districts
        districtLevel.nameList = getNameList(districtLevel.layer, districtLevel.keyOfAttrName);
        districtLevel.filterableValues = districtLevel.nameList;
        if (districtLevel.subLevel !== null) {
            checkIfFeaturesLoaded(districtLevel.subLevel);
        }
    });
}

/**
 * Returns all district level objects without layer.
 * @param {Object[]} districtLevels - All avaiable district level objects.
 * @returns {Object[]} The filtered district levels or an empty array.
 */
export function getAllDistrictsWithoutLayer (districtLevels) {
    if (!Array.isArray(districtLevels)) {
        console.error(`prepareDistrictLevels.getAllDistrictsWithoutLayer: ${districtLevels} has to be defined and an array.`);
        return [];
    }
    return districtLevels.filter(district => {
        return typeof district.layer === "undefined";
    });
}

/**
 * Creates a new 'district' object for all features from the layer and return them.
 * @param {Object} districtLevel - The district level.
 * @param {module:ol/layer} districtLevel.layer - The layer of the district level.
 * @param {String} districtLevel.keyOfAttrName - The key for the attribute containing the name of the district.
 * @param {String} districtLevel.keyOfAttrNumber - The key for the attribute containing the number of the district.
 * @param {String} districtLevel.label - The label of the district level.
 * @param {String[]|undefined} districtLevel.duplicateDistrictNames - Names of districts that trigger conflicts.
 * @param {Object} referenceLevel - The reference level from the district level.
 * @param {String} layerId - The id of the layer for the district level.
 * @returns {Object[]} The districts.
 */
export function getDistricts ({layer, keyOfAttrName, keyOfAttrNumber, label, duplicateDistrictNames, referenceLevel, layerId}) {
    if (typeof layer !== "object" || layer === null || Array.isArray(layer) || typeof keyOfAttrName !== "string" || typeof label !== "string") {
        console.error(`prepareDistrictLevels.getDistricts: ${layer} has to be defined and an object. ${keyOfAttrName} has to be defined and a string. ${label} has to be defined and a string`);
        return [];
    }

    const districts = [];

    layer.getSource().getFeatures().forEach(function (feature) {
        if (feature.get("statgebiet") && feature.get("statgebiet") === "106001") {
            layer.getSource().removeFeature(feature);
            return;
        }
        districts.push({
            // the administration feature (district)
            adminFeature: feature,
            // an array for all statistical features of this district, currently used for calculations
            statFeatures: [],
            // an array with the original statistical features of this district as backup
            originalStatFeatures: [],
            // flag district is selected
            isSelected: false,
            // id of the district
            getId: () => feature.getId(),
            // label of the district
            getLabel: () => {
                const districtName = feature.get(keyOfAttrName);

                // rename feature name for reference levels to avoid naming conflict
                if (duplicateDistrictNames?.includes(districtName)) {
                    return `${districtName} (${label.slice(0, -1)})`;
                }
                return districtName;
            },
            // name of the district
            getName: () => {
                // The names of St.Pauli and Co. are inconsistent in the different services.
                if (feature.get(keyOfAttrName) && feature.get(keyOfAttrName).indexOf("St. ") !== -1) {
                    return feature.get(keyOfAttrName).replace(/ /, "");
                }
                return feature.get(keyOfAttrName);
            },
            getNumber: () => feature.get(keyOfAttrNumber),
            // name of the reference (parent) district
            getReferencDistrictName: () => getReferencDistrictName(referenceLevel, feature, layerId),
            referencDistrictName: getReferencDistrictName(referenceLevel, feature, layerId)
        });
    });

    return districts;
}

/**
 * Gets the name of the reference district.
 * @param {Object} referenceLevel -The reference level from the feature district level.
 * @param {ol/Feature} feature - The feature where to set the name of the reference district.
 * @param {String} layerId - The id of the layer for the feature.
 * @returns {String|null} The name of the reference district if avaiable.
 */
function getReferencDistrictName (referenceLevel, feature, layerId) {
    // Districtlevel = Hamburg
    if (referenceLevel === null) {
        return null;
    }
    // Districtlevel = Stadtteile/Bezirke
    // The info for this can be found already at the admin feautre
    if (layerId !== "6071" && layerId !== "27773") {
        return feature.get(referenceLevel.keyOfAttrName);
    }
    // Districtlevel = Stat.Gebiete
    const referenceDistrict = getContainingDistrictForExtent(referenceLevel, feature.getGeometry().getInteriorPoint().getExtent());

    return referenceDistrict.getName();
}

/**
 * Returns the layer of the passed id or undefined if no layer is found.
 * @param {module:ol/layer[]} layerList - An array of layers.
 * @param {String} id - The layer id.
 * @returns {module:ol/layer/Layer|undefined} The found layer.
 */
export function getLayerById (layerList, id) {
    if (!Array.isArray(layerList) || typeof id !== "string") {
        console.error(`prepareDistrictLevels.getLayerById: ${layerList} has to be defined and an array. ${id} has to be defined and a string`);
        return undefined;
    }

    return layerList.find(layer => {
        return layer.get("id") === id;
    });
}

/**
 * Returns the raw layer object(s) by the given layerId(s).
 * @param {String[]} layerIds - The id of the layer(s).
 * @returns {Object[]} List of found raw layer object(s) or an empty array.
 */
export function getRawLayersById (layerIds) {
    if (!Array.isArray(layerIds)) {
        console.error(`prepareDistrictLevels.getRawLayersById: ${layerIds} has to be defined and an array.`);
        return [];
    }
    const layerList = [];

    layerIds.forEach(layerId => {
        const foundRawLayer = rawLayerList.getLayerWhere({id: layerId});

        if (foundRawLayer) {
            layerList.push(foundRawLayer);
        }
    });

    return layerList;
}

/**
 * Returns the names of all avaible districts in the district level.
 * @param {module:ol/layer/VectorLayer} layer - A vector layer.
 * @param {String} keyOfAttrName - The key for the attribute "name" of the district features.
 * @returns {String[]} The names of the districts or an empty array.
 */
export function getNameList (layer, keyOfAttrName) {
    if (typeof layer !== "object" || layer === null || Array.isArray(layer) || typeof keyOfAttrName !== "string") {
        console.error(`prepareDistrictLevels.getNameList: ${layer} has to be defined and an object. ${keyOfAttrName} has to be defined and a string`);
        return [];
    }
    const nameList = [];

    layer.getSource().getFeatures().forEach(feature => {
        if (typeof feature.get(keyOfAttrName) !== "undefined") {
            // The names of St.Pauli and Co. are inconsistent in the different services.
            if (feature.get(keyOfAttrName).indexOf("St. ") !== -1) {
                feature.set(keyOfAttrName, feature.get(keyOfAttrName).replace(/ /, ""));
            }
            nameList.push(feature.get(keyOfAttrName));
        }
    });

    nameList.sort();

    return [...new Set(nameList)];
}

/**
 * Returns a list of all property names for the given raw layer objects(s), without geometries.
 * @param {Object[]} layers - The raw layer object(s).
 * @returns {[String[]]} The property names for each layer.
 */
export async function getPropertyNameList (layers) {
    if (!Array.isArray(layers)) {
        console.error(`prepareDistrictLevels.getPropertyNameList: ${layers} has to be defined and an array.`);
        return [];
    }
    const propertyNameList = [];

    for (let i = 0; i < layers.length; i++) {
        propertyNameList[i] = [];

        if (layers[i].typ === "WFS") {
            // get the property names by the 'DescribeFeatureType' request
            const json = await describeFeatureType(layers[i].url),
                description = getFeatureDescription(json, layers[i].featureType);

            if (description) {
                description.forEach(element => {
                    // "gml:" => geometry property
                    if (element.type.search("gml:") === -1) {
                        propertyNameList[i].push(element.name);
                    }
                });
            }
        }
        else if (layers[i].typ === "OAF") {
            if (isObject(layers[i].gfiAttributes) && Object.keys(layers[i].gfiAttributes).length > 0) {
                propertyNameList[i] = Object.keys(layers[i].gfiAttributes);
            }
        }
    }

    return propertyNameList;
}

/**
 * Retrieves synonymous district names from a map provided in config.json
 * @param {String} districtName - the district name to map
 * @param {Object} districtLevel - the districtLevel to check
 * @returns {String} the district name synonym or the original district name
 */
export function mapDistrictNames (districtName, districtLevel) {
    return districtLevel.districtNamesMap?.[districtName] || districtName;
}
