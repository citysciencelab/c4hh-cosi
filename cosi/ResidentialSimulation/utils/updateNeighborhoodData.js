/**
 * Modifies the neighborhood values based on the new value geometry
 * @param {Number} newArea - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @returns {void} the keys and values of invalid values
 */
export function updateArea (newArea, neighborhood, fallbacks) {
    const area = newArea,
        livingSpace = neighborhood.livingSpace,
        householdSize = neighborhood.avgHouseholdSize,
        gfz = neighborhood.gfz,
        bgf = area * gfz,
        residents = Math.round(100 * (bgf * neighborhood.livingSpaceRatio) / livingSpace) / 100,
        populationDensity = residents * 1000000 / area,
        units = residents / householdSize;

    neighborhood.residents = residents;
    neighborhood.populationDensity = populationDensity;
    neighborhood.bgf = bgf;
    neighborhood.housingUnits = units;

    fallbacks.residents = residents;
    fallbacks.populationDensity = populationDensity;
    fallbacks.bgf = bgf;
    fallbacks.housingUnits = units;
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newUnits - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateUnits (newUnits, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const area = neighborhood.area,
        livingSpace = neighborhood.livingSpace,
        householdSize = neighborhood.avgHouseholdSize,
        livingSpaceRatio = neighborhood.livingSpaceRatio,
        units = newUnits,
        residents = units * householdSize,
        populationDensity = residents * 1000000 / area,
        bgf = residents * (livingSpace / neighborhood.livingSpaceRatio),
        gfz = bgf / area,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.housingUnits = fallbacks.housingUnits;

        return invValues;
    }
    neighborhood.residents = residents;
    neighborhood.populationDensity = populationDensity;
    neighborhood.bgf = bgf;
    neighborhood.gfz = gfz;
    neighborhood.housingUnits = units;

    fallbacks.housingUnits = units;
    fallbacks.residents = residents;
    fallbacks.populationDensity = populationDensity;
    fallbacks.bgf = bgf;
    fallbacks.gfz = gfz;

    return [];
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newResidents - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateResidents (newResidents, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const area = neighborhood.area,
        livingSpace = neighborhood.livingSpace,
        householdSize = neighborhood.avgHouseholdSize,
        livingSpaceRatio = neighborhood.livingSpaceRatio,
        residents = newResidents,
        units = newResidents / householdSize,
        populationDensity = residents * 1000000 / area,
        bgf = residents * (livingSpace / livingSpaceRatio),
        gfz = bgf / area,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.residents = fallbacks.residents;

        return invValues;
    }
    neighborhood.housingUnits = units;
    neighborhood.populationDensity = populationDensity;
    neighborhood.bgf = bgf;
    neighborhood.gfz = gfz;
    neighborhood.residents = residents;

    fallbacks.residents = residents;
    fallbacks.housingUnits = units;
    fallbacks.populationDensity = populationDensity;
    fallbacks.bgf = bgf;
    fallbacks.gfz = gfz;

    return [];
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newDensity - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateDensity (newDensity, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const area = neighborhood.area,
        livingSpace = neighborhood.livingSpace,
        householdSize = neighborhood.avgHouseholdSize,
        livingSpaceRatio = neighborhood.livingSpaceRatio,
        populationDensity = newDensity,
        residents = (newDensity * area) / 1000000,
        units = residents / householdSize,
        bgf = residents * (livingSpace / livingSpaceRatio),
        gfz = bgf / area,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.populationDensity = fallbacks.populationDensity;

        return invValues;
    }
    neighborhood.housingUnits = units;
    neighborhood.residents = residents;
    neighborhood.bgf = bgf;
    neighborhood.gfz = gfz;
    neighborhood.populationDensity = populationDensity;

    fallbacks.populationDensity = populationDensity;
    fallbacks.housingUnits = units;
    fallbacks.residents = residents;
    fallbacks.bgf = bgf;
    fallbacks.gfz = gfz;

    return [];
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newLivingSpace - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateLivingSpace (newLivingSpace, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const area = neighborhood.area,
        householdSize = neighborhood.avgHouseholdSize,
        livingSpaceRatio = neighborhood.livingSpaceRatio,
        gfz = neighborhood.gfz,
        bgf = gfz * area,
        livingSpace = newLivingSpace,
        residents = (bgf * livingSpaceRatio) / livingSpace,
        populationDensity = residents * 1000000 / area,
        units = residents / householdSize,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.livingSpace = fallbacks.livingSpace;

        return invValues;
    }
    neighborhood.livingSpace = livingSpace;
    neighborhood.housingUnits = units;
    neighborhood.residents = residents;
    neighborhood.populationDensity = populationDensity;
    neighborhood.bgf = bgf;
    neighborhood.livingSpace = livingSpace;

    fallbacks.livingSpace = livingSpace;
    fallbacks.housingUnits = units;
    fallbacks.residents = residents;
    fallbacks.populationDensity = populationDensity;
    fallbacks.bgf = bgf;

    return [];
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newLivingSpaceRatio - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateLivingSpaceRatio (newLivingSpaceRatio, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const
        area = neighborhood.area,
        householdSize = neighborhood.avgHouseholdSize,
        gfz = neighborhood.gfz,
        bgf = neighborhood.bgf,
        livingSpace = neighborhood.livingSpace,
        livingSpaceRatio = newLivingSpaceRatio,
        residents = (bgf * livingSpaceRatio) / livingSpace,
        populationDensity = residents * 1000000 / area,
        units = residents / householdSize,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.livingSpaceRatio = fallbacks.livingSpaceRatio;

        return invValues;
    }
    neighborhood.housingUnits = units;
    neighborhood.residents = residents;
    neighborhood.populationDensity = populationDensity;
    neighborhood.livingSpaceRatio = livingSpaceRatio;

    fallbacks.livingSpaceRatio = livingSpaceRatio;
    fallbacks.housingUnits = units;
    fallbacks.residents = residents;
    fallbacks.populationDensity = populationDensity;

    return [];
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newGfz - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateGfz (newGfz, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const area = neighborhood.area,
        householdSize = neighborhood.avgHouseholdSize,
        livingSpace = neighborhood.livingSpace,
        livingSpaceRatio = neighborhood.livingSpaceRatio,
        gfz = newGfz,
        bgf = gfz * area,
        residents = (bgf * livingSpaceRatio) / livingSpace,
        populationDensity = residents * 1000000 / area,
        units = residents / householdSize,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.gfz = fallbacks.gfz;

        return invValues;
    }
    neighborhood.housingUnits = units;
    neighborhood.residents = residents;
    neighborhood.populationDensity = populationDensity;
    neighborhood.bgf = bgf;
    neighborhood.gfz = gfz;

    fallbacks.gfz = gfz;
    fallbacks.housingUnits = units;
    fallbacks.residents = residents;
    fallbacks.populationDensity = populationDensity;
    fallbacks.bgf = bgf;

    return [];
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newBgf - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateBgf (newBgf, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const area = neighborhood.area,
        householdSize = neighborhood.avgHouseholdSize,
        livingSpace = neighborhood.livingSpace,
        livingSpaceRatio = neighborhood.livingSpaceRatio,
        bgf = newBgf,
        gfz = bgf / area,
        residents = (bgf * livingSpaceRatio) / livingSpace,
        populationDensity = residents * 1000000 / area,
        units = residents / householdSize,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.bgf = fallbacks.bgf;

        return invValues;
    }
    neighborhood.housingUnits = units;
    neighborhood.residents = residents;
    neighborhood.populationDensity = populationDensity;
    neighborhood.gfz = gfz;
    neighborhood.bgf = bgf;

    fallbacks.bgf = bgf;
    fallbacks.housingUnits = units;
    fallbacks.residents = residents;
    fallbacks.populationDensity = populationDensity;
    fallbacks.gfz = gfz;

    return [];
}

/**
 * Modifies all neighborhood values based on the new value of the respective slider
 * @param {Number} newHouseholdSize - the new value
 * @param {Number} neighborhood - the neighborhood to edit
 * @param {Number} fallbacks - the values to fall back on, if invalid
 * @param {Number} polygonArea - the area of the polygon
 * @param {Object} lowerBounds - the lower bounds for possible values
 * @param {Object} upperBounds - the upper bounds for possible values
 * @returns {Array<Object>} the keys and values of invalid values
 */
export function updateHousholdSize (newHouseholdSize, neighborhood, fallbacks, polygonArea, lowerBounds, upperBounds) {
    if (polygonArea === 0) {
        return [];
    }
    const area = neighborhood.area,
        livingSpace = neighborhood.livingSpace,
        residents = neighborhood.residents,
        gfz = neighborhood.gfz,
        livingSpaceRatio = neighborhood.livingSpaceRatio,
        bgf = gfz * area,
        householdSize = newHouseholdSize,
        populationDensity = residents * 1000000 / area,
        units = residents / householdSize,
        invValues = invalidValues(householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio, lowerBounds, upperBounds);

    if (invValues.length > 0) {
        neighborhood.avgHouseholdSize = fallbacks.avgHouseholdSize;

        return invValues;
    }
    neighborhood.housingUnits = units;
    neighborhood.populationDensity = populationDensity;
    neighborhood.bgf = bgf;
    neighborhood.avgHouseholdSize = householdSize;

    fallbacks.avgHouseholdSize = householdSize;
    fallbacks.housingUnits = units;
    fallbacks.populationDensity = populationDensity;
    fallbacks.bgf = bgf;

    return [];
}

/**
 * finds the invalid values and returns them
 * @param {Number} householdSize - avg. household size
 * @param {Number} populationDensity - population density (per km²)
 * @param {Number} gfz - building footprint / ground area
 * @param {Number} bgf - gross floor area
 * @param {Number} livingSpace - living space per person
 * @param {Number} area - ground area of the polygon
 * @param {Number} livingSpaceRatio - livingSpace / bgf
 * @param {Object} lowerBounds - lower bounds
 * @param {Object} upperBounds - upper bounds
 * @returns {Object} values out of bounds
 */
function invalidValues (householdSize, populationDensity, gfz, bgf, livingSpace, area, livingSpaceRatio,
    lowerBounds = {householdSize: 1.0, populationDensity: 0, gfz: 0, livingSpace: 10, livingSpaceRatio: 0},
    upperBounds = {householdSize: 6.0, populationDensity: 50000, gfz: 4.0, livingSpace: 100, livingSpaceRatio: 1}
) {
    const invValues = [];

    if (householdSize < lowerBounds.householdSize || householdSize > upperBounds.householdSize) {
        invValues.push({id: "householdSize", val: householdSize});
    }
    if (populationDensity < lowerBounds.populationDensity || populationDensity > upperBounds.populationDensity) {
        invValues.push({id: "populationDensity", val: populationDensity});
    }
    if (gfz < lowerBounds.gfz || gfz > upperBounds.gfz) {
        invValues.push({id: "gfz", val: gfz});
    }
    if (bgf < lowerBounds.gfz * area || bgf > upperBounds.gfz * area) {
        invValues.push({id: "bgf", val: bgf});
    }
    if (livingSpace < lowerBounds.livingSpace || livingSpace > upperBounds.livingSpace) {
        invValues.push({id: "livingSpace", val: livingSpace});
    }
    if (livingSpaceRatio < lowerBounds.livingSpaceRatio || livingSpaceRatio >= upperBounds.livingSpaceRatio) {
        invValues.push({id: "livingSpaceRatio", val: livingSpaceRatio});
    }

    return invValues;
}

