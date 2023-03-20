/**
 * Compares two lists for equality.
 * @param {*[]} arr1 - the 1st list to compare
 * @param {*[]} arr2 - the 2nd list to compare
 * @param {Boolean} [ordered=false] - Controls whether the order of the list should be considered.
 * @returns {Boolean} True if the passed arrays are equal.
 */
function isEqual (arr1, arr2, ordered = false) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
        console.error("utils/array/isEqual: The first two parameters must be an array, but got " + typeof arr1 + " and " + typeof arr2);
        return false;
    }

    if (typeof ordered !== "boolean") {
        console.error("utils/array/isEqual: Third parametes must be a boolean, but got " + typeof ordered);
        return false;
    }

    if (arr1.length !== arr2.length) {
        return false;
    }

    if (!ordered) {
        for (const item1 of arr1) {
            const foundItemInArr2 = arr2.find(item2 => item2 === item1);

            if (!foundItemInArr2) {
                return false;
            }
        }
    }
    else {
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
    }
    return true;
}

module.exports = {
    isEqual
};
