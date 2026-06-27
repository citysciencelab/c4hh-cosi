/**
 * Calculates the screen position of a given 3D Cartesian coordinate in the Cesium scene.
 * This function checks which coordinate transformation function is available
 * (either `worldToWindowCoordinates` or `wgs84ToWindowCoordinates`) and uses it to convert
 * the 3D Cartesian point into a 2D screen position.
 *
 * @param {Cesium.Scene} scene - The Cesium scene where the transformation should occur.
 * @param {Cesium.Cartesian3} cartesian - The 3D Cartesian coordinate to transform into screen space.
 * @returns {Cesium.Cartesian2|null} The 2D screen position of the given 3D Cartesian coordinate, or `null` if unable to project.
 * @throws {Error} Will throw an error if neither transformation function is found or if projection fails.
 */
export default function calculateScreenPosition (scene, cartesian) {
    let screenPosition = null;

    if (Cesium.SceneTransforms.worldToWindowCoordinates) {
        screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(scene, cartesian);
    }
    else if (Cesium.SceneTransforms.wgs84ToWindowCoordinates) {
        screenPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, cartesian);
    }
    else {
        console.warn("No suitable function found for coordinate transformation.");
        return null;
    }

    if (!screenPosition) {
        console.warn("Unable to project the position into screen space.");
        return null;
    }

    return screenPosition;
}
