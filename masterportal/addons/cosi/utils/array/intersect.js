/**
 * Gets the intersection (overlap) of two arrays with primitive data types.
 * Objects in the arrays are not checked and will be removed.
 * Returns an empty array if nothing found.
 * @param {*[]} arr1 - The first array.
 * @param {*[]} arr2 - The second array.
 * @returns {*[]} The intersection of the two arrays.
 */
export default function intersect (arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
        console.error("utils/array/intersect: Both passed parameters must be an array, but got " + typeof arr1 + " and " + typeof arr2);
        return [];
    }

    return arr1.filter((item) => {
        return arr2.includes(item);
    });
}
