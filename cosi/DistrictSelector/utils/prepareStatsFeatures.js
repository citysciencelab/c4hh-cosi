import mapping from "../../assets/mapping.json";
import Feature from "ol/Feature";

/**
 * Parses the stats from olFeatures to the district object
 * @param {Array<module:ol/Feature>} olFeatures - the parsed features from WFS
 * @param {Object} district - the district to append the data to
 * @param {Object} districtLevel - the current districtLevel
 * @returns {void}
 */
export function parseFeatures (olFeatures, district, districtLevel) {
    /**
     * parse LTF
     * @todo refactor
     */
    if (olFeatures.every(feature => feature.get("jahr") && feature.get("jahr_timestamp"))) {
        if (district.statFeatures.length > 0) {
            updateStatFeaturesFromLTF(olFeatures, district.statFeatures);
        }
        else {
            const features = createStatFeaturesFromLTF(olFeatures, districtLevel, district);

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
 * @param {module:ol/feature} feature -
 * @returns {void}
 */
export function prepareStatsFeatures (feature) {
    const mappingObject = findMappingObjectByCategory(feature.get("kategorie"));

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
export function createStatFeaturesFromLTF (ltfFeatures, districtLevel) {
    const statFeatureList = [];

    mapping.forEach(obj => {
        const statFeature = new Feature({
            kategorie: obj.value,
            group: obj.group
        });

        statFeature.set(districtLevel.stats.keyOfAttrName, ltfFeatures[0].get(districtLevel.stats.keyOfAttrName));
        if (districtLevel.referenceLevel) {
            statFeature.set(districtLevel.referenceLevel.stats.keyOfAttrName, ltfFeatures[0].get(districtLevel.referenceLevel.stats.keyOfAttrName));
        }
        ltfFeatures.forEach(feature => {
            statFeature.set("jahr_" + feature.get("jahr"), feature.get(obj.category));
        });
        statFeatureList.push(statFeature);
    });

    return statFeatureList;
}

/**
 * Updates the statistical features from the loaded long table format features.
 * @param {ol/Feature[]} ltfFeatures - long table format features.
 * @param {ol/Feature[]} statFeatures - The statistical features of a district.
 * @returns {void}
 */
export function updateStatFeaturesFromLTF (ltfFeatures, statFeatures) {
    const lftFeatureKeys = Object.keys(ltfFeatures[0].getProperties());

    mapping.forEach((obj, i) => {
        if (lftFeatureKeys.includes(obj.category)) {
            ltfFeatures.forEach(feature => {
                statFeatures[i].set("jahr_" + feature.get("jahr"), feature.get(obj.category));
            });
        }
    });
}

/**
 * Finds a mapping object by its category.
 * @param {String} value - The category to search by.
 * @returns {object} The mapping object.
 */
export function findMappingObjectByCategory (value) {
    if (typeof value !== "string") {
        console.error(`prepareStatFeatures.findMappingObjectByCategory: ${value} has to be defined and a string.`);
        return undefined;
    }
    return mapping.find(obj => {
        return obj.category === value;
    });
}
