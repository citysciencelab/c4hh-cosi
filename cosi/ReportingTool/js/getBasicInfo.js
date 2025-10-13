import isObject from "@shared/js/utils/isObject";

/**
 * Gets the basic information of the selected features.
 * @param {Object} selectedDistrictLevel The selected district level.
 * @returns {Object[]} an array with objects.
 */
function getOverviewBasicInfo (selectedDistrictLevel) {
    const levels = this.getLevelInfos(selectedDistrictLevel),
        result = [];
    let calculatedArea = 0;

    selectedDistrictLevel.districts.forEach(district => {
        if (district.isSelected) {
            calculatedArea += district.adminFeature.getGeometry().getArea();
        }
    });

    levels.reverse().forEach(level => {
        const [label, districts] = Object.entries(level)[0],
            formattedDistricts = Object.keys(districts).join(", ");

        if (formattedDistricts) {
            result.push({label, value: formattedDistricts});
        }
    });

    result.push({label: "Größe", value: `${calculateHA(calculatedArea)} ha`});

    return result;
}

/**
 * Gets the info for the current level and is getting called recursive
 * if the selected level has a reference level.
 * @param {Object} districtLevel The district level.
 * @param {Object[]} levels The levels as object.
 * @param {String[]} [referenceLevelNames=undefined] The names of the reference districts to get infos for.
 * @returns {Object[]} a list of all necessary levels.
 */
function getLevelInfos (districtLevel, levels = [], referenceLevelNames = undefined) {
    const skipIsSelected = levels.length > 0,
        currentLevel = {},
        upperLevel = {},
        isReferenceLevelExisting = isObject(districtLevel.referenceLevel);

    currentLevel[districtLevel.label] = {};

    districtLevel.districts.forEach(district => {
        const districtName = district.getName();

        if (!skipIsSelected && !district.isSelected && typeof districtName !== "undefined"
            || (Array.isArray(referenceLevelNames) && !referenceLevelNames.includes(districtName))) {
            return;
        }
        currentLevel[districtLevel.label][districtName] = true;
        if (isReferenceLevelExisting) {
            upperLevel[district.getReferencDistrictName()] = true;
        }
    });
    levels.push(currentLevel);

    if (isReferenceLevelExisting) {
        this.getLevelInfos(districtLevel.referenceLevel, levels, Object.keys(upperLevel));
    }
    return levels;
}


/**
 * Calculates and rounds the hekta value of the given value.
 * @param {Number} value The value.
 */
function calculateHA (value) {
    return Math.round(value / 10000);
}

export default {
    getOverviewBasicInfo,
    getLevelInfos
};
