/**
 * Removes the highlight from a specified 3D tile feature by updating the Cesium3DTileStyle.
 *
 * @param {string} featureId - The ID of the 3D tile feature to remove the highlight from.
 */
export default function remove3DFeatureHighlight (featureId) {
    const scene = mapCollection.getMap("3D").getCesiumScene(),
        tilesetList = scene._primitives._primitives.filter(p => p instanceof Cesium.Cesium3DTileset);

    requestAnimationFrame(() => {
        for (const tileset of tilesetList) {
            if (tileset.style && tileset.style._color && tileset.style._color._conditions) {
                const updatedConditions = tileset.style._color._conditions.filter(condition => {
                    return !condition[0].includes(`\${id} === '${featureId}'`);
                });

                tileset.style = new Cesium.Cesium3DTileStyle({
                    color: {conditions: updatedConditions}
                });
            }
        }
    });
}
