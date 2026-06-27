import Feature from "ol/Feature";
import getMappingJson from "../../utils/getMappingJson";

/**
 * Parses the stats from olFeatures to the district object
 * @param {Array<module:ol/Feature>} olFeatures - the parsed features from WFS
 * @param {Object} district - the district to append the data to
 * @param {Object} districtLevel - the current districtLevel
 * @returns {void}
 */
export async function parseFeatures (olFeatures, district, districtLevel) {
    /**
     * parse LTF
     * @todo refactor
     */
    if (olFeatures.every(feature => feature.get("jahr"))) {
        if (district.statFeatures.length > 0) {
            await updateStatFeaturesFromLTF(olFeatures, district.statFeatures);
        }
        else {
            const features = await createStatFeaturesFromLTF(olFeatures, districtLevel, district);

            // add statFeatures to district
            district.statFeatures.push(...features);
            // store original data on the district as a copy
            district.originalStatFeatures.push(...features.map(f => f.clone()));

        }
    }
    /**
     * try old timeline format alternatively
     */
    else {
        olFeatures.forEach(prepareStatsFeatures);

        // add statFeatures to district
        district.statFeatures.push(...olFeatures);
        // store original data on the district as a copy
        district.originalStatFeatures = olFeatures.map(f => f.clone());
    }
}

/**
 * Sets necessary properties on the feature, beautifies keys.
 * @param {module:ol/feature} feature - The feature.
 * @param {Object[]|null} mappingJson - The mapping json data or null.
 * @returns {void}
 */
export async function prepareStatsFeatures (feature, mappingJson = null) {
    const mappingObject = await findMappingObjectByCategory(feature.get("kategorie"), mappingJson ? mappingJson : await getMappingJson());

    feature.unset("geom"); // fallback for accidentially loaded geometries
    if (typeof mappingObject !== "undefined") {
        feature.set("kategorie", mappingObject.value);
        feature.set("group", mappingObject.group);
    }
}

/**
 * Creates new statistical features from the loaded long table format features.
 * @param {module:ol/feature[]} ltfFeatures - long table format features.
 * @param {Object} districtLevel - the current districtLevel
 * @returns {module:ol/feature[]} The statistical features.
 */
export async function createStatFeaturesFromLTF (ltfFeatures, districtLevel) {
    const statFeatureList = [],
        mappingJson = await getMappingJson();

    if (Array.isArray(mappingJson) && mappingJson.length > 0) {
        mappingJson.forEach(obj => {
            const statFeature = new Feature({
                kategorie: obj.value,
                group: obj.group
            });

            statFeature.set(districtLevel.stats.keyOfAttrName[0], ltfFeatures[0].get(districtLevel.stats.keyOfAttrName[0]));
            if (districtLevel.referenceLevel) {
                statFeature.set(districtLevel.referenceLevel.stats.keyOfAttrName[0], ltfFeatures[0].get(districtLevel.referenceLevel.stats.keyOfAttrName[0]));
            }
            ltfFeatures.forEach(feature => {
                statFeature.set("jahr_" + feature.get("jahr"), feature.get(obj.category));
            });
            statFeatureList.push(statFeature);
        });
    }

    return statFeatureList;
}

/**
 * Updates the statistical features from the loaded long table format features.
 * @param {ol/Feature[]} ltfFeatures - long table format features.
 * @param {ol/Feature[]} statFeatures - The statistical features of a district.
 * @returns {void}
 */
export async function updateStatFeaturesFromLTF (ltfFeatures, statFeatures) {
    const lftFeatureKeys = Object.keys(ltfFeatures[0].getProperties()),
        mappingJson = await getMappingJson();

    if (Array.isArray(mappingJson) && mappingJson.length > 0) {
        mappingJson.forEach((obj, i) => {
            if (lftFeatureKeys.includes(obj.category)) {
                ltfFeatures.forEach(feature => {
                    statFeatures[i].set("jahr_" + feature.get("jahr"), feature.get(obj.category));
                });
            }
        });
    }
}

/**
 * Finds a mapping object by its category.
 * @param {String} value - The category to search by.
 * @param {Object[]} mappingJson - The mapping json data or null.
 * @returns {object} The mapping object.
 */
export async function findMappingObjectByCategory (value, mappingJson) {
    if (typeof value !== "string" || mappingJson === null || !Array.isArray(mappingJson)) {
        console.error(`prepareStatFeatures.findMappingObjectByCategory: ${value} has to be defined and a string.`);
        return undefined;
    }

    return mappingJson.find(obj => {
        return obj.category === value;
    });
}
