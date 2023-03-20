
/**
 * Split an array into chunks.
 * @param {*[]} array - The Array to split.
 * @param {Number} size - Size of one chunk.
 * @returns {*[]} The split chunks.
 */
function splitIntoChunks (array, size) {
    if (!Array.isArray(array)) {
        console.error("addons/cosi/utils/array/splitIntoChunks: The first parameter must be an array, but got " + typeof array);
        return false;
    }

    if (typeof size !== "number") {
        console.error("addons/cosi/utils/array/splitIntoChunks: The second parameter must be a number, but got " + typeof size);
        return false;
    }

    const result = [];

    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);

        result.push(chunk);
    }
    return result;
}

module.exports = {
    splitIntoChunks
};
