import Feature from "ol/Feature";

/**
 * Extracts the features in a cluster.
 * @param {ol/Feature} feature - The map feature to unpack.
 * @returns {ol/Feature[]|Boolean} An array of the clustered features or false if an error has occurred.
 */
function unpackCluster (feature) {
    if (typeof feature !== "object" || feature instanceof Feature === false) {
        console.error(`utils/features/unpackCluster: feature must be an ol feature object. Got ${feature} instead`);
        return false;
    }
    return feature.get("features") ? feature.get("features") : [feature];
}

module.exports = {
    unpackCluster
};
