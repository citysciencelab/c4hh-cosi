import {mapDistrictNames} from "./prepareDistrictLevels.js";

/**
 * Finds a district by the given name.
 * @param {Object[]} districts - The list of all districts.
 * @param {String} name - The name of the searched district.
 * @returns {Object|undefined} The found district or undefined if no district was found.
 */
function getGroupedStats (initMapping, districtLevel, districts, statsByGroup = {}) {
    if (!Array.isArray(initMapping) || !districtLevel) {
        return {};
    }

    const selectedStatFeatures = districts.map(district => district.statFeatures).flat();

    initMapping.forEach(item => {
        if (!statsByGroup[item.group]) {
            statsByGroup[item.group] = {};
        }
        if (!statsByGroup[item.group][item.value]) {
            statsByGroup[item.group][item.value] = {};
        }
        const attributeName = districtLevel.stats.keyOfAttrName[0],
            feature = selectedStatFeatures.find(stat => stat.get("kategorie") === item.value),
            districtName = feature.get(attributeName);

        feature.set("valueType", item.valueType);
        statsByGroup[item.group][item.value][districtName] = feature.getProperties();
    });

    if (districtLevel.referenceLevel !== null) {
        const refNames = districts.map(district => {
                return mapDistrictNames(district.getReferencDistrictName(), districtLevel.referenceLevel);
            }),
            // reference districts
            refDistricts = districtLevel.referenceLevel.districts.filter(district => {
                return refNames.includes(mapDistrictNames(district.getName(), districtLevel.referenceLevel));
            });

        getGroupedStats(initMapping, districtLevel.referenceLevel, districtLevel.referenceLevel.label === "Hamburg" ? districtLevel.referenceLevel.districts : refDistricts, statsByGroup);
    }

    return statsByGroup;

}

export {
    getGroupedStats
};
