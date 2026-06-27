/**
 * Applies a Cesium3DTileStyle to the picked feature to highlight it.
 * Preserves existing conditions while adding new ones.
 *
 * @param {string} featureId The ID of the 3D tile feature to highlight.
 * @param {string} color The color to apply to the feature.
 */
export default function applyTileStyle (featureId, color) {
    const scene = mapCollection.getMap("3D").getCesiumScene(),
        tilesets = scene._primitives._primitives.filter(p => p instanceof Cesium.Cesium3DTileset);

    requestAnimationFrame(() => {
        tilesets.forEach(tileset => {
            const existingConditions = tileset.style?._color?._conditions || [],
                newCondition = [`\${id} === '${featureId}'`, color];

            if (!existingConditions.some(([condition]) => condition === newCondition[0])) {
                existingConditions.push(newCondition);
                tileset.style = new Cesium.Cesium3DTileStyle({color: {conditions: existingConditions}});
            }
        });
    });
}


