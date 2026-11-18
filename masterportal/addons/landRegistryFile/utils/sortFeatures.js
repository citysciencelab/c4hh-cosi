import localeCompare from "@shared/js/utils/localeCompare.js";

/**
 * Checks if a value is numeric.
 * @param {any} val - The value to check.
 * @returns {boolean} true if the value is numeric, false otherwise.
 */
function isNumeric (val) {
    return typeof val === "string" && val.trim() !== "" && !isNaN(val);
}

/**
 * Sorts the features alphanumerically.
 * @param {Object[]} features - The features to sort.
 * @param {string} columnName - The column name to sort by.
 * @returns {Object[]} The sorted features.
 */
export function getSortedFeatures (features, columnName) {
    const sorted = [...features].sort((a, b) => {
        const va = a.properties?.[columnName],
            vb = b.properties?.[columnName];

        if (va === null || va === "") {
            return 1;
        }
        if (vb === null || vb === "") {
            return -1;
        }

        if (isNumeric(va) && isNumeric(vb)) {
            return parseFloat(va) - parseFloat(vb);
        }

        if (isNumeric(va)) {
            return -1;
        }

        if (isNumeric(vb)) {
            return 1;
        }
        return localeCompare(va, vb, undefined, {ignorePunctuation: true});
    });

    return sorted;
}
